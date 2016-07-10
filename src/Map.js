window.map = null;
window.markers = [];
window.initMap = function(){
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -33.9, lng: 151.2},
    zoom: 14
  });
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      map.setCenter(initialLocation);
    }, function() {
      // handleNoGeolocation(browserSupportFlag);
    });
  }
   map.addListener('click', function(event) {
     addMarker(event.latLng, 3);
   });
}

function drawDonut(center, outerRadius, innerRadius) {
  var donut = new google.maps.Polygon({
     paths: [
       getCirclePoints(center, outerRadius, 1440, true),
       getCirclePoints(center, innerRadius, 1440, false)
     ],
     strokeColor: "#0000FF",
     strokeOpacity: 0.8,
     strokeWeight: 2,
     fillColor: "#FF0000",
     map: map,
     fillOpacity: 0.35
   });
  return donut;
}

function getCirclePoints(center, radius, numPoints, clockwise) {
    var points = [];
    for (var i = 0; i < numPoints; ++i) {
        var angle = i * 360 / numPoints;
        if (!clockwise) {
            angle = 360 - angle;
        }

        var p = google.maps.geometry.spherical.computeOffset(center, radius, angle);
        points.push(p);
    }

    // 'close' the polygon
    points.push(points[0]);
    return points;
}

function addMarker(center, size) {
  var marker = new google.maps.Marker({
    position: center,
    label: '' + size,
    map: map
  });

  var donut;
  switch (size) {
    case 3:
      donut = drawDonut(center, 1000, 100);
      break;
    case 2:
      donut = drawDonut(center, 100, 10);
      break;
    case 1:
    default:
      donut = drawDonut(center, 10, 0);
      break;
  }

  google.maps.event.addListener(marker, 'click', function() {
    marker.setMap(null);
    donut.setMap(null);

    var newSize = size - 1;
    if (newSize > 0) {
      addMarker(center, newSize);
    }
  });
  google.maps.event.addListener(donut, 'click', function(event) {
    addMarker(event.latLng, 3);
  });
  markers.push(marker);
}
