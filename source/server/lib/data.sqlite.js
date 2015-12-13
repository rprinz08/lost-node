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
	tools = require('./tools'),
	dateFormat = require('dateformat'),
	fs = require('fs'),
	path = require('path'),
	//sqlite3 = require('sqlite3').verbose();
	sqlite3 = require("spatialite").verbose();

var DB_FILENAME = './server/data/services.db';
var MAX_RESULTS = 100;

var db;

exports.init = function(clear) {
	if(fs.existsSync(DB_FILENAME)) {
		if(clear)
			fs.unlinkSync(DB_FILENAME);
	}

	if(!fs.existsSync(DB_FILENAME)) {
		db = new sqlite3.Database(DB_FILENAME);
		db.serialize(function() {
			// Services
			db.run('CREATE TABLE services(' +
				'__id integer not null primary key, ' +
				'ServiceID text not null, ' +
				'Expires integer not null, ' +
				'LastUpdated integer not null, ' +
				'DisplayName text not null, ' +
				'Description text null, ' +
				'LanguageCode text not null, ' + 
				'ServiceURN text not null)');
				
			db.run('CREATE INDEX service_id ON ' +
				'services(ServiceID);');


				
			// Service URIs
			db.run('CREATE TABLE service_uris(' +
				'__id integer not null primary key, ' +
				'ServiceID text not null, ' +
				'Schema text not null, ' +
				'Uri text not null);');

			db.run('CREATE UNIQUE INDEX service_uri_id ON ' +
				'service_uris(ServiceID, Schema);');
		
		
		
			// Service numbers
			db.run('CREATE TABLE service_numbers(' +
				'__id integer not null primary key, ' +
				'ServiceID text not null, ' +
				'Number text not null);');

			db.run('CREATE UNIQUE INDEX service_number_id ON ' +
				'service_numbers(ServiceID, Number);');
			
			
			
			// Service boundaries
			db.run('CREATE TABLE service_boundaries(' +
				'__id integer not null primary key, ' +
				'ServiceID text not null, ' +
				'Boundary text not null);');
				
				
				
			fillDemoData(db);
		});		
	}
	else{
		db = new sqlite3.Database(DB_FILENAME);
	}
}

exports.getData = function(sql) {
	var deferred = Q.defer();
	tools.logDebug('getData SQL', sql);	
	
    db.all(sql, function(error, rows) {
		if(error)
			deferred.reject(error);
		else
			deferred.resolve(rows);
    });
	return deferred.promise;
}

exports.createService = function(newService) {
	var deferred = Q.defer();
	var sql = "INSERT INTO services";
	var sqlFieldNames = [];
	var sqlArgs = [];
	var now = new Date();
	
	newService.LastUpdated = dateFormat(now, "yyyy-mm-dd HH:MM:ss");	
	for(var property in newService) {
		if(property !== '__id') {
			if(newService.hasOwnProperty(property)) {
				sqlFieldNames.push(property);
				sqlArgs.push(newService[property]);
			}
		}
	}	
	
	sql += '\n(' + sqlFieldNames.join(',') + ')';
	sql += '\nVALUES (' + Array(sqlFieldNames.length + 1).
		join('?').split('').join(',') + ')';
	tools.logDebug('createService SQL', sql);	

	sqlArgs.unshift(sql);	
	sqlArgs.push(function(error) {
		if(error)
			deferred.reject(error);
		else {
			newService['__id'] = this.lastID;
			deferred.resolve(newService);
		}
    });
	
	db.run.apply(db, sqlArgs);
	return deferred.promise;
}

exports.getServiceByID = function(id) {
	var deferred = Q.defer();
	var sql = "SELECT * FROM services" +
			"\nWHERE __id=?";
	tools.logDebug('getServiceByID SQL', sql);	
			
    db.get(sql, id, function(error, service) {
		if(error)
			deferred.reject(error);
		else
			deferred.resolve(service);
    });
	return deferred.promise;
}

exports.deleteServiceByID = function(id) {
	var deferred = Q.defer();
	var sql = "DELETE FROM services" +
			"\nWHERE __id = ?";
	tools.logDebug('deleteServiceByID SQL', sql);	
			
    db.run(sql, id, function(error) {
		if(error)
			deferred.reject(error);
		else
			deferred.resolve(this.changes);
    });
	return deferred.promise;
}

exports.updateServiceByID = function(id, updatedService) {
	var deferred = Q.defer();
	var sql = "UPDATE services SET";
	var sqlFields = [];
	var sqlArgs = [];
	var now = new Date();
	
	updatedService.LastUpdated = dateFormat(now, "yyyy-mm-dd HH:MM:ss");	
	for(var property in updatedService) {
		if(property !== '__id') {
			if(updatedService.hasOwnProperty(property)) {
				sqlFields.push(property + '=?');
				sqlArgs.push(updatedService[property]);
			}
		}
	}
	sql += '\n' + sqlFields.join(',');
	sql += "\nWHERE __id=?";
	tools.logDebug('updateServices SQL', sql);	

	sqlArgs.push(id);	
	sqlArgs.unshift(sql);	
	sqlArgs.push(function(error) {
		if(error)
			deferred.reject(error);
		else
			deferred.resolve(this.changes);
    });
	
	db.run.apply(db, sqlArgs);
	return deferred.promise;
}

exports.getServiceUris = function(serviceID) {
	var deferred = Q.defer();
	var sql = "SELECT * FROM service_uris" +
			"\nWHERE ServiceID=?";
	tools.logDebug('getServiceByIDUris SQL', sql);	
			
    db.get(sql, serviceID, function(error, service) {
		if(error)
			deferred.reject(error);
		else
			deferred.resolve(service);
    });
	return deferred.promise;
}





exports.getRecordCount = function(tableName, sqlWhereClause) {
	var deferred = Q.defer();
	var w = (sqlWhereClause ? ' ' + sqlWhereClause : '');
	var sql = 'SELECT count(*) AS count FROM ' + 
			tableName + w + ';';
	tools.logDebug('getRecordCount SQL', sql);
	
    db.get(sql, function(error, row) {
		if(error)
			deferred.reject(new Error(error));
		else
			deferred.resolve(row.count);
    });
	return deferred.promise;
}

exports.generateSqlFromDataTableRequest = function(
		tableName, request, inclRowID, additionalSearchArray) {
	var result = {};
	var fieldList;
	var orderList;
	var searchArray = additionalSearchArray || [];
	var searchList;
	var limit;
	var sql;
	
	// select fields and where clause
	if(request.columns && request.columns.length > 0) {
		var fieldList = request.columns
			.map(function(col) {
				if(col.data) {
					var searchValue = tools.get(col, 'search.value');
					if(searchValue)
						searchArray.push(col.data + ' LIKE \'%' + 
							escapeSQLData(searchValue) + '%\'');
				}
				return col.data;				
			})
			.filter(function(col) {
				return col;
			})
			.join(',');
		if(fieldList.length < 1)
			fieldList = '*';
	}
	else
		fieldList = '*';
	fieldList = 'SELECT ' + fieldList;
	if(inclRowID)
		fieldList += ',ROWID as DT_RowId';
	fieldList += '\nFROM ' + tableName;
	
	if(searchArray.length > 0)
		searchList = '\nWHERE ' + searchArray.join(' AND ');
	else
		searchList = '';
	
	// order clause
	if(request.order && request.order.length > 0) {
		var orderList = request.order
			.map(function(orderCol) {
				var os;
				if(orderCol.column && request.columns[orderCol.column]) {
					os = request.columns[orderCol.column].data;
					if(os && orderCol.dir)
						os += ' ' + orderCol.dir;
				}
				return os;
			})
			.filter(function(orderCol) {
				return orderCol;
			})
			.join(',');
		if(orderList.length > 0)
			orderList = '\nORDER BY ' + orderList;
	}
	else
		orderList = '';
		
	// limit (paging)
	// See http://www.sqlite.org/cvstrac/wiki?p=ScrollingCursor for infos
	// about better paging

	if(request.length) {
		limit = '\nLIMIT ' + request.length;
		if(request.start)
			limit += ' OFFSET ' + request.start;
	}
		
	sql = fieldList + searchList + orderList + limit + ';';
	result.tableName = tableName;
	result.select = fieldList;
	result.where = searchList;
	result.orderBy = orderList;
	result.limit = limit;
	result.sql = sql;
	
	return result;
}

function escapeSQLData(data) {
	var result = data
		.replace(/'/, "''")
		.replace(/&/, '&&');
	return result;
}

function fillDemoData(db) {
	// Services - demo data
	db.run("INSERT INTO services " +
		"(ServiceID, Expires, LastUpdated, DisplayName, " +
		"LanguageCode, ServiceURN) " +
		"VALUES(" +
		"'0815', " +
		"datetime('2014-11-10 10:11:22'), " +
		"datetime('now'), " +
		"'New York City Police Department', " +
		"'en', " +
		"'urn:service:sos.police');");

	db.run("INSERT INTO services " +
		"(ServiceID, Expires, LastUpdated, DisplayName, " +
		"LanguageCode, ServiceURN) " +
		"VALUES(" +
		"'4711', " +
		"datetime('2014-11-10 10:11:22'), " +
		"datetime('now'), " +
		"'New York City Fire Department', " +
		"'en', " +
		"'urn:service:sos.police');");
		
	db.run("INSERT INTO services " +
		"(ServiceID, Expires, LastUpdated, DisplayName, " +
		"LanguageCode, ServiceURN) " +
		"VALUES(" +
		"'1234', " +
		"datetime('2014-11-10 10:11:22'), " +
		"datetime('now'), " +
		"'New York City Medical Department', " +
		"'en', " +
		"'urn:service:sos.police');");				

		
		
	// Service URIs demo data
	db.run("INSERT INTO service_uris " +
		"(ServiceID, Schema, Uri) " +
		"VALUES(" +
		"'0815', " +
		"'sip', " +
		"'nypd@example.com');");
		
	db.run("INSERT INTO service_uris " +
		"(ServiceID, Schema, Uri) " +
		"VALUES(" +
		"'0815', " +
		"'xmpp', " +
		"'nypd@example.com');");
		
		
		
	// Service URIs demo data
	db.run("INSERT INTO service_numbers " +
		"(ServiceID, Number) " +
		"VALUES(" +
		"'0815', " +
		"'911');");
		

		
	// Service boundaries demo data
	// Wien
	db.run("INSERT INTO service_boundaries " +
		"(ServiceID, Boundary) " +
		"VALUES(" +
		"'0815', " +
		"'POLYGON(" +
			"37.775 -122.4194, " +
			"37.555 -122.4194, " +
			"37.555 -122.4264, " +
			"37.775 -122.4264, " +
			"37.775 -122.4194)');");						
		
		
		
	for(var i = 0; i < 40; i++) {
		db.run("INSERT INTO services " +
			"(ServiceID, Expires, LastUpdated, DisplayName, " +
			"LanguageCode, ServiceURN) " +
			"VALUES(" +
			//"'" + tools.strRandom(16) + "'," +
			"'" + tools.strRandomUUID() + "'," +			
			"datetime('2014-12-31 23:59:59'), " +
			"datetime('now'), " +
			"'Test Service (" + i + ")', " +
			"'en', " +
			"'urn:service:sos." + i + ".test');");
	}
}


