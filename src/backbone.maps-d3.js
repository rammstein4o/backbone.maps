/*!
 * backbone.maps
 * A Backbone JS extension for interacting with javascript maps APIs
 * Copyright (c) 2015 Radoslav Salov
 * Distributed under MIT license
 * Copyright for portions of the project are held by:
 * Edan Schwartz (c) 2012-2015 ( https://github.com/eschwartz/backbone.googlemaps )
 */
(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['backbone.googlemaps', 'd3'], factory);
	} else if (typeof exports === 'object') {
		// as CommonJS module
		var GoogleMaps = require('backbone.googlemaps');
		var d3 = require('d3');
		module.exports = factory(GoogleMaps, d3);
	} else {
		// Browser globals
		factory(root.Backbone.GoogleMaps, root.d3);
	}
}(this, function(GoogleMaps, d3) {
	'use strict';
	
	GoogleMaps.MapViewD3 = GoogleMaps.MapView.extend({
		constructor: function(options) {
			GoogleMaps.MapView.prototype.constructor.apply(this, arguments);
			var _this = this;
			this.gBounds = new google.maps.LatLngBounds();
			this.gOverlay = new google.maps.OverlayView();
			this.gLayer = null;
			this.gOverlay.onAdd = function() {
				_this.gLayer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "stations");
			};
			this.markers = {};
		},
		
		addMarker: function(model) {
			model = (model instanceof GoogleMaps.Location) ? model : new GoogleMaps.Location(model);
			this.markers[model.cid] = model;
		},
		
		onRender: function() {
			if (GoogleMaps.MapView.prototype.onRender) {
				GoogleMaps.MapView.prototype.onRender.apply(this, arguments);
			}
			var _this = this;
			this.gOverlay.draw = function() {
				var projection = this.getProjection(), padding = 10;
				var marker = _this.gLayer.selectAll("svg").data(d3.entries(_this.markers)).each(transform)
					.enter().append("svg:svg")
					.each(transform)
					.attr("class", "marker");
					
				marker.append("svg:circle")
					.attr("r", 5)
					.attr("cx", padding)
					.attr("cy", padding)
					.on("click", toggleNode);
				
				function transform(d) {
					d = projection.fromLatLngToDivPixel(d.value.getLatLng());
					return d3.select(this).style("left", (d.x - padding) + "px").style("top", (d.y - padding) + "px");
				}
				
				function toggleNode() {
					var radius = (d3.select(this).attr("r") == 10 ? 5 : 10);
					d3.select(this).transition().duration(100).attr("r", radius);
				}
				
			};
			this.gOverlay.setMap(this.map);
		}
	});
	
	return GoogleMaps;
}));
