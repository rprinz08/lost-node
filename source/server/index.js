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
	odata = require('./lib/data'),
	dataLoader = require('./lib/data.loader')

// command line options
var options = stdio.getopt({
	//'verbose': { key: 'v',
    //    description: 'Verbose debug output' },
	//'quiet': { key: 'q',
    //    description: 'No output at all; overrules --verbose; assumes YES to all questions' },
	'dbinit': { key: 'i',
        description: '(Re)Initialize database. ' +
		  'DELETES ALL EXISTING DATA!'.red },
	'dbtest': { key: 't',
        description: 'Initialize database with some test data. ' +
		  'DELETES ALL EXISTING DATA!'.red },
	'dbloadfile': { key: 'f', args: 1,
        description: 'Imports a JSON file into the database.' },
	'dbloaddir': { key: 'd', args: 1,
        description: 'Imports all JSON files of a directory into the database.' }
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
    console.log('This program comes with ABSOLUTELY NO WARRANTY;'.cyan);
	console.log('for details see https://github.com/rprinz08/lost-node'.cyan);
    console.log('and http://www.gnu.org/licenses/'.cyan);
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
    var msg = 'Configure server ...';
	tools.logInfo(msg);

	if(config.debug) {
		app.set('json spaces', 2);
        tools.setLogMode(1);
    }

    // for hosting under IISNODE (Azure), environment
    // overrides all other configs
    if(process.env.LISTEN)
        app.set('bind', process.env.LISTEN);
    else
        app.set('bind', config.listen || '0.0.0.0');

    if(process.env.PORT)
    	app.set('port', process.env.PORT);
    else
        app.set('port', config.port || 8080);

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

	tools.logOK(msg + 'DONE'.green);
	return Q();
}

// download content (incl. directory indexing)
function configureDownloads() {
    var msg = 'Configure downloads ...';
	tools.logInfo(msg);
	app.use(config.downloads, serveIndex('downloads', {'icons': true}))
	app.use(config.downloads, express.static(path.join(__dirname, 'downloads')));

	tools.logOK(msg + 'DONE'.green);
	return Q();
}

// service API's
function configureAPI() {
    var msg = 'Configure API\'s ...';
	tools.logInfo(msg);

	// LoST Service
	app.all(config.lost.api, lostService.crossSite);
	app.post(config.lost.api, lostService.handleRequest);
	app.use(config.lost.api, lostService.handleError);

	// oData client & server
	return odata.initializeClient()
		.then(function(dbContext) {
			odata.initializeServer(app)
				.then(function() {
					tools.logOK(msg + 'DONE'.green);
				});
		});
}

// static and generated content
function configureContent() {
    var msg = 'Configure content ...';
	tools.logInfo(msg);

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

	tools.logOK(msg + 'DONE'.green);
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
// e.g. setup default values
function initialize() {
    var msg = 'Initialize ...';
	tools.logInfo(msg);

	global.LoST = {
		XML_LOST_URN: 'urn:ietf:params:xml:ns:lost1',
		XML_GML_URN: 'http://www.opengis.net/gml'
	};

	tools.logOK(msg + 'DONE'.green);
	return Q();
}

// start server
function startServer() {
    var msg = 'Start server ...';
	tools.logInfo(msg);

	server = http.createServer(app);
	server.listen(app.get('port'), app.get('bind'), function() {
		var addr = server.address();
        tools.logOK("Server listening on " +
            (_.get(addr, 'address', 'null').toString() + ":" +
            _.get(addr, 'port', 'null').toString()).cyan);
		tools.listIPs();
	});

	tools.logOK(msg + 'DONE'.green);
	return Q();
}



// ======================================================================
// Main

function cleanUp() {
	var db = _.get(global, 'odata.__context', null);
	if(db) {
	}

	var native = _.get(global, 'odata.__native.__context', null);
	if(native) {
		native.close();
	}
}

process.on('SIGINT', function() {
	tools.logWarning('SIGINT signal received')
    cleanUp();
	process.exit(1);
});

process.on('uncaughtException', function(error) {
	tools.logError('Unhandled exception', error);
    cleanUp();
	process.exit(100);
});

showVersion();

// drop database
if(options.dbinit) {
	odata.dropDB()
        .then(function() {
            cleanUp();
        })
		.fail(function(error) {
			tools.logError('Error initializing database', error);
            cleanUp();
			process.exit(10);
		});
}
// imports a JSON file into the database
else if(options.dbloadfile) {
    if(!_.isString(options.dbloadfile)) {
        tools.logError('Filename argument missing');
        process.exit(30);
    }
    var fileName = options.dbloadfile;

	odata.initializeClient()
		.then(function(dbContext) {
            return dataLoader.loadFile(fileName);
		})
        .then(function(count) {
            tools.logInfo('File ' +  fileName.cyan + ' imported');
            cleanUp();
            process.exit(0);
        })
		.fail(function(error) {
			tools.logError('Error initializing database', error);
            cleanUp();
			process.exit(10);
		});
}
// imports all JSON files in a directory into the database
// or from the predefined testdata folder
else if(options.dbloaddir || options.dbtest) {
    var directoryPath;
    if(options.dbtest)
        directoryPath = path.resolve(path.dirname(process.mainModule.filename), 'testdata');
    else {
        if(!_.isString(options.dbloaddir)) {
			tools.logError('Directory argument missing');
			process.exit(30);
        }
        directoryPath = options.dbloaddir;
    }

	odata.initializeClient()
		.then(function(dbContext) {
            return dataLoader.loadDirectory(directoryPath);
		})
        .then(function(count) {
            tools.logInfo(count.toString().cyan + ' file' +
                (count === 1 ? '' : 's') + ' imported');
            cleanUp();
            process.exit(0);
        })
		.fail(function(error) {
			tools.logError('Error initializing database', error);
            cleanUp();
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
            cleanUp();
			process.exit(20);
		})
