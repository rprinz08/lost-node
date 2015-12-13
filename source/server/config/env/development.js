'use strict';

module.exports = {
    debug: true,
    port: 8080,
    downloads: '/downloads',
    data: {
        api: '/lost.data.svc',
        auth: null
    },
    lost: {
        api: '/lost.svc',
        auth: null,
        source: 'development.example.com',
    },
	/*
	// see also: https://github.com/jaydata/jaydata/issues/86
	database: {
        type: 'sqLite',
        name: 'server/data/test.db',
	}
	*/
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

