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
	tools = require('./tools'),
	guid = require('node-uuid'),
	moment = require('moment');


// inserts some test date into the lost database
exports.generateTestData = function (context) {
	var deferred = Q.defer();
	tools.logInfo('Generate test data ...');
	var totalCount = 0;
	var now = moment();
	// test data expires in one hour
	var exp = now.clone().add(1, 'hour');

	// Services
    var viePolSvc = new Lost.Servicex({
		ServiceID: guid.v4(),
		Expires: exp,
		LastUpdated: now,
		DisplayName: 'Vienna City Police Department',
		LanguageCode: 'en',
		URN: 'urn:service:sos.police',
	});
    context.SVCs.add(viePolSvc);

    var vieFireSvc = new Lost.Servicex({
		ServiceID: guid.v4(),
		Expires: exp,
		LastUpdated: now,
		DisplayName: 'Berufsfeuerwehr Wien',
		LanguageCode: 'de',
		URN: 'urn:service:sos.fire',
	});
    context.SVCs.add(vieFireSvc);

    var lnzPolSvc = new Lost.Servicex({
		ServiceID: guid.v4(),
		Expires: exp,
		LastUpdated: now,
		DisplayName: 'Linz Police Department',
		LanguageCode: 'en',
		URN: 'urn:service:sos.police',
	});
    context.SVCs.add(lnzPolSvc);

    var szgFireSvc = new Lost.Servicex({
		ServiceID: guid.v4(),
		Expires: exp,
		LastUpdated: now,
		DisplayName: 'Salzburg Fire Brigade',
		LanguageCode: 'en',
		URN: 'urn:service:sos.fire',
	});
    context.SVCs.add(szgFireSvc);
	
	// some more junk services
	/*
	for(var i = 0; i < 40; i++) {
		context.SVCs.add(new Lost.Servicex({
			ServiceID: tools.strRandomUUID(),
			Expires: new Date('December 31, 2014 23:59:59'),
			LastUpdated: moment(),
			DisplayName: 'Test Service (' + i + ')',
			LanguageCode: 'en',
			URN: 'urn:service:sos.' + i + '.test'
		}));
	}
	*/

	context.saveChanges(function (count) {
		totalCount += count;
		
		// Service URI's
		context.ServiceURIs.add(new Lost.ServiceURI({
			Schema: 'sip',
			URI: 'office@viePolSvc.com',

			ServiceID: viePolSvc.ID,
			SVC: viePolSvc
		}));

		context.ServiceURIs.add(new Lost.ServiceURI({
			Schema: 'xmpp',
			URI: 'office@viePolSvc.com',

			ServiceID: viePolSvc.ID,
			SVC: viePolSvc
		}));

		context.ServiceURIs.add(new Lost.ServiceURI({
			Schema: 'sip',
			URI: 'office@vieFireSvc.com',

			ServiceID: vieFireSvc.ID,
			SVC: vieFireSvc
		}));

		context.ServiceURIs.add(new Lost.ServiceURI({
			Schema: 'xmpp',
			URI: 'office@vieFireSvc.com',

			ServiceID: vieFireSvc.ID,
			SVC: vieFireSvc
		}));

		context.ServiceURIs.add(new Lost.ServiceURI({
			Schema: 'sip',
			URI: 'office@lnzPolSvc.com',

			ServiceID: lnzPolSvc.ID,
			SVC: lnzPolSvc
		}));

		context.ServiceURIs.add(new Lost.ServiceURI({
			Schema: 'sip',
			URI: 'office@szgFireSvc.com',

			ServiceID: szgFireSvc.ID,
			SVC: szgFireSvc
		}));
		
		/*
		// some more junk service URI's
		for(var i = 0; i < 20; i++) {
			context.ServiceURIs.add(new Lost.ServiceURI({
				Schema: 'sip',
				URI: 'nypd' + i + '@test.com',
				
				ServiceID : viePolSvc.ID,
				SVC: viePolSvc
			}));
		}
		*/

		context.ServiceNumbers.add(new Lost.ServiceNumber({
			Number: '112',

			ServiceID: viePolSvc.ID,
			SVC: viePolSvc
		}));
		context.ServiceNumbers.add(new Lost.ServiceNumber({
			Number: '133',

			ServiceID: viePolSvc.ID,
			SVC: viePolSvc
		}));

		context.ServiceNumbers.add(new Lost.ServiceNumber({
			Number: '122',

			ServiceID: vieFireSvc.ID,
			SVC: vieFireSvc
		}));

		context.ServiceNumbers.add(new Lost.ServiceNumber({
			Number: '112',

			ServiceID: lnzPolSvc.ID,
			SVC: lnzPolSvc
		}));

		context.ServiceNumbers.add(new Lost.ServiceNumber({
			Number: '122',

			ServiceID: szgFireSvc.ID,
			SVC: szgFireSvc
		}));
			
		/*
		// Service numbers
		for(var i = 0; i < 20; i++) {
			context.ServiceNumbers.add(new Lost.ServiceNumber({
				Number: '911-' + i,
				
				ServiceID : viePolSvc.ID,
				SVC: viePolSvc
			}));
		}
		*/
		

		// Service boundaries (Vienna City Area)
		var vie = new $data.GeographyMultiPolygon([
			[[
				[16.385756941895103, 48.31842992144075],
				[16.370650740722688, 48.280973955448424],
				[16.340438338378753, 48.28828459468936],
				[16.280013533691786, 48.268177818857204],
				[16.255294295410383, 48.240746734389845],
				[16.205855818847585, 48.26634953773431],
				[16.179763289551, 48.22245116852622],
				[16.214095564941385, 48.21330093255113],
				[16.182509871582266, 48.171188781681685],
				[16.214095564941385, 48.15103595302693],
				[16.240188094238867, 48.13454138605015],
				[16.220962020019996, 48.12354206339239],
				[16.225081893066452, 48.118041518624324],
				[16.26902720556672, 48.131791776241336],
				[16.310225936035717, 48.119875098988174],
				[16.3445582114261, 48.14004016396463],
				[16.411849471191687, 48.118958316986735],
				[16.45304820166069, 48.12354206339239],
				[16.480514021972454, 48.15836517039244],
				[16.579390975098057, 48.13912374187657],
				[16.57252452001944, 48.16477737679562],
				[16.53269908056652, 48.17668363365554],
				[16.542312117676406, 48.19499555421965],
				[16.550551863769304, 48.24257593121039],
				[16.542312117676406, 48.263606993417284],
				[16.51209971533247, 48.28828459468936],
				[16.47502085790992, 48.2974214222864],
				[16.484633895019805, 48.27457628773837],
				[16.43794200048827, 48.29376688743812],
				[16.436568709473086, 48.317516688262],
				[16.420089217285486, 48.32482209596192],
				[16.385756941895103, 48.31842992144075]
			]]
		]);
		context.ServiceBoundaries.add(new Lost.ServiceBoundary({
			BoundaryGeom: vie,
			ReferenceID: guid.v4(),
			ServiceID: viePolSvc.ID,
			SVC: viePolSvc
		}));
		context.ServiceBoundaries.add(new Lost.ServiceBoundary({
			BoundaryGeom: vie,
			ReferenceID: guid.v4(),
			ServiceID: vieFireSvc.ID,
			SVC: vieFireSvc
		}));
		
		// Service boundaries (Linz City Area)
		var lnz = new $data.GeographyMultiPolygon([
			[[
				[14.25784251318495, 48.33901613635277],
				[14.254409285645645, 48.316189617161974],
				[14.257155867676909, 48.30340230355727],
				[14.270888777833243, 48.28649986720296],
				[14.294234725099457, 48.281930680635696],
				[14.318953963379961, 48.28787054346822],
				[14.341613265138133, 48.29380971553251],
				[14.319640608888001, 48.322125495017566],
				[14.345733138184587, 48.32486489800149],
				[14.3278803549818, 48.351794524535286],
				[14.289428206544068, 48.36548209962972],
				[14.275695296387735, 48.349969236656854],
				[14.275695296387735, 48.349512904471226],
				[14.25784251318495, 48.33901613635277]
			]]
		]);
		context.ServiceBoundaries.add(new Lost.ServiceBoundary({
			BoundaryGeom: lnz,
			ReferenceID: guid.v4(),
			ServiceID: viePolSvc.ID,
			SVC: lnzPolSvc
		}));
		
		// Service boundaries (Salzburg City Area)
		var szg = new $data.GeographyMultiPolygon([
			[[
				[12.991668196778203, 47.83354924440462],
				[12.964202376466435, 47.80035123966901],
				[13.004714461426493, 47.78051452923158],
				[13.001967879396128, 47.75882388226606],
				[13.017760726075686, 47.752361089786405],
				[13.060332747559869, 47.76159340474744],
				[13.08161875830196, 47.75513095628235],
				[13.082992049317147, 47.77220854180256],
				[13.111144515137855, 47.78236012403049],
				[13.126937361817413, 47.80173491366282],
				[13.100158187012788, 47.81280297891515],
				[13.085738631348413, 47.8275567304692],
				[13.078872176270695, 47.837697502557184],
				[13.061706038575053, 47.84276714548318],
				[13.037673445801696, 47.829861625409244],
				[13.006774397950618, 47.82156352457466],
				[12.996474715333592, 47.827095739197766],
				[12.991668196778203, 47.83354924440462]
			]]
		]);
		context.ServiceBoundaries.add(new Lost.ServiceBoundary({
			BoundaryGeom: szg,
			ReferenceID: guid.v4(),
			ServiceID: szgFireSvc.ID,
			SVC: szgFireSvc
		}));
		
		// Save test data to DB
		context.saveChanges(function (count) {
			totalCount += count;
			deferred.resolve(totalCount);
		});
	});

	return deferred.promise;
}
