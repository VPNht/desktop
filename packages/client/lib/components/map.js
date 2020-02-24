import React, { useContext, useEffect, useState } from "react";
import GoogleMapReact from "google-map-react";
import appContext from "../store";

const DEFAULT_ZOOM = 5;

const MapMarker = ({ children, lat, lng, key, zIndex }) => {
  return (
    <div lat={lat} lng={lng} key={key} style={{ zIndex, position: "relative" }}>
      {children}
    </div>
  );
};

export default ({ connectServer }) => {
  const [state] = useContext(appContext);
  const [viewport, setViewport] = useState({
    zoom: DEFAULT_ZOOM,
    longitude: null,
    latitude: null
  });

  const goToViewport = ({ longitude, latitude, zoom = DEFAULT_ZOOM }) => {
    setViewport({
      longitude,
      latitude,
      zoom
    });
  };

  // on first load
  useEffect(() => {
    const closestServer = state.servers.reduce((prev, curr) => {
      return prev.distance < curr.distance ? prev : curr;
    });
    if (closestServer) {
      goToViewport({
        longitude: closestServer.longitude,
        latitude: closestServer.latitude,
        zoom: DEFAULT_ZOOM
      });
    }
  }, []);

  // effect when our currentServer change
  // simply center the map
  useEffect(() => {
    if (
      state.currentServer &&
      state.currentServer.longitude !== viewport.longitude &&
      state.currentServer.latitude !== viewport.latitude
    ) {
      goToViewport({
        longitude: state.currentServer.longitude,
        latitude: state.currentServer.latitude,
        zoom: DEFAULT_ZOOM
      });
    }
  }, [state.currentServer]);

  // on disconnect
  useEffect(() => {
    if (!state.isConnected) {
      const closestServer = state.servers.reduce((prev, curr) => {
        return prev.distance < curr.distance ? prev : curr;
      });
      goToViewport({
        longitude: closestServer.longitude,
        latitude: closestServer.latitude,
        zoom: DEFAULT_ZOOM
      });
    }
  }, [state.isConnected]);

  const buildMarker = server => {
    if (!server || !server.host) {
      return;
    }

    const isConnectedTo =
      state.currentServer &&
      state.isConnected &&
      server.host === state.currentServer.host;

    const isConnectingTo =
      state &&
      state.currentServer &&
      state.isConnected &&
      server.host === state.currentServer.host;

    // we should remove all blue marker
    // who have the same lat, long when we are connected
    if (
      (state.isConnected || state.isConnecting) &&
      state.currentServer &&
      server.latitude === state.currentServer.latitude &&
      server.longitude === state.currentServer.longitude &&
      server.host !== state.currentServer.host
    ) {
      return;
    }

    return (
      <MapMarker
        zIndex={isConnectedTo || isConnectingTo ? 2000 : 1000}
        key={`server-${server.host}`}
        lng={server.longitude}
        lat={server.latitude}
      >
        <svg
          className={
            state &&
            state.currentServer &&
            state.isConnecting &&
            server.host === state.currentServer.host
              ? "bounce"
              : ""
          }
          height="20"
          viewBox="0 0 24 24"
          style={{
            cursor: "pointer",
            fill: isConnectedTo ? "#00A6A3" : "#3182CE",
            stroke: "none"
          }}
          onClick={() => {
            connectServer(server.host);
          }}
        >
          <path d="M20.2,15.7L20.2,15.7c1.1-1.6,1.8-3.6,1.8-5.7c0-5.6-4.5-10-10-10S2,4.5,2,10c0,2,0.6,3.9,1.6,5.4c0,0.1,0.1,0.2,0.2,0.3 c0,0,0.1,0.1,0.1,0.2c0.2,0.3,0.4,0.6,0.7,0.9c2.6,3.1,7.4,7.6,7.4,7.6s4.8-4.5,7.4-7.5c0.2-0.3,0.5-0.6,0.7-0.9 C20.1,15.8,20.2,15.8,20.2,15.7z" />
        </svg>
      </MapMarker>
    );
  };

  return (
    <div className="w-full h-full overflow-hidden">
      {viewport.latitude && viewport.longitude && (
        <GoogleMapReact
          options={{
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            styles: [
              {
                elementType: "geometry",
                stylers: [
                  {
                    color: "#212121"
                  }
                ]
              },
              {
                elementType: "labels.icon",
                stylers: [
                  {
                    visibility: "off"
                  }
                ]
              },
              {
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#757575"
                  }
                ]
              },
              {
                elementType: "labels.text.stroke",
                stylers: [
                  {
                    color: "#212121"
                  }
                ]
              },
              {
                featureType: "administrative",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#757575"
                  },
                  {
                    visibility: "off"
                  }
                ]
              },
              {
                featureType: "administrative.country",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#9e9e9e"
                  }
                ]
              },
              {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#bdbdbd"
                  }
                ]
              },
              {
                featureType: "poi",
                stylers: [
                  {
                    visibility: "off"
                  }
                ]
              },
              {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#757575"
                  }
                ]
              },
              {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#181818"
                  }
                ]
              },
              {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#616161"
                  }
                ]
              },
              {
                featureType: "poi.park",
                elementType: "labels.text.stroke",
                stylers: [
                  {
                    color: "#1b1b1b"
                  }
                ]
              },
              {
                featureType: "road",
                stylers: [
                  {
                    visibility: "off"
                  }
                ]
              },
              {
                featureType: "road",
                elementType: "geometry.fill",
                stylers: [
                  {
                    color: "#2c2c2c"
                  }
                ]
              },
              {
                featureType: "road",
                elementType: "labels.icon",
                stylers: [
                  {
                    visibility: "off"
                  }
                ]
              },
              {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#8a8a8a"
                  }
                ]
              },
              {
                featureType: "road.arterial",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#373737"
                  }
                ]
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#3c3c3c"
                  }
                ]
              },
              {
                featureType: "road.highway.controlled_access",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#4e4e4e"
                  }
                ]
              },
              {
                featureType: "road.local",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#616161"
                  }
                ]
              },
              {
                featureType: "transit",
                stylers: [
                  {
                    visibility: "off"
                  }
                ]
              },
              {
                featureType: "transit",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#757575"
                  }
                ]
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#000000"
                  }
                ]
              },
              {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#3d3d3d"
                  }
                ]
              }
            ]
          }}
          bootstrapURLKeys={{ key: "AIzaSyCfVCUz38O29N8wDhwy04k3Qgc8mTrUMMM" }}
          zoom={viewport.zoom}
          center={{ lat: viewport.latitude, lng: viewport.longitude }}
        >
          {state.servers.map(server => buildMarker(server))}
        </GoogleMapReact>
      )}
    </div>
  );
};
