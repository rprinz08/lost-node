"use strict";

/*
	lost-node, a node.js based RFC5222 LoST server
    Copyright (C) 2015,2016  richard.prinz@min.at

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var Q = require('q'),
	_ = require('lodash'),
	util = require('util'),
	moment = require('moment'),
	xmlLib = require('libxmljs'),
	tools = require('../tools'),
	atob = require('atob'),
	btoa = require('btoa'),
	geoTools = require('../geoTools');
var LostError = tools.LostError;

/*
	Handle section 11 of RFC5222 List Services By Location: <listServicesByLocation>
	https://tools.ietf.org/html/rfc5222#section-11
*/

exports.process = function (req) {
	if (!req)
		throw new LostError('listServicesByLocation request empty',
			LostError.types.badRequest);
	
	// service
	var serviceURN = req.service;
	
	// parse out locations from request
	var locations = geoTools.parseRequestGMLtoGeoJson(req);
	if (locations.length < 1)
		throw new LostError('Invalid findService request. Locations missing',
			LostError.types.badRequest);
		
	// make a spatial query to find all services available at the
	// given point. this is done using the native db context (only mongoDB
	// so far) because the free version of jaydata does not support spatial
	// queries
	if (global.odata.__config.type === 'mongoDB') {
		var db = global.odata.__native.__context;

		var geometrySearchQueue = [];
		locations.forEach(function (location) {
			switch (location.profile) {
				case 'geodetic-2d':
					geometrySearchQueue.push(
						findBoundaries(
							db.collection('ServiceBoundaries'),
							'BoundaryGeom',
							location,
							{
								SVC__ID: true,
								ReferenceID: true
							}));
					break;

				default:
					tools.logWarning('Unsupported location profile (' + location.profile + ') - ignored');
					break;
			};
		});
		
		// then narrow the spatial search to only contain services with a
		// given service URN
		return Q.all(geometrySearchQueue)
			.then(function (locations) {
				var searchQueue = [];
				locations.forEach(function (location) {
					var servicesSearchQueue = [];
					location.services = [];
					location.boundaries.forEach(function (boundary) {
						servicesSearchQueue.push(findServices(boundary.SVC__ID, serviceURN));
					});
					searchQueue.push(Q.all(servicesSearchQueue)
						.then(function (services) {
							services = services.filter(function (service) {
								return !!service;
							});
							location.services = services;
							return location;
						}));
				});

				return Q.all(searchQueue);
			})
			.then(function (locations) {
				locations = locations.filter(function (service) {
					return !!service;
				});

				// answer with the first found location
				var xml = createResponse(_.get(locations, '0', null), req);

				return xml;
			})
	}
	else
		throw new LostError('Unsupported DB provider (' + global.odata.__config.type + ')',
			LostError.types.internalError);
}			


// create XML response for findService LoST request
function createResponse(location, req) {
	if (!location || !location.services || !location.services.length)
		throw new LostError('No services found',
			LostError.types.notFound);

	// create XML response document
    var res = new xmlLib.Document();
	var root = res.node('listServicesByLocationResponse');
	root.defineNamespace(global.LoST.XML_LOST_URN)
	root.defineNamespace('p2', global.LoST.XML_GML_URN);

	// ensure services array is distinct	
	location.services = _.uniq(location.services, false, 'initData.URN');

	var serviceList = '';
	location.services.forEach(function (service) {
		var urn = _.get(service, 'initData.URN', null);
		if (urn)
			serviceList += urn + '\n';
	});
	root
		.node('serviceList', serviceList);

	// service path in case of recursive requests
	root
		.node('path')
		.node('via')
		.attr({
			source: 'resolver.example'
		}).parent()
		.node('via')
		.attr({
			source: 'authoritative.example'
		});

	// which location from the request was used to answer the query
	root
		.node('locationUsed')
		.attr({
			id: location.id
		});

	return res;
}


// find all services with a given serviceID and serviceURN via oData
function findServices(serviceID, serviceURN) {
	// mongo ids are base64 encoded
	var mongoID = btoa(serviceID);

	var context = global.odata.__context.SVCs
		.include('URIs')
		.include('Numbers')
		.include('Boundaries');

	var query;
	if (tools.isNullOrEmpty(serviceURN))
		query = context.single(function (service) {
			return service.ID == this.id;
		},
			{
				id: mongoID
			});
	else
		query = context.single(function (service) {
			return service.ID == this.id && service.URN.startsWith(this.urn);
		},
			{
				id: mongoID,
				urn: serviceURN
			});

	return query
		.then(function (service) {
			return service;
		})
		.fail(function (error) {
			return null;
		});
}


// find all service entries where the given lat/lon point intersects
// their service area polygons. Uses native mongo driver
function findBoundaries(collection, field, location, projection) {
	var deferred = Q.defer();
	var request = {};

	request[field] = {
		$geoIntersects: {
			$geometry: location.geom
		}
	};

	if (!projection)
		projection = {};

	collection
		.find(request, projection)
		.toArray(function (error, result) {
			if (error)
				deferred.reject(error);
			else {
				location.boundaries = result;
				deferred.resolve(location);
			}
		});

	return deferred.promise;
};

