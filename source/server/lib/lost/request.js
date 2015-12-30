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
	tools = require('../tools'),
	xmlLib = require('libxmljs'),
	xml2js = require('libxml-to-js'),
	fs = require('fs');

var schemaDoc;

exports.init = function () {
	// read LoST rng schema
	var rng = fs.readFileSync('./lib/schemas/LoST.rng');
	schemaDoc = xmlLib.parseXml(rng);
}

exports.process = function (lostReq, callback) {
	var deferred = Q.defer();

	// raw request must be a string
	if (!_.isString(lostReq))
		deferred.reject(new Error('LoST request must be a XML string'));
	
	// try to create XML object from request XML string
	// https://github.com/polotek/libxmljs/wiki	
	var reqXmlDoc = xmlLib.parseXml(lostReq);

	// validate request XML object against LoST RNG schema
	// https://github.com/polotek/libxmljs/pull/273
	var isOK = reqXmlDoc.rngValidate(schemaDoc);
	if (!isOK)
		deferred.reject(new Error('LoST request XML invalid (' +
			reqXmlDoc.validationErrors.toString().replace(/[\r\n\t]/g, ' ') + ')'));
	
	// convert valid LoST request to JSON object
	xml2js(lostReq, function (error, result) {
		if (error)
			deferred.reject(new Error('Error parsing LoST request XML (' + error + ')'));

		result.requestType = reqXmlDoc.root().name();
		deferred.resolve(result);
	});

	return deferred.promise;
};

exports.init();

