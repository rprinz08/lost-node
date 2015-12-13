'use strict';

module.exports = {
    debug: false,
    port: 8080,
    downloads: '/downloads',
    data: {
        api: '/lost.data.svc',
        auth: {
            user: 'admin',
            password: 'admin'
        }
    },
    lost: {
        api: '/lost.svc',
        auth: null,
        source: 'production.example.com',
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

