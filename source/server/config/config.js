'use strict';

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
    fs = require('fs');
debugger;
// Load configurations
// Set the node environment variable if not set before
process.env.NODE_ENV =
~fs.readdirSync('./config/env')
    .map(function (file) {
        return file.slice(0, -3);
    })
    .indexOf(process.env.NODE_ENV)
    ? process.env.NODE_ENV
    : 'development';

// ensure all config options are available at least with
// default values
var config = {
    debug: false,
    port: 8080,
    downloads: '/downloads',
    data: {
        api: '/lost.data.svc',
        auth: null
    },
    lost: {
        api: '/lost.svc',
        auth: null,
        source: 'example.com',
    },
    database: {
        type: 'mongoDB',
        name: 'lost',
        address: "localhost",
        port: 27017,
        username: null,
        password: null,
        jayLog: false
    }
};

_.extend(
    config,
    require('./env/' + process.env.NODE_ENV) || {});

// Extend the base configuration in all.js with environment
// specific configuration
module.exports = _.extend(
    require('./env/all'),
    config);

