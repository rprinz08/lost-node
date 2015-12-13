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
	xmlLib = require('libxmljs'),
	tools = require('../tools'),
	geoTools = require('../geoTools');
var LostError = tools.LostError;

/*
	Handle section 9 of RFC5222 Retrieving the Service Boundary via <getServiceBoundary>
	https://tools.ietf.org/html/rfc5222#section-9
	Return the service boundary matching the given reference id (= key)
*/

exports.process = function (req) {
	if (!req)
		throw new LostError('getServiceBoundary request empty',
			LostError.types.badRequest);

	var referenceID = _.get(req, '@.key', null);

	if (global.odata.__config.type === 'mongoDB') {
		var db = global.odata.__native.__context;

		return mongoFindBoundary(db.collection('ServiceBoundaries'), 
				'ReferenceID', referenceID)
			.then(function (boundaries) {
				if (!_.isArray(boundaries))
					throw new LostError('Invalid database response querying boundary ('
						+ referenceID + ')',
							LostError.types.internalError);
				if (boundaries.length < 1)
					throw new LostError('Service boundary ('
						+ referenceID + ') not found',
							LostError.types.notFound);
				if (boundaries.length > 1)
					throw new LostError('Multiple service boundaries with same key ('
						+ referenceID + ')',
							LostError.types.internalError);

				var xml = createResponse(_.get(boundaries, '0', null), req);

				return xml;
			})
	}
	else
		throw new LostError('Unsupported DB provider (' + global.odata.__config.type + ')',
			LostError.types.internalError);
}


// create XML response for getServiceBoundary LoST request
function createResponse(boundary, req) {
	if (!boundary)
		throw new LostError('Boundary not found',
			LostError.types.notFound);

	// create XML response document
    var res = new xmlLib.Document();
	var root = res.node('getServiceBoundaryResponse');
	root.defineNamespace(global.LoST.XML_LOST_URN)
	root.defineNamespace('p2', global.LoST.XML_GML_URN);

	var geom = _.get(boundary, 'BoundaryGeom', null);
	if (geom) {
		var boundaryNode = root
			.node('serviceBoundary')
			.attr({
				profile: 'geodetic-2d'
			});

		geoTools.GeoJsonToGML(geom, boundaryNode, null);
	}

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

	return res;
}


function mongoFindBoundary(collection, field, referenceID, projection) {
	var deferred = Q.defer();
	var request = {};

	request[field] = referenceID;

	if (!projection)
		projection = {};

	collection
		.find(request, projection)
		.toArray(function (error, result) {
			if (error)
				deferred.reject(error);
			else
				deferred.resolve(result);
		});

	return deferred.promise;
};


