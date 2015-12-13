/* global $data */
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

$data.Class.define('$data.JayLogger', $data.TraceBase, null, {
    log: function () {
		if(arguments.length > 0) {
			var args = [];
			Array.prototype.push.apply( args, arguments );		
			var msg = args[0]; args.shift();
			tools.logInfo(msg, (args.length > 0 ? args : undefined));
		}
    },
    warn: function () {
		if(arguments.length > 0) {
			var args = [];
			Array.prototype.push.apply( args, arguments );		
			var msg = args[0]; args.shift();
			tools.logWarn(msg, (args.length > 0 ? args : undefined));
		}
    },
    error: function () {
		if(arguments.length > 0) {
			var args = [];
			Array.prototype.push.apply( args, arguments );		
			var msg = args[0]; args.shift();
			tools.logError(msg, (args.length > 0 ? args : undefined));
		}
    }
});

