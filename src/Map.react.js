import { default as React, Component } from "react";
import { default as update } from "react-addons-update";

import { default as canUseDOM } from "can-use-dom";
import { default as _ } from "lodash";

import { GoogleMapLoader, GoogleMap, Marker, Polygon } from "react-google-maps";
import { triggerEvent } from "react-google-maps/lib/utils";

const geolocation = (
  canUseDOM && navigator.geolocation || {
    getCurrentPosition: (success, failure) => {
      failure(`Your browser doesn't support geolocation.`);
    },
  }
);

function getCirclePoints(center, radius, numPoints, clockwise) {
  let points = [];
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

export default class Map extends Component {

  state = {
    center: null,
    markers: [],
  }

  constructor(props, context) {
    super(props, context);
    this.handleWindowResize = _.throttle(::this.handleWindowResize, 500);
  }

  componentDidMount() {
    if (!canUseDOM) {
      return;
    }
    geolocation.getCurrentPosition((position) => {
      this.setState({
        center: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      });
    });
    window.addEventListener(`resize`, this.handleWindowResize);
  }

  componentWillUnmount() {
    if (!canUseDOM) {
      return;
    }
    window.removeEventListener(`resize`, this.handleWindowResize);
  }

  handleWindowResize() {
    triggerEvent(this._googleMapComponent, `resize`);
  }

  handleMapClick(event) {
    let {markers} = this.state;
    markers = update(markers, {
      $push: [
        {
          footprint: 3,
          key: Date.now(),
          label: '3',
          position: event.latLng,
        },
      ],
    });
    this.setState({markers});
  }

  handleMarkerClick(index, marker, event) {
    let {markers} = this.state;
    markers = update(markers, {
      $splice: [
        [index, 1],
      ],
    });
    const newFootprint = marker.footprint - 1;
    if (newFootprint > 0) {
      markers = update(markers, {
        $push: [
          {
            footprint: newFootprint,
            key: Date.now(),
            label: '' + newFootprint,
            position: event.latLng,
          },
        ],
      });
    }

    this.setState({markers});
  }

  _renderDonut(center, outerRadius, innerRadius) {
    const paths = [
      getCirclePoints(center, outerRadius, 720, true),
      getCirclePoints(center, innerRadius, 720, false)
    ];
    const options = {
      fillColor: "#FF0000",
      fillOpacity: 0.20,
      strokeWeight: 0,
    };

    return (
      <Polygon
        key={Date.now()}
        options={options}
        paths={paths}
        onClick={this.handleMapClick.bind(this)}
      />
    );
  }

  _renderDonutFromMarker(marker) {
    switch (marker.footprint) {
      case 3:
        return this._renderDonut(marker.position, 1000, 100);
      case 2:
        return this._renderDonut(marker.position, 100, 10);
      case 1:
      default:
        return this._renderDonut(marker.position, 10, 0);
    }
  }

  render() {
    const center = this.state.center || {lat: 37.4034, lng: -122.1126};
    return (
      <GoogleMapLoader
        containerElement={
          <div
            {...this.props}
            style={{
              height: `100%`,
            }}
          />
        }
        googleMapElement={
          <GoogleMap
            options={{
              mapTypeControl: false,
              streetViewControl: false,
            }}
            center={center}
            defaultZoom={14}
            ref={(map) => (this._googleMapComponent = map)}
            onClick={::this.handleMapClick}>
            {this.state.markers.map((marker, index) => {
              return [
                <Marker
                  {...marker}
                  onClick={this.handleMarkerClick.bind(this, index, marker)}
                />,
                this._renderDonutFromMarker(marker),
              ];
            })}
          </GoogleMap>
        }
      />
    );
  }
}
