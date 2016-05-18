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
		define(['backbone', 'underscore', 'jquery', 'leaflet', 'd3'], factory);
	} else if (typeof exports === 'object') {
		// as CommonJS module
		var _ = require('underscore'), $;
		try { $ = require('jquery'); } catch(e) {}
		var Backbone = require('backbone');
		var L = require('leaflet');
		var d3 = require('d3');
		module.exports = factory(Backbone, _, $, L, d3);
	} else {
		// Browser globals
		factory(root.Backbone, root._, root.jQuery || root.Zepto || root.ender, root.L, root.d3);
	}
}(this, function(Backbone, _, $, Leaflet, d3) {
	'use strict';
	
	var Maps = {};
	
	/**
	* Maps.Location
	* --------------------
	* Representing a lat/lng location on a map
	*/
	Maps.Location = Backbone.Model.extend({
		constructor: function() {
			_.bindAll(this, 'select', 'deselect', 'toggleSelect', 'getLatLng', 'getLatlng');
			
			this.defaults = _.extend({}, {
				lat: 0,
				lng: 0,
				selected: false,
				title: "",
				options: {}
			}, this.defaults);
			
			Backbone.Model.prototype.constructor.apply(this, arguments);
			// Trigger 'selected' and 'deselected' events
			this.on("change:selected", function(model, isSelected) {
				var topic = isSelected ? "selected" : "deselected";
				this.trigger(topic, this);
			}, this);
		},

		select: function() {
			this.set("selected", true);
		},

		deselect: function() {
			this.set("selected", false);
		},

		toggleSelect: function() {
			this.set("selected", !this.get("selected"));
		},

		getLatlng: function() {
			return this.getLatLng();
		},

		getLatLng: function() {
			return Leaflet.latLng(this.get("lat"), this.get("lng"));
		}
	});

	/**
	* Maps.LocationCollection
	* ------------------------------
	* A collection of map locations
	*/
	Maps.LocationCollection = Backbone.Collection.extend({
		constructor: function(opt_models, opt_options) {
			var options = _.defaults({}, opt_options, {
				model: Maps.Location
			});
			// Set default model
			options.model = (options.model || Maps.Location);
			Backbone.Collection.prototype.constructor.call(this, opt_models, options);
			// Deselect other models on model select
			// ie. Only a single model can be selected in a collection
			this.on("change:selected", function(selectedModel, isSelected) {
				if (isSelected) {
					this.each(function(model) {
						if (selectedModel.cid !== model.cid) {
							model.deselect();
						}
					});
				}
			}, this);
		}
	});


	/**
	* Maps.OverlayView
	* ------------------
	* Base maps overlay view from which all other overlay views extend
	*/
	Maps.OverlayView = Backbone.View.extend({
		constructor: function(options) {
			_.bindAll(this, 'render', 'close');
			
			this.mapEvents = this.mapEvents || {};
			this.overlayOptions = this.overlayOptions || {};
			Backbone.View.prototype.constructor.apply(this, arguments);
			this.options = options;

			// Ensure map and API loaded
			if (!Leaflet) throw new Error("Leaflet API is not loaded.");
			if (!this.options.map && !this.map) throw new Error("A map must be specified.");
			this.gOverlay = this.map = this.options.map || this.map;

			// Add overlayOptions from ctor options
			// to this.overlayOptions
			_.extend(this.overlayOptions, this.options.overlayOptions);
		},

		// Attach listeners to the this.gOverlay
		// From the `mapEvents` hash
		bindMapEvents: function(mapEvents, opt_context) {
			var context = opt_context || this;
			
			mapEvents = (mapEvents || this.mapEvents);
			
			_.each(mapEvents, function(handlerRef, topic) {
				var handler = this._getHandlerFromReference(handlerRef);
				this._addMapsListener(topic, handler, context);
			}, this);
		},

		// handlerRef can be a named method of the view (string)
		// or a refernce to any function.
		_getHandlerFromReference: function(handlerRef) {
			var handler = _.isString(handlerRef) ? this[handlerRef] : handlerRef;
			
			if (!_.isFunction(handler)) {
				throw new Error("Unable to bind map event. " + handlerRef + " is not a valid event handler method");
			}
			
			return handler;
		},

		_addMapsListener: function(topic, handler, opt_context) {
			if (opt_context) handler = _.bind(handler, opt_context);
			//~ google.maps.event.addListener(this.gOverlay, topic, handler);
		},

		render: function() {
			this.trigger('before:render');
			if (this.beforeRender) {
				this.beforeRender();
			}
			this.bindMapEvents();

			this.trigger('render');
			if (this.onRender) {
				this.onRender();
			}
			return this;
		},

		// Clean up view
		// Remove overlay from map and remove event listeners
		close: function() {
			this.trigger('before:close');
			if (this.beforeClose) {
				this.beforeClose();
			}
			if (this.gOverlay.close) {
				this.gOverlay.close();
			}
			//~ google.maps.event.clearInstanceListeners(this.gOverlay);
			if (this.gOverlay.setMap) {
				this.gOverlay.setMap(null);
			}
			this.gOverlay = null;

			this.trigger('close');
			if (this.onClose) {
				this.onClose();
			}
		}
	});

	/**
	* Maps.InfoWindow
	* ---------------------
	* View controller for a google.maps.InfoWindow overlay instance
	*/
	Maps.InfoWindow = Maps.OverlayView.extend({
		constructor: function(options) {
			Maps.OverlayView.prototype.constructor.apply(this, arguments);

			_.bindAll(this, 'render', 'close');

			// Require a related marker instance
			if (!this.options.marker && !this.marker) throw new Error("A marker must be specified for InfoWindow view.");
			this.marker = this.options.marker || this.marker;

			// Set InfoWindow template
			this.template = this.template || this.options.template;

		},
		
		onRender: function() {
			if (Maps.OverlayView.prototype.onRender) {
				Maps.OverlayView.prototype.onRender.apply(this, arguments);
			}
			// Render element
			var tmplFn;
			if (typeof this.template === 'function') {
				tmplFn = this.template;
			} else if (typeof this.template === 'string') {
				var tmpl = '<h2><%=title %></h2>';
				if (this.template) {
					if ($(this.template).length) {
						tmpl = $(this.template).html();
					} else {
						tmpl = this.template;
					}
				}
				tmplFn = _.template(tmpl);
			}
			if (typeof tmplFn === 'function') {
				this.$el.html(tmplFn(this.model.toJSON()));

				// Create InfoWindow
				this.gOverlay = Leaflet.popup()
					.setContent(this.$el.html())
					.addTo(this.map);
					
				this.marker.bindPopup(this.gOverlay);
			}
		}
		
	});


	/**
	* Maps.MarkerView
	* ---------------------
	* View controller for a marker overlay
	*/
	Maps.MarkerView = Maps.OverlayView.extend({
		constructor: function(options) {
			// Set associated InfoWindow view
			Maps.OverlayView.prototype.constructor.apply(this, arguments);
			
			_.bindAll(this, 'render', 'close', 'openDetail', 'closeDetail', 'toggleSelect');
			
			this.infoWindow = this.infoWindow || this.options.infoWindow || Maps.InfoWindow;
			
			// Ensure model
			if (!this.model) throw new Error("A model must be specified for a MarkerView");

			// Instantiate marker, with user defined properties
			this.gOverlay = Leaflet.marker(this.model.getLatLng(), _.extend({
					title: this.model.title,
					opacity: 0
				}, this.overlayOptions)).addTo(this.map);
			
			// Add default mapEvents
			_.extend(this.mapEvents, {
				'click': 'toggleSelect'// Select model on marker click
			});

			// Show detail view on model select
			this.model.on("change:selected", function(model, isSelected) {
				if (isSelected) {
					this.openDetail();
				} else {
					this.closeDetail();
				}
			}, this);
			this.model.on("change:lat change:lng", this.refreshOverlay, this);

			// Sync location model lat/lng with marker position
			this.bindMapEvents({
				'position_changed': 'updateModelPosition'
			});
		},

		// update overlay position if lat or lng change
		refreshOverlay: function() {
			// Only update overlay if we're not already in sync
			// Otherwise we end up in an endless loop of
			// update model <--eventhandler--> update overlay
			if (!this.model.getLatLng().equals(this.gOverlay.getLatLng())) {
				this.gOverlay.setLatLng(this.model.getLatLng()).update();
			}
		},

		updateModelPosition: function() {
			var newPosition = this.gOverlay.getLatLng();

			// Only update model if we're not already in sync
			// Otherwise we end up in an endless loop of
			// update model <--eventhandler--> update overlay
			if (!this.model.getLatLng().equals(newPosition)) {
				this.model.set({
					lat: newPosition.lat,
					lng: newPosition.lng
				});
			}
		},

		toggleSelect: function() {
			this.model.toggleSelect();
		},
		
		onRender: function() {
			if (Maps.OverlayView.prototype.onRender) {
				Maps.OverlayView.prototype.onRender.apply(this, arguments);
			}
			this.gOverlay.setOpacity(1);
		},
		
		beforeClose: function() {
			if (Maps.OverlayView.prototype.beforeClose) {
				Maps.OverlayView.prototype.beforeClose.apply(this, arguments);
			}
			this.closeDetail();
		},
		
		onClose: function() {
			if (Maps.OverlayView.prototype.onClose) {
				Maps.OverlayView.prototype.onClose.apply(this, arguments);
			}
			this.model.off();
		},

		openDetail: function() {
			this.detailView = new this.infoWindow({
				model: this.model,
				map: this.map,
				marker: this.gOverlay
			});
			this.detailView.render();
		},

		closeDetail: function() {
			if (this.detailView) {
				this.detailView.close();
				this.detailView = null;
			}
		}
	});


	/**
	* Maps.MarkerCollectionView
	* -------------------------------
	* Collection of MarkerViews
	*/
	Maps.MarkerCollectionView = Backbone.View.extend({
		constructor: function(options) {
			this.markerView = this.markerView || Maps.MarkerView;
			this.markerViewChildren = this.markerViewChildren || {};

			Backbone.View.prototype.constructor.apply(this, arguments);

			this.options = options;

			_.bindAll(this, 'render', 'closeChildren', 'closeChild', 'addChild', 'refresh', 'close');

			// Ensure map property
			if (!this.options.map && !this.map) throw new Error("A map must be specified on MarkerCollectionView instantiation");
			this.map = (this.map || this.options.map);

			// Bind to collection
			this.collection.on("reset", this.refresh, this);
			this.collection.on("add", this.addChild, this);
			this.collection.on("remove", this.closeChild, this);
		},

		// Render MarkerViews for all models in collection
		render: function(collection) {
			collection = (collection || this.collection);

			this.trigger('before:render');
			if (this.beforeRender) {
				this.beforeRender();
			}

			// Create marker views for each model
			collection.each(this.addChild);

			this.trigger('render');
			if (this.onRender) {
				this.onRender();
			}

			return this;
		},

		// Close all child MarkerViews
		closeChildren: function() {
			for (var cid in this.markerViewChildren) {
				this.closeChild(this.markerViewChildren[cid]);
			}
		},

		closeChild: function(child) {
			// Param can be child's model, or child view itself
			var childView = (child instanceof Maps.Location) ? this.markerViewChildren[child.cid] : child;
			childView.close();
			delete this.markerViewChildren[childView.model.cid];
		},

		// Add a MarkerView and render
		addChild: function(childModel) {
			var options = {};
			if (this.options.markerOptions) {
				options.overlayOptions = this.options.markerOptions;
			} else if (childModel.get('options')) {
				options.overlayOptions = childModel.get('options');
			}
			
			options = _.extend(options, {
				model: childModel,
				map: this.map
			});
			
			var markerView = new this.markerView(options);
			this.markerViewChildren[childModel.cid] = markerView.render();
		},

		refresh: function() {
			this.closeChildren();
			this.render();
		},

		// Close all child MarkerViews
		close: function() {
			this.closeChildren();
			this.collection.off();
		}
	});
	
	Maps.OverlayViewD3 = Maps.OverlayView.extend({
		constructor: function(options) {
			Maps.OverlayView.prototype.constructor.apply(this, arguments);
			var _this = this;
			//~ this.gBounds = new google.maps.LatLngBounds();
			//~ this.gOverlay = new google.maps.OverlayView();
			this.gLayer = null;
			this.gOverlay.onAdd = function() {
				_this.gLayer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "stations");
			};
			this.markers = {};
		},
		
		addMarker: function(model) {
			model = (model instanceof Maps.Location) ? model : new Maps.Location(model);
			this.markers[model.cid] = model;
		},
		
		onRender: function() {
			if (Maps.OverlayView.prototype.onRender) {
				Maps.OverlayView.prototype.onRender.apply(this, arguments);
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

	Backbone.Maps = Maps;
	return Maps;
}));
