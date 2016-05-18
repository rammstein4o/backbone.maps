var places = new Backbone.Maps.LocationCollection([
	{
		title: "Walker Art Center",
		lat: 44.9796635,
		lng: -93.2748776
	}, {
		title: "Science Museum of Minnesota",
		lat: 44.9429618,
		lng: -93.0981016
	}, {
		title: "The Museum of Russian Art",
		lat: 44.9036337,
		lng: -93.2755413
	}, {
		title: "Park Tavern",
		lat: 44.9413272,
		lng: -93.3705791
	}, {
		title: "Chatterbox Pub",
		lat: 44.9393882,
		lng: -93.2391039
	}, {
		title: "Acadia Cafe",
		lat: 44.9709853,
		lng: -93.2470717
	}
]);

$(document).ready(function() {
	
	// Instantiate map
	var map = L.map('map_canvas').setView([44.9796635, -93.2748776], 9);
	
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(map);
	
	// Render Markers
	var markerCollectionView = new Backbone.Maps.MarkerCollectionView({
		collection: places,
		map: map
	});
	markerCollectionView.render();
	
});
