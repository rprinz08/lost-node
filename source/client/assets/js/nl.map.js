/* global nl */
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

nl.Map = function(app, mapID) {
	this.app = app;
	this.mapID = mapID;
	this.nativeMap = null;
	this.baseMaps = {};
	// Enter your BING API key here
	this.bingApiKey = "";
}

nl.Map.prototype.initialize = function() {
	var self = this;
	
	// create a map in the "map" div, set the view to a given place and zoom
	self.nativeMap = L.map(self.mapID).setView([48.19539, 16.3916], 13);


	// define leaflet basemap layers
	
	// Open Streetmap
	var osm = { groupName: 'Open Streetmap' };
	
	var osmRoad = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		});//.addTo(map);
	osmRoad.ecop = { layer: osmRoad, layerName: 'Roads', group: osm };
	
	osm.layers = [ osmRoad ];

	
	
	// Google
	var gmap = { groupName: 'Google' };
	
	var gmapRoad = new L.Google('ROADMAP');
	gmapRoad.ecop = { layer: gmapRoad, layerName: 'Roads', group: gmap };
	
	var gmapAerial = new L.Google('SATELLITE');
	gmapAerial.ecop = { layer: gmapAerial, layerName: 'Aerial', group: gmap };
	
	var gmapHybrid = new L.Google('HYBRID');
	gmapHybrid.ecop = { layer: gmapHybrid, layerName: 'Aerial with Labels', group: gmap };
	
	var gmapTerrain = new L.Google('TERRAIN');
	gmapTerrain.ecop = { layer: gmapTerrain, layerName: 'Physical', group: gmap };
	
	gmap.layers = [ gmapRoad, gmapAerial, gmapHybrid, gmapTerrain ];

	
	
	// Microsoft Bing Maps
	var bing = { groupName: 'Bing' };
	
	var bingRoad = new L.BingLayer(self.bingApiKey, { type: 'Road' } );
	bingRoad.ecop = { layer: gmapRoad, layerName: 'Roads', group: bing };
	
	var bingAerial = new L.BingLayer(self.bingApiKey, { type: 'Aerial' } );
	bingAerial.ecop = { layer: gmapRoad, layerName: 'Aerial', group: bing };
	
	var bingHybrid = new L.BingLayer(self.bingApiKey, { type: 'AerialWithLabels' } );
	bingHybrid.ecop = { layer: gmapRoad, layerName: 'Aerial with Labels', group: bing };
	
	bing.layers = [ bingRoad, bingAerial, bingHybrid ];

	
	
	self.baseMaps = {};
	self.baseMaps[osm.groupName + ' ' + osmRoad.ecop.layerName] = osmRoad;
	self.baseMaps[gmap.groupName + ' ' + gmapRoad.ecop.layerName] = gmapRoad;
	self.baseMaps[gmap.groupName + ' ' + gmapAerial.ecop.layerName] = gmapAerial;
	self.baseMaps[gmap.groupName + ' ' + gmapHybrid.ecop.layerName] = gmapHybrid;
	self.baseMaps[gmap.groupName + ' ' + gmapTerrain.ecop.layerName] = gmapTerrain;
	self.baseMaps[bing.groupName + ' ' + bingRoad.ecop.layerName] = bingRoad;
	self.baseMaps[bing.groupName + ' ' + bingAerial.ecop.layerName] = bingAerial;
	self.baseMaps[bing.groupName + ' ' + bingHybrid.ecop.layerName] = bingHybrid;
	
	// add leaflet layer selector to map
	L.control.layers(self.baseMaps)
		.addTo(self.nativeMap);
	
	// add a marker in the given location, attach some popup content to it and open the popup
	/*
	L.marker([51.5, -0.09]).addTo(map)
		.bindPopup('A pretty CSS3 popup. <br> Easily customizable.')
		.openPopup();
	*/
	
	self.nativeMap.addLayer(osmRoad); 
}

nl.Map.prototype.mapSwitchBaseMapByName = function(map, baseMaplayerName) {
	var self = this;
	if(self.baseMaps.hasOwnProperty(baseMaplayerName)) {
		self.nativeMapSwitchBaseMap(map, self.baseMaps[baseMaplayerName]);
	}
}

nl.Map.prototype.mapSwitchBaseMap = function(map, baseMaplayerName) {
	var self = this;
	for(var baseMaplayerName in self.baseMaps) {
		if(self.baseMaps.hasOwnProperty(baseMaplayerName)) {
			if (self.nativeMap.hasLayer(self.baseMaps[baseMaplayerName]) && 
					self.baseMaps[baseMaplayerName] != baseMaplayer) { 
				self.nativeMap.removeLayer(self.baseMaps[baseMaplayerName]); 
			} 
		}
	}
	
	self.nativeMap.addLayer(baseMaplayer); 
}

nl.Map.prototype.getObject = function() {
	var self = this;
	return self.nativeMap;
}


