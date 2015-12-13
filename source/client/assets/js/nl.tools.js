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

function Tools() {
}

Tools.prototype.get = function(obj, key) {
	return key.split('.').reduce(function(o, x) {
		return (typeof o == 'undefined' || o === null) ? o : o[x];
	}, obj);
}

Tools.prototype.isNullOrEmpty = function(value) {
	return !value || value == '';
}

// see http://de.wikipedia.org/wiki/Uniform_Resource_Name
// or http://tools.ietf.org/html/rfc2141 
Tools.prototype.isURN = function(value) {
	var self = this;
	if(self.isNullOrEmpty(value))
		return false;
		
	var v = (typeof value === 'string' ? value : value.toString());
	var rx = new RegExp(
			'^(?:urn:[a-z]{1,31}' +
			'(:([\\.\\-a-zA-Z0-9/]|%[0-9a-fA-F]{2})*)+' +
			'(\\?\w+' +
			'(=([\\.\\-a-zA-Z0-9/]|%[0-9a-fA-F]{2})*)?' +
			'(&\w+' +
			'(=([\\.\\-a-zA-Z0-9/]|%[0-9a-fA-F]{2})*)?)*)?' +
			'\\*?)$');
	return rx.test(v);
}

Tools.prototype.isInt = function(i_int) {
	var i = parseInt(i_int);
	if (isNaN(i))
		return false;
	return i_int == i && i_int.toString() == i.toString();
}

Tools.prototype.realTypeOf = function(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1);
}

Tools.prototype.endsWith = function(s_str, s_suffix) {
	return s_str.indexOf(s_suffix, s_str.length - s_suffix.length) !== -1;
}	

Tools.prototype.parseStandardDate = function(value) {
	var self = this;
	if(self.isNullOrEmpty(value))
		return null;
	
	var rx = /^\s*(\d{4})-(1[0-2]|0[1-9])-(3[01]|[12][0-9]|0[1-9])\s+([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])\s*$/;
	if(!rx.test(value))
		return null;
		
	//var m = value.match(rx);
	// new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
	//var d = new Date(m[1], m[2], m[3], m[4], m[5], m[6]);
		
	var d = moment(value, 'YYYY-MM-DD HH:mm:ss');
	return d;
}

Tools.prototype.strRandomFromDict = function(length, dict) {
	var result = '';
	
	for (var i = 0; i < length; i++)
		result += dict[Math.floor(Math.random() * dict.length)];

	return result;
}

Tools.prototype.strRandom = function(length) {
	var self = this;
	var dict = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';	
	return self.strRandomFromDict(length, dict);
}

Tools.prototype.strRandomUUID = function() {
	var self = this;
	// e.g. 6ba7b810-9dad-11d1-80b4-00c04fd430c8
	var dict = "0123456789abcdef";
	return self.strformat("{0}-{1}-{2}-{3}-{4}",
			self.strRandomFromDict(8, dict),
			self.strRandomFromDict(4, dict),
			self.strRandomFromDict(4, dict), 
			self.strRandomFromDict(4, dict),
			self.strRandomFromDict(12, dict));
}

Tools.prototype.strTemplate = function(template, values, keepUnknown) {
	var self = this;
	
	if(self.isNullOrEmpty(template))
		return '';
			
	if(values) {
		template = template.replace(/<%\s*=\s*(\w[\.\w\d]*)\s*%>/g, function(g0, g1) {
			return self.get(values, g1) || (keepUnknown ? g0 : '');
		});
	}
	
	return template;
}

Tools.prototype.showAlert = function(parentElementSelector, message, keepExisting) {
	var self = this;
	
	if(self.isNullOrEmpty(parentElementSelector))
		return;
		
	var element = $(parentElementSelector);
	if(!element || !element.length || !element.length > 0)
		return;
	
	if(self.isNullOrEmpty(message) || !keepExisting)
		self.hideAlert(parentElementSelector);
	
	if(self.isNullOrEmpty(message))
		return;
	
	var alert = 					
		'<div class="alert alert-danger alert-dismissible" role="alert">' +
			'<button type="button" class="close" data-dismiss="alert">' +
				'<span aria-hidden="true">&times;</span>' +
					'<span class="sr-only">Close</span>' +
			'</button>' +
			'<span id="serviceDetailAlertMsg">' +
			message +
			'</span>';

	element.append(alert);
	element.show();
}

Tools.prototype.hideAlert = function(parentElementSelector) {
	$(parentElementSelector)
		.hide()
		.empty();
}

Tools.prototype.showMessageBox = function(parentElementSelector, title, 
		message, buttons) {
	var self = this;
	
	var parent = $(parentElementSelector);
	if(!parent || parent.length < 1)
		return Q();
	parent.empty();
	
	var deferred = Q.defer();	
	var baseID = self.strRandom(16);
	var boxID = baseID + '_mb';
	
	var boxTemplate = 
		'<div id="<%=id%>" class="modal fade" tabindex="-1" role="dialog" ' +
				'aria-labelledby="messageBoxTitle" aria-hidden="true">' +
			'<div class="modal-dialog">' +
				'<div class="modal-content">' +
					'<div class="modal-header">' +
						'<button type="button" class="close" data-dismiss="modal">' +
							'<span aria-hidden="true">&times;</span>' +
							'<span class="sr-only">Close</span>' +
						'</button>' +
						'<h4 class="modal-title"><%=title%></h4>' +
					'</div>' +
					'<div class="modal-body"><%=message%></div>' +
					'<div class="modal-footer"><%=buttons%></div>' +
				'</div>' +
			'</div>' +
		'</div>';
		
	var buttonHtml = '';	
	var buttonTemplate =
		'<button id="<%=id%>" type="button" ' +
			'class="btn <%=class%>" data-dismiss="modal"><%=text%></button>';

	if(buttons && buttons.length > 0) {
		for(var i = 0; i < buttons.length; i++) {
			var button = buttons[i];
			var buttonValues = {
				id: baseID + '_b' + i,
				text: button.text,
				class: button.class,
				result: button.result
			};
			buttonHtml += self.strTemplate(buttonTemplate, buttonValues);
		}
	}
	
	var boxValues = {
		id: boxID,
		title: title,
		message: message,
		buttons: buttonHtml
	}

	parent.html(self.strTemplate(boxTemplate, boxValues));

	if(buttons && buttons.length > 0) {
		for(var i = 0; i < buttons.length; i++) {
			var button = buttons[i];
			var btn = $('#' + baseID + '_b' + i);
			btn.data('btnData', button);
			btn.click(function() {
				var button = $(this).data('btnData');
				if(button && button.result)
					deferred.resolve(button.result)
				else
					deferred.reject(new Error('No result defined'));
			});
		}
	}
	
	var box = $('#' + boxID);
	box.on('hidden.bs.modal', function() {
		parent.empty();
	});	
	box.modal();
			
	return deferred.promise;
}



