/* global CodeMirror */
/* global Tools */
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

nl.Test = function(options) {
	this.tools;
	this.xmlEditor = null;
	this.xmlViewer = null;
	this.map = null;
	this.mapMarker = null;
	this.lastPosLat = 0;
	this.lastPosLon = 0;
	this.selectedURN = '';
	this.searchResults = [];
}

nl.Test.prototype.initialize = function() {
	var self = this;
	self.tools = new Tools();	
	
	// init XML request editor
    self.xmlEditor = CodeMirror.fromTextArea(document.getElementById('txtLostReq'), {
        mode: 'text/xml',
		theme: 'default lostTesterXmlEditor',
        tabSize: 4,
        lineNumbers: true,
		lineWrapping: false
    });
	self.xmlEditor.setValue('');
	
	// initialize XML response viewer
    self.xmlViewer = CodeMirror.fromTextArea(document.getElementById('txtLostRes'), {
		//mode: 'application/ld+json',
        mode: 'text/xml',
		theme: 'default lostTesterXmlViewer',
        tabSize: 4,		
        lineNumbers: true,
		lineWrapping: true,
		readOnly: true
    });
	self.xmlViewer.setValue('');
	
	// initialize map
	self.map = new nl.Map(this, 'mapx');
	self.map.initialize();
	self.map.getObject().on('click', function(e) {
		self.setMarker(e.latlng);
	});
	self.map.getObject().on('locationfound', function(e) {
		self.setMarker(e.latlng);
	});
	
	// load supported URN's from server and populate URN drop down box
	self.loadURNs();
}

nl.Test.prototype.updateMarkerPos = function(latlng) {
	var self = this;
	$('#spnPos').html(latlng.lat + ', ' + latlng.lng);
	self.lastPosLat = latlng.lat;
	self.lastPosLon = latlng.lng;
}

nl.Test.prototype.loadTemplate = function(templateName) {
	var self = this;
	if(!templateName) {
		self.xmlEditor.setValue('');
		return;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', './templates/' + templateName, true);
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4)
			if (xmlhttp.status == 200)
				self.xmlEditor.setValue(xmlhttp.responseText);
	}
	xmlhttp.send();
}

nl.Test.prototype.loadURNs = function() {
	var self = this;
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', '/lost.data.svc/getURNs', true);
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4)
			if (xmlhttp.status == 200) {
				//console.log(xmlhttp.responseText);
				var o = JSON.parse(xmlhttp.responseText);
				//console.log(o);

				// fill service select list
				$('#svcList').append(o.d.results.map(function(svc) {
					return '<option value="' + svc + '">' + svc + '</option>';
				}).join(''));
				
				// render bootstrap combobox from select list
				$('#svcList').combobox({bsVersion: '3'});
				
				// read user input
				$('input.combobox.form-control.input-sm').on('input', function(evt) {
					self.selectedURN = evt.currentTarget.value;
				});	
				
				// read user select from drop down
				$('#svcList').on('change', function(evt) {
					self.selectedURN = evt.currentTarget.value;
				});	
			}
	}
	xmlhttp.send();
}

nl.Test.prototype.goHome = function() {
	var self = this;
	self.map.getObject().locate({
		setView: true, 
		maxZoom: 15
	});
}

nl.Test.prototype.searchLocation = function(place) {
	var self = this;

    if (!place || place.trim().length == 0)
        return;

    var url = "http://nominatim.openstreetmap.org/search?q=" + 
		place.replace(" ", "+") + "&format=json&addressdetails=1";

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', url, true);

    xmlhttp.onreadystatechange = function() {
        if(xmlhttp.readyState == 4) {
            if(xmlhttp.status == 200) {
                var data = [];
				try {
					data = JSON.parse(xmlhttp.response);
				}
				catch(ex) {}
				self.searchResults = data;
				if (data.length > 0) {
					self.setMarkerSearchResult(0, true, 'red', 
						data.length + ' search result' + 
						(data.length > 1 ? 's': ''));
				}
            }
        }
    }

    // Send the POST request
    //xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.send();	
}	

nl.Test.prototype.setMarker = function(latlng, panTo, popupContent, showPopup, color, title) {
	var self = this;
	
	if(!color && self.mapMarker) {
		if(!self.tools.endsWith(self.mapMarker._icon.src, 'marker-icon.png'))
			self.removeMarker();
	}
	
	if(color && self.mapMarker) {
		if(self.tools.endsWith(self.mapMarker._icon.src, 'marker-icon.png'))
			self.removeMarker();
	}
	
	if(!self.mapMarker) {
		var markerOptions = {
			title: title
		};
		if(color) {
			markerOptions.draggable = false;
			markerOptions.icon = L.icon({
				iconUrl: '/assets/images/marker-icon_' + color + '.png',
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [0, -41]
			});		
		}
		else {
			markerOptions.draggable = true;
		}
		
		self.mapMarker = L.marker([latlng.lat, latlng.lng], markerOptions);
				
		self.mapMarker.on('add', function(e) {
			self.mapMarker.unbindPopup();
			var latlng = self.mapMarker.getLatLng();
			self.updateMarkerPos(latlng);
		});
		self.mapMarker.on('move', function(e) {
			self.mapMarker.unbindPopup();
			var latlng = self.mapMarker.getLatLng();
			self.updateMarkerPos(latlng);
		});
		self.mapMarker.on('drag', function(e) {
			self.mapMarker.unbindPopup();
			var latlng = self.mapMarker.getLatLng();
			self.updateMarkerPos(latlng);
		});
		self.mapMarker.on('dragend', function(e) {
			self.mapMarker.unbindPopup();
			var latlng = self.mapMarker.getLatLng();
			self.updateMarkerPos(latlng);
		});
		
		self.mapMarker.addTo(self.map.getObject());
	}
	else
		self.mapMarker.setLatLng(latlng);
		
	if(panTo)
		self.map.getObject().panTo(latlng);
		
	if(popupContent) {
		self.mapMarker.bindPopup(popupContent, {
			maxHeight: 150
		});
		if(showPopup)
			self.mapMarker.openPopup();
	}
}

nl.Test.prototype.removeMarker = function() {
	var self = this;
	
	if(self.mapMarker) {
		self.map.getObject().removeLayer(self.mapMarker);
		self.mapMarker = null;
	}
}

nl.Test.prototype.setMarkerSearchResult = function(index, showPopup, color, title) {
	var self = this;
	
	if(!self.tools.isInt(index))
		return;
	if(index < 0 || index > self.searchResults.length)
		return;
		
	var cnt = 0;
	var latlng = null;
	var indexEntry = '';
	var popupContent = 
		self.searchResults
			.map(function(item) {
				var entry;
				if(index === cnt) {
					indexEntry = '<div style="border-bottom:1px solid;"><b>' + item.display_name + '</b></div>';
					latlng = L.latLng(item.lat, item.lon)
					cnt++;
					return undefined;
				}
				else
					entry = '<a onClick="app.setMarkerSearchResult(' + cnt + ',true,\'red\')">' + 
						item.display_name + '</a>';
				cnt++;
				return entry;
			})
			.filter(function(item) {
				return item != undefined;
			})
			.join('</li><li>');
		
	if(!self.tools.isNullOrEmpty(popupContent))
		popupContent = '<ol><li>' + popupContent + '</li></ol>';
	
	if(!self.tools.isNullOrEmpty(indexEntry))
		popupContent = indexEntry + popupContent;
		
	self.setMarker(latlng, true, popupContent, showPopup, color, title);
}

nl.Test.prototype.clearReqMarks = function() {
	var self = this;
	
	self.lastPosLat = 0;
	self.lastPosLon = 0;
	self.selectedURN = '';
	
	self.removeMarker();
	
	CodeMirror.commands.clearMarks(self.xmlEditor);
	$('#spnPos').html('0.0, 0.0');
	$('input.combobox.form-control.input-sm').val('');
	$('div.combobox-container.combobox-selected').removeClass('combobox-selected');
}

nl.Test.prototype.updateReq = function() {
	var self = this;
	
	self.updatePos();
	self.updateSvc();
	CodeMirror.commands.showMarks(self.xmlEditor, 
		'/' +
		'<p2:pos>[\\s\\S]*<\/p2:pos>|' +
		'<service>[\\s\\S]*<\/service>' +
		'/gi');
}

nl.Test.prototype.updatePos = function() {
	var self = this;
	var req = self.xmlEditor.getValue();
	req = req.replace(
		/(<p2:pos>)(\s*(.*)\s*)(<\/p2:pos>)/gi, 
		'$1' + self.lastPosLat + ' ' + self.lastPosLon + '$4');
	self.xmlEditor.setValue(req);
}

nl.Test.prototype.updateSvc = function() {
	var self = this;
	var req = self.xmlEditor.getValue();
	req = req.replace(
		/(<service>)(\s*(.*)\s*)(<\/service>)/gi, 
		'$1' + self.selectedURN + '$4');
	self.xmlEditor.setValue(req);
}

nl.Test.prototype.sendRequest = function() {
	var self = this;
	var req = self.xmlEditor.getValue();

	$.ajax({
		type: "POST",
		url: '/lost.svc',
		data: req,
		success: function(data, status, xhr) {
			if(self.tools.realTypeOf(data) === 'XMLDocument') {
				self.xmlViewer.setOption('mode', 'text/xml');
				
				var xmlstr = data.xml ? data.xml : (new XMLSerializer()).serializeToString(data);
				xmlstr = xmlstr.replace(/></, '>\r\n<');
				
				self.xmlViewer.setValue(xmlstr);
			}
			else
				if(typeof(data) === 'string') {
					self.xmlViewer.setOption('mode', 'text/plain');
					self.xmlViewer.setValue(data);
				}
				else {
					self.xmlViewer.setOption('mode', 'application/ld+json');
					self.xmlViewer.setValue(JSON.stringify(data));
				}
		},
		error: function(xhr, status, errorThrown) {
			console.error(errorThrown);
		}
	});	
}

nl.Test.prototype.reqWordWrap = function() {
	var self = this;
	self.xmlEditor.setOption('lineWrapping', !self.xmlEditor.getOption('lineWrapping'));
	self.xmlEditor.refresh();
}

nl.Test.prototype.resWordWrap = function() {
	var self = this;
	self.xmlViewer.setOption('lineWrapping', !self.xmlViewer.getOption('lineWrapping'));
	self.xmlViewer.refresh();
}

