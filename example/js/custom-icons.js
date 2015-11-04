var places = new Backbone.GoogleMaps.LocationCollection([
	{
		title: "Walker Art Center",
		lat: 44.9796635,
		lng: -93.2748776,
		options: {
			icon: {
				path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
				strokeColor: "black",
				strokeWeight: 2,
				scale: 6
			}
		}
	}, {
		title: "Science Museum of Minnesota",
		lat: 44.9429618,
		lng: -93.0981016,
		options: {
			icon: {
				path: 'm0,0c0.69092,0 12.0909,-32.7778 12.0909,-32.7778c0,0 -8.63636,-17.2222 -8.63636,-17.2222c0,0 -10.36363,14.4444 -10.36363,14.4444l6.90909,35.5556z',
				fillColor: '#777777',
				fillOpacity: 0.8,
				strokeColor: "black",
				strokeWeight: 2,
				scale: 1
			}
		}
	}, {
		title: "Chatterbox Pub",
		lat: 44.9393882,
		lng: -93.2391039,
		options: {
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				fillColor: '#00ff00',
				fillOpacity: 1,
				strokeColor: "green",
				strokeWeight: 2,
				scale: 12
			}
		}
	}, {
		title: "Acadia Cafe",
		lat: 44.9709853,
		lng: -93.2470717,
		options: {
			icon: {
				path: 'm0,0c-0.34091,0.29409 16.70419,-19.99785 16.70419,-19.99785c0,0 -50.31381,-5.70713 -30.34027,0.58817c19.97355,6.2953 13.63608,19.40967 13.63608,19.40967l0,0.00001z',
				fillColor: '#7f0000',
				fillOpacity: 1,
				scale: 1,
				strokeColor: 'gold',
				strokeWeight: 2

			}
		}
	}
]);

$(document).ready(function() {
	var mapOptions = {
		center: new google.maps.LatLng(44.9796635, -93.2748776),
		zoom: 11,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	// Instantiate map
	var map = new google.maps.Map($('#map_canvas')[0], mapOptions);
	
	// Render Markers
	var markerCollectionView = new Backbone.GoogleMaps.MarkerCollectionView({
		collection: places,
		map: map
	});
	markerCollectionView.render();
});
