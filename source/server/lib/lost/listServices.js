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

var _ = require('lodash'),
	xmlLib = require('libxmljs'),
	tools = require('../tools');
var LostError = tools.LostError;

/*
	Handle section 10 of RFC5222 List Services: <listServices>
	https://tools.ietf.org/html/rfc5222#section-10
	Return a list of all available service URN's this server provides
	service mappings for. The list contains only those service URN which
	start with the provided URN pattern
*/

exports.process = function (req) {
	if (!req)
		throw new LostError('listServices request empty',
			LostError.types.badRequest);

	var serviceURNpattern = _.get(req, 'service', null);
	if (!serviceURNpattern)
		throw new LostError('No URN to query for specified',
			LostError.types.badRequest);

	return findServices(serviceURNpattern)
		.then(function (services) {
			if (!_.isArray(services))
				throw new LostError('Invalid database response querying services ' +
					'with URN (' + serviceURNpattern + ')',
						LostError.types.internalError);
			if (services.length < 1)
				throw new LostError('No services matching URN pattern ' +
					'(' + serviceURNpattern + ') found',
						LostError.types.notFound);

			var xml = createResponse(services, req);

			return xml;
		})
}


// create XML response for getServiceBoundary LoST request
function createResponse(services, req) {
	if (!_.isArray(services) || services.length < 1)
		throw new LostError('No services found',
			LostError.types.notFound);

	// create XML response document
    var res = new xmlLib.Document();
	var root = res.node('listServicesResponse');
	root.defineNamespace(global.LoST.XML_LOST_URN);

	// ensure services array is distinct	
	services = _.uniq(services, false, 'initData.URN');

	var serviceList = '';
	services.forEach(function (service) {
		var urn = _.get(service, 'initData.URN', null);
		if (urn)
			serviceList += urn + '\n';
	});
	root
		.node('serviceList', serviceList);

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

// find all services whos URN starts with the given URN
// Note: should make a distinct query. Unfortunately Jaydata is
// unable to perform this
function findServices(serviceURNpattern) {
	return global.odata.__context.SVCs
		.filter(function (service) {
			return service.URN.startsWith(this.urn);
		},
			{
				urn: serviceURNpattern
			})
		.toArray()
		.then(function (services) {
			return services;
		})
		.fail(function (error) {
			return null;
		});
}
