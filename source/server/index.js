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

var Q = require('q');
Q.stopUnhandledRejectionTracking();

var	_ = require('lodash'),
	tools = require('./lib/tools'),
	colors = require('colors'),
	config = require("./config/config"),
	stdio = require('stdio'),
	fs = require('fs'),
	path = require('path'),
	http = require('http'),
    express = require('express'),
	favicon = require('serve-favicon'),
	FileStreamRotator = require('file-stream-rotator'),
	logger = require('morgan'),
	serveIndex = require('serve-index'),
	lostService = require('./routes/lostService'),
	odata = require( './lib/data' ),
	testData = require( './lib/data.test' );

tools.setLogMode(1);

// command line options
var options = stdio.getopt({
	'verbose': { key: 'v', description: 
		'Verbose debug output' },
	'quiet': { key: 'q', description: 
		'No output at all; overrules --verbose; assumes YES to all questions' },
	'dbinit': { key: 'i', description: 
		'(Re)Initialize database. ' + 
		'DELETES ALL EXISTING DATA!'.red },
	'dbtest': { key: 't', description: 
		'Initialize database with some test data. ' + 
		'DELETES ALL EXISTING DATA!'.red },
});

var server;
var app = express();
global.odata = odata;



// ======================================================================
// Methods

// show copyright and help
function showVersion() {
    console.log(('lost-node(v0.1.0) - GPLv3 - ' +
		'Copyright 2015,2016 richard.prinz@min.at ').cyan);
	console.log('A node.js based RFC5222 LoST server'.cyan);
	console.log('https://github.com/rprinz08/lost-node'.cyan);
    console.log('This program comes with ABSOLUTELY NO WARRANTY;'.cyan);
	console.log('for details see http://www.gnu.org/licenses/'.cyan);
	console.log();
}

function showUsage() {
}

// configure this server
function configure() {
	return configureServer()
		.then(function() { return configureDownloads() })
		.then(function() { return configureAPI() })
		.then(function() { return configureContent() });
}

// configure server parameters
function configureServer() {
	tools.logInfo('Configure server ...');
	
	if(config.debug)
		app.set('json spaces', 2);
	
	if(!config.listen)
		app.set('bind', process.env.LISTEN || '0.0.0.0');
	else
		app.set('bind', config.listen);
	
	if(!config.port) 
		app.set('port', process.env.PORT || 8080);
	else
		app.set('port', config.port);
	
	// configure logging 
	// ensure log directory exists 
	var logDirectory = path.join(__dirname, 'logs');
	fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
 
	// create a rotating write stream 
	var streamOptions = {
		date_format: 'YYYYMM',
		filename: path.join(logDirectory, '/lost-%DATE%.log'),
		frequency: 'daily',
		verbose: false
	};
	streamOptions.verbose = (!!config.debug);
	var accessLogStream = FileStreamRotator.getStream(streamOptions);
		
	//app.use(logger('combined'));
	//app.use(logger('combined', {stream: accessLogStream}));
	app.use(logger('combined', {
		stream: {
			write: function(data) {
				accessLogStream.write(data);
				if(config.debug)
					console.log(data);
			}
		}
	}));
	
	app.use(favicon('favicon.ico'));
	
	tools.logOK('Configure server ... ' + 'DONE'.green);
	return Q();
}

// download content (incl. directory indexing) 
function configureDownloads() {
	tools.logInfo('Configure downloads ...');
	app.use(config.downloads, serveIndex('downloads', {'icons': true}))
	app.use(config.downloads, express.static(path.join(__dirname, 'downloads')));
	
	tools.logOK('Configure downloads ... ' + 'DONE'.green);
	return Q();	
}

// service API's
function configureAPI() {
	tools.logInfo('Configure API\'s ...');
	
	// LoST Service
	app.all(config.lost.api, lostService.crossSite);
	app.post(config.lost.api, lostService.handleRequest);
	app.use(config.lost.api, lostService.handleError);
		
	// oData client & server
	return odata.initializeClient()
		.then(function(dbContext) {
			odata.initializeServer(app)
				.then(function() {
					tools.logOK('Configure API\s ... ' + 'DONE'.green);					
				});
		});
}

// static and generated content
function configureContent() {
	tools.logInfo('Configure content ...');
	
	// debug support	
	if(config.debug)
		require('express-debug')(app, {
			depth: 4,
			//panels: [
			//	'locals', 'request', 'session', 'template', 
			//	'software_info', 'profile'
			//],
			path: '/express-debug'			
		});
		
	// static pages
	app.get('/info', generateDebugPage);
	app.use('/', express.static(path.join(__dirname, 'docs')));
	//app.use(express.static(path.join(__dirname, 'docs')));
	
	tools.logOK('Configure content ... ' + 'DONE'.green);	
	return Q();
}

// generate debug helper page showing sent client http headers
// and IP address
function generateDebugPage(req, res) {
	var h = '';
	for(var header in req.headers)
		h += header + ' = <b>' + req.headers[header] + '</b><br>';
  
  res.send(
	'<html><head></head><body>' +
	'Your IP: <b>' + req.connection.remoteAddress + '</b><br><p>' +
	'Headers:<br>' +
	h + 
	'</body></html>');	
}

// initialize server
// e.g. setup default values or insert some test data
function initialize() {
	tools.logInfo('Initialize ...');
	
	global.LoST = {
		XML_LOST_URN: 'urn:ietf:params:xml:ns:lost1',
		XML_GML_URN: 'http://www.opengis.net/gml'
	};
	
	tools.logOK('Initialize ... ' + 'DONE'.green);	
	return Q();		
}

// start server
function startServer() {
	tools.logInfo('Start server ...');
	
	server = http.createServer(app);
	server.listen(app.get('port'), app.get('bind'), function() {
		var addr = server.address();
		tools.logOK('Server listening on ' + 
			(addr.address.toString() + ':' +
			addr.port).cyan);
		tools.listIPs();
	});
	
	tools.logOK('Start server ... ' + 'DONE'.green);	
	return Q();
}



// ======================================================================
// Main

process.on('SIGINT', function() {
debugger;	
	tools.logWarning('SIGINT signal received')
	
	var db = _.get(global, 'odata.__context', null);
	if(db) {
	}
	
	var native = _.get(global, 'odata.__native.__context', null);
	if(native) {
		native.close();
	}
	
	process.exit(1);
});

process.on('uncaughtException', function(error) {
	tools.logError('Unhandled exception', error);
	process.exit(100);
});

showVersion();

// drop database
if(options.dbinit) {
	odata.dropDB()
		.fail(function(error) {
			tools.logError('Error initializing database', error);
			process.exit(10);
		});
}
// insert some test data into db
else if(options.dbtest) {
	odata.initializeClient()
		.then(function(dbContext) {
				testData.generateTestData(dbContext)
					.then(function(count) {
						tools.logInfo('Test data upload successful. ' + 
							count.toString().cyan + ' items inserted.');
						process.exit(0);
					})
		})
		.fail(function(error) {
			tools.logError('Error initializing database', error);
			process.exit(10);
		});
}
// start server normally
else
	configure()
		.then(function() { return initialize() })
		.then(function() { return startServer() })
		.fail(function(error) {
			tools.logError('Error starting server', error);
			process.exit(20);
		})
