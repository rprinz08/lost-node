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

var tools = require('./tools');

function Point(reqLocGeom) {
	var self = this;
	self.type = 'Point';
	
	if(!reqLocGeom)
		return;
		
	if(!reqLocGeom.type || reqLocGeom.type != 'Point')
		throw new Error('Unable to create point from invalid location');
	
	var gmlNs = reqLocGeom.ns;
	
	// get geometry ID
	//self.id = tools.get(reqLocGeom, '@.id');
	//if(!self.id)
	//	throw new Error('location.Point.id missing.');
	
	// get SRS
	self.srs = tools.get(reqLocGeom, '@.srsName');
	if(!self.srs) 
		throw new Error('location.Point.srsName missing.');
	
	// get point coordinates
	var pointPos = tools.get(reqLocGeom, (gmlNs ? gmlNs + ':' : '') + 'pos');
	var pointRx = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*(-?\d{1,3}(?:\.\d+)?)\s*(-?\d+(?:\.\d+)?)?\s*$/;
	var pointMatch = pointRx.exec(pointPos);
	if(!pointMatch)
		throw new Error('location.Point.pos missing or invalid');

	// Note: elevation not supported for the moment
	// [lon, lat, elevation]
	//self.coordinates = [parseFloat(pointMatch[2]), parseFloat(pointMatch[1]), parseFloat(pointMatch[3])];
	self.coordinates = [parseFloat(pointMatch[2]), parseFloat(pointMatch[1])];
}

module.exports.Point = Point;
