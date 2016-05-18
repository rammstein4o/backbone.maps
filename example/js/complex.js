var museums = [
	{
		title: "Walker Art Center",
		lat: 44.9796635,
		lng: -93.2748776,
		type: 'museum'
	}, {
		title: "Science Museum of Minnesota",
		lat: 44.9429618,
		lng: -93.0981016,
		type: 'museum'
	}, {
		title: "The Museum of Russian Art",
		lat: 44.9036337,
		lng: -93.2755413,
		type: 'museum'
	}
];
var bars = [
	{
		title: "Park Tavern",
		lat: 44.9413272,
		lng: -93.3705791,
		type: 'bar'
	}, {
		title: "Chatterbox Pub",
		lat: 44.9393882,
		lng: -93.2391039,
		type: 'bar'
	}, {
		title: "Acadia Cafe",
		lat: 44.9709853,
		lng: -93.2470717,
		type: 'bar'
	}
];

var App = {};

App.Location = Backbone.Maps.Location.extend({
	idAttribute: 'title',
	defaults: {
		lat: 45,
		lng: -93
	}
});

App.LocationCollection = Backbone.Maps.LocationCollection.extend({
	model: App.Location
});

App.InfoWindow = Backbone.Maps.InfoWindow.extend({
	template: '#infoWindow-template',
	
	events: {
		'mouseenter h2': 'logTest'
	},
	
	logTest: function() {
		console.log('test in InfoWindow');
	}
});

App.MarkerView = Backbone.Maps.MarkerView.extend({
	infoWindow: App.InfoWindow,
	
	initialize: function() {
		_.bindAll(this, 'handleDragEnd');
	},
	
	mapEvents: {
		'dragend': 'handleDragEnd',
		'dblclick': 'tellTheWorldAboutIt'
	},
	
	handleDragEnd: function(e) {
		alert('Dropped at: \n Lat: ' + e.latLng.lat() + '\n lng: ' + e.latLng.lng());
	},
	
	tellTheWorldAboutIt: function() {
		console.assert(this instanceof App.MarkerView);
		alert('You done gone and double-clicked me!');
		this.logIt('I hope you know that this will go down on your permanent record.');
	},
	
	logIt: function(message) {
		console.assert(this instanceof App.MarkerView);
		console.log(message);
	}
});

App.MuseumMarker = App.MarkerView.extend({
	overlayOptions: {
		draggable: true,
		icon: 'img/museum.png'
	}
});

App.BarMarker = App.MarkerView.extend({
	overlayOptions: {
		draggable: true,
		icon: 'img/beer.png'
	}
});

App.MarkerCollectionView = Backbone.Maps.MarkerCollectionView.extend({
	markerView: App.MarkerView,
	addChild: function(model) {
		this.markerView = model.get('type') === 'museum' ? App.MuseumMarker : App.BarMarker;
		Backbone.Maps.MarkerCollectionView.prototype.addChild.apply(this, arguments);
	}
});

App.init = function() {
	this.createMap();

	this.places = new this.LocationCollection(museums);

	// Render Markers
	var markerCollectionView = new this.MarkerCollectionView({
		collection: this.places,
		map: this.map
	});
	markerCollectionView.render();

	// Render ListView
	var listView = new App.ListView({
		collection: this.places
	});
	listView.render();
};

App.createMap = function() {
	var mapOptions = {
		center: new google.maps.LatLng(44.9796635, -93.2748776),
		zoom: 12,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	// Instantiate map
	this.map = new google.maps.Map($('#map_canvas')[0], mapOptions);
};

/**
 * List view
 */
App.ItemView = Backbone.View.extend({
	template: '<%=title %>',
	tagName: 'li',

	events: {
		'mouseenter': 'selectItem',
		'mouseleave': 'deselectItem'
	},

	initialize: function() {
		_.bindAll(this, 'render', 'selectItem', 'deselectItem');
		this.model.on("remove", this.close, this);
	},

	render: function() {
		var html = _.template(this.template)(this.model.toJSON());
		this.$el.html(html);
		return this;
	},

	close: function() {
		this.$el.remove();
	},

	selectItem: function() {
		this.model.select();
	},

	deselectItem: function() {
		this.model.deselect();
	}
});

App.ListView = Backbone.View.extend({
	tagName: 'ul',
	className: 'overlay',
	id: 'listing',

	initialize: function() {
		_.bindAll(this, "refresh", "addChild");

		this.collection.on("reset", this.refresh, this);
		this.collection.on("add", this.addChild, this);

		this.$el.appendTo('body');
	},

	render: function() {
		this.collection.each(this.addChild);
	},

	addChild: function(childModel) {
		var childView = new App.ItemView({ model: childModel });
		childView.render().$el.appendTo(this.$el);
	},

	refresh: function() {
		this.$el.empty();
		this.render();
	}
});

$(document).ready(function() {
	App.init();
	
	$('#bars').click(function() {
		App.places.reset(bars);
	});

	$('#museums').click(function() {
		App.places.reset(museums);
	});

	$('#addBtn').click(function() {
		App.places.add({
			title: 'State Capitol Building',
			lat: 44.9543075,
			lng: -93.102222
		});
	});

	$('#removeBtn').click(function() {
		App.places.remove(App.places.at(0));
	});
});
