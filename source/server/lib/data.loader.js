/* global $data */
/* global Lost */
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
	config = require("../config/config"),
    tools = require('./tools'),
    glob = require('glob'),
    path = require('path'),
    fs = require('fs'),
    guid = require('node-uuid'),
    moment = require('moment'),
    JsonValidator = require('jsonschema').Validator;

if(config.debug)
    tools.setLogMode(1);

var v = new JsonValidator();
var rootSchema;

exports.isInitialized = false;

// load JSON loader schemas
exports.initialize = function () {
    var self = this;
    if (self.isInitialized)
        return;

    var msg = 'Load JSON schema: ';
    var schemaRootPath = './lib/schemas';
    var schemaExt = '.json';
    var schemaPath = schemaRootPath + '/Frame' + schemaExt;
    tools.logDebug(msg + schemaPath.cyan)

    rootSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    v.addSchema(rootSchema);

    function importNextSchema() {
        var nextSchema = v.unresolvedRefs.shift();
        if (!nextSchema)
            return;

        // only resolve local references
        if (_.startsWith(nextSchema, '/') && nextSchema.indexOf('#') < 0) {
            var nextSchemaPath = schemaRootPath + nextSchema + schemaExt;
            tools.logDebug(msg + nextSchemaPath.cyan)

            v.addSchema(JSON.parse(fs.readFileSync(nextSchemaPath, 'utf-8')));
            importNextSchema();
        }
    }

    importNextSchema();

    self.isInitialized = true;
}


// loads all JSON files from a directory into the LoST database
exports.loadDirectory = function (directoryPath) {
    var self = this;
   	var deferred = Q.defer();
    tools.logInfo('Importing files from ' + directoryPath.cyan);

    var options = {};
    glob(directoryPath + "/*.json", options, function (error, files) {
        if (error) {
            deferred.reject(error);
            return;
        }

        var importQueue = [];
        files.forEach(function (file) {
            importQueue.push(self.loadFile(file));
        });

        Q.all(importQueue)
            .then(function (result) {
                deferred.resolve(result.length);
            })
            .fail(function (error) {
                deferred.reject(error);
            });
    })

    return deferred.promise;
}


// loads JSON file from disk into LoST database
exports.loadFile = function (filePath) {
    var self = this;
   	var deferred = Q.defer();
    tools.logDebug('Import file ' + path.basename(filePath).cyan);

    var obj;
    fs.readFile(filePath, 'utf8', function (error, data) {
        if (error) {
            deferred.reject(error);
            return;
        }
        try {
            obj = JSON.parse(data);
        }
        catch (ex) {
            deferred.reject(new Error('Unable to import ' + filePath + ' (' + ex + ')'));
        }

        self.loadData(obj)
            .then(function (count) {
                deferred.resolve(count);
            });
    });

    return deferred.promise;
}


// load JSON objects into LoST database
exports.loadData = function (obj) {
    var self = this;
    if (!self.isInitialized)
        self.initialize();

    var deferred = Q.defer();

    var totalCount = 0;
    var now = moment();
    var exp = now.clone().add(1, 'year');

    // first ensure object is correct
    // validate against loader JSON schema
    var validationResult = _.get(v.validate(obj, rootSchema), 'errors');
    if (_.isArray(validationResult)) {
        if (validationResult.length > 0) {
            tools.logError('Error importing object', validationResult);
            deferred.reject('Error importing object');
            return deferred.promise;
        }
    }
    else {
        deferred.reject('Internal error importing object, result not array');
        return deferred.promise;
    }

    if (obj.type === 'service') {
        tools.logInfo('Import service: ' + obj.service.DisplayName.cyan +
            ' (' + obj.service.ServiceID.cyan + ')');

        global.odata
            .createContext()
            .then(function (context) {

                // save service
                var objService = obj.service;
                var svc = new Lost.Servicex({
                    ServiceID: objService.ServiceID,
                    Expires: objService.Expires || exp,
                    LastUpdated: now,
                    DisplayName: objService.DisplayName,
                    Description: objService.Description,
                    LanguageCode: objService.LanguageCode,
                    URN: objService.URN
                });
                context.SVCs.add(svc);

                // service URI's
                objService.URIs.forEach(function (uri) {
                    context.ServiceURIs.add(new Lost.ServiceURI({
                        Schema: uri.Schema,
                        URI: uri.URI,
                        SVC: svc
                    }));
                });

                // service Numbers
                objService.Numbers.forEach(function (num) {
                    context.ServiceNumbers.add(new Lost.ServiceNumber({
                        Number: num,
                        SVC: svc
                    }));
                });

                // service boundaries
                var objBoundaries = obj.boundaries;
                objBoundaries.forEach(function (boundary) {
                    context.ServiceBoundaries.add(new Lost.ServiceBoundary({
                        ReferenceID: boundary.ReferenceID,
                        BoundaryGeom: boundary.Geom,
                        SVC: svc
                    }));
                });

                // save context
                context.saveChanges(function (count) {
                    totalCount += count;
                    tools.logInfo('DONE'.green);
                    deferred.resolve(totalCount);
                });
            });
    }
    else if (obj.type === 'boundary') {
        tools.logInfo('Import boundary: ' + obj.boundary.ReferenceID.cyan);

        // boundaries
        // TODO
        deferred.reject('Import type (' + obj.type + ') not implemented');
    }
    else
        deferred.reject('Unsupported import type (' + obj.type + ')');

    return deferred.promise;
}

