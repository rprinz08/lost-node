"use strict";

var _ = require('lodash'),
	config = require("../config/config"),
	tools = require('../lib/tools'),
	util = require('util'),
	xmlBuilder = require('xmlbuilder'),
	lostRequest = require('../lib/lost/request'),
	findService = require('../lib/lost/findService'),
	getServiceBoundary = require('../lib/lost/getServiceBoundary'),
	listServices = require('../lib/lost/listServices'),
	listServicesByLocation = require('../lib/lost/listServicesByLocation');
var LostError = tools.LostError;

if(config.debug)
    tools.setLogMode(1);

// cross site scripting handling
exports.crossSite = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept");
    next();
}

// LoST service handler
exports.handleRequest = function (req, res, next) {
	var rawRequest = '';

	// concatenate data chunks
	req.on('data', function (data) {
		rawRequest += data;
	});

	// when request complete (all data chunks read) process it
	req.on('end', function () {
		try {
			tools.logDebug('LoST request received', rawRequest);

			var requestHandler;
			lostRequest.process(rawRequest)
				.then(function (request) {
					switch (request.requestType) {
						case 'findService':
							requestHandler = findService;
							break;

						case 'getServiceBoundary':
							requestHandler = getServiceBoundary;
							break;

						case 'listServices':
							requestHandler = listServices;
							break;

						case 'listServicesByLocation':
							requestHandler = listServicesByLocation;
							break;

						default:
							throw new LostError('Invalid request type (' +
								request.requestType + ')',
									LostError.types.serviceNotImplemented);
							break;
					}

					if (requestHandler)
						return requestHandler.process(request);
					else
						throw new LostError('Request handler empty',
							LostError.types.internalError);
				})
				.then(function (response) {
					res.set('Content-Type', 'application/xml');
					var xml = response.toString();
					res.send(xml);

					tools.logDebug('LoST request processed', xml);
				})
				.fail(function (error) {
					next(error);
				});
		}
		catch (ex) {
			next(ex);
		}
	});
}

// LoST service error handler
exports.handleError = function (error, req, res, next) {
	if (error) {
		res.status(200);

		// create response error object
		var e = {};
		if (error.message)
			e.msg = error.message;
		if (!e.msg)
			e.msg = error.toString();
		if (error.tag)
			e.tag = error.tag;
		if (error.type)
			e.lostErrorType = error.type;
		if (error.lostErrorLanguage)
			e.lostErrorLanguage = error.lostErrorLanguage;

		var tagMsg = e.msg + (e.tag ? ' (' +
			_.trim(e.tag.toString().replace(/[\r\n\t]/g, ' ')) + ')' : '');
		tools.logError(tagMsg);

		// send XML error response
		res.set('Content-Type', 'text/xml');
		res.send(tools.createError(e.lostErrorType,
			tagMsg, e.lostErrorLanguage, false, 0, 0));

		// send JSON error response
		//res.set('Content-Type', 'application/json');
		//res.send(tools.createError(e.lostErrorType,
		//	tagMsg, e.lostErrorLanguage, false, 0, 1));

		res.end();
	}
	else
		next();
}
