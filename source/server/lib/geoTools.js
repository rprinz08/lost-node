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

var tools = require('./tools'),
	_ = require('lodash'),
	xmlLib = require('libxmljs'),
	point = require('./point');

exports.parseRequestGMLtoGeoJson = function (req) {
	var id;
	var gmlNs = '';
	var geomTypes = ['Point', 'Polygon', 'Circle', 'Ellipse', 'ArcBand'];
	var locations = [];
	var locationTypes = {};
	
	// try to get GML namespace for locations
	var ns = tools.get(req, '@.xmlns');
	if (ns) {
		for (var n in ns) {
			if (ns.hasOwnProperty(n)) {
				if (ns[n] === global.LoST.XML_GML_URN) {
					gmlNs = n;
					break;
				}
			}
		}
	}
	
	// check if location exists
	if (!req.location)
		throw new Error('location missing');
	
	// make array from one or more locations
	locations = (req.location.constructor === Array) ?
		req.location : [req.location];

	if (locations.length < 1)
		throw new Error('location missing');
	
	// process locations
	locations.forEach(function (loc) {
		// get location ID
		id = tools.get(loc, '@.id');
		if (!id)
			throw new Error('location.id missing');
		loc.id = id;
	
		// check location profiles
		if (!tools.has(loc, '@.id') || !tools.has(loc, '@.profile'))
			throw new Error('location.id or location.profile missing');

		var lp = loc['@'].profile;
		if (lp != 'geodetic-2d' && lp != 'civic')
			throw new Error('location.profile (' + lp + ') invalid');

		if (!locationTypes.hasOwnProperty(lp))
			locationTypes[lp] = 0;
		locationTypes[lp]++;
		if (locationTypes[lp] > 1)
			throw new Error('location.profile (' + lp + ') used more than once');

		loc.profile = lp;
		delete loc['@'];

		// resolve civic address location to geometry
		if (loc.profile == 'civic') {
			var civic = tools.get(loc, 'civicAddress');
			if (!civic)
				throw new Error('address infos for profile "civic" missing');

			loc.civic = civic;
			delete loc.civicAddress;
		}
		
		// extract geodetic 2D geometries
		if (loc.profile == 'geodetic-2d') {
			var geom;
			var geomName;
			geomTypes.some(function (gt) {
				geomName = (gmlNs ? gmlNs + ':' : '') + gt;
				geom = tools.get(loc, geomName);
				if (geom) {
					geom.type = gt;
					return true;
				}
				else
					return false;
			});
			
			// add GML namespace
			geom.ns = gmlNs;
			
			// transform geometries from XML to JS
			// for the moment only Point is supported
			switch (geom.type) {
				case 'Point':
					geom = new point.Point(geom);
					break;
					
				/*
				case 'Polygon':
					break;
					
				case 'Circle':
					break;
					
				case 'Ellipse':
					break;
					
				case 'ArcBand':
					break;
				*/

				default:
					throw new Error('location has invalid or unsupported ' +
						'geometry type (' + geom.type + ')');
					break;
			}

			loc.geom = geom;
			delete loc[geomName];
		}
	});

	return locations;
}

exports.GeoJsonToGML = function (geom, xmlNode) {
	if (!geom)
		return null;

	var geomType = _.get(geom, 'type', null);
	var geomCrs = _.get(geom, 'crs.properties.name', null);
	if (tools.isNullOrEmpty(geomType) || tools.isNullOrEmpty(geomCrs))
		return null;

	// if no XML node given create a root node
	var rootNode = xmlNode;
	if (!rootNode)
		rootNode = new xmlLib.Document();

	// check if XML namespaces exists. If not create them
	var xmlNs = rootNode.namespaces();
	var lostNs;
	var gmlNs;
	xmlNs.forEach(function (ns) {
		if (ns && !lostNs && ns.href() === global.LoST.XML_LOST_URN)
			lostNs = ns;
		if (ns && !gmlNs && ns.href() === global.LoST.XML_GML_URN)
			gmlNs = ns;
	})
	lostNs = (lostNs ? lostNs : rootNode.defineNamespace(global.LoST.XML_LOST_URN));
	gmlNs = (gmlNs ? gmlNs : rootNode.defineNamespace('p2', global.LoST.XML_GML_URN));

	// recursive node creation functions
	
	// create XML node with optional namespace and/or value
	var createNodeNs = function (parentNode, nodeName, nodeValue, namespace) {
		var node = parentNode.node(nodeName, nodeValue);
		if (namespace)
			node.namespace(namespace);
		return node;
	};

	// create GML nodes from various GeoJSON objects
	var createNode = function (_type, _parentNode, _coords, _addSRS) {
		var _c = (_coords ? _coords : geom.coordinates);
		var _node = createNodeNs(_parentNode, _type, null, gmlNs);
		if(_addSRS)
			_node.attr({ srsName: 'urn:ogc:def:crs:' + geomCrs.replace(':', '::') });

		switch (_type) {
			case 'MultiPolygon':
				var polygonMemberNode = createNodeNs(_node, 'polygonMember', null, gmlNs);
				_c.forEach(function (polygon) {
					createNode('Polygon', polygonMemberNode, polygon, false);
				});
				break;

			case 'Polygon':
				_c.forEach(function (ring, index) {
					var ringTypeNode = createNodeNs(_node, (!index ? 'exterior' : 'interior'), null, gmlNs);
					var ringNode = createNodeNs(ringTypeNode, 'LinearRing', null, gmlNs);
					ring.forEach(function (position) {
						createNodeNs(ringNode, 'pos', position[0] + ' ' + position[1], gmlNs);
					});
				});
				break;
				
			case 'Point':
				_node.attr({ axisLabels: 'x y' });
				createNodeNs(_node, 'pos', _c[0] + ' ' + _c[1], gmlNs);
				break;
		};
	};
	
	createNode(geomType, rootNode, null, true);

	return rootNode;
}
