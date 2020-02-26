import React, { useContext, useEffect, useState, useRef } from "react";
import { Map, Marker, TileLayer, Popup } from "react-leaflet";
import L from "leaflet";
import appContext from "../store";

// default zoom
const DEFAULT_ZOOM = 4;

const defaultIconSettings = {
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50]
};

const defaultIcon = new L.Icon({
  ...defaultIconSettings,
  iconUrl: "./static/marker.svg",
  iconRetinaUrl: "./static/marker.svg"
});

const connectIcon = new L.Icon({
  ...defaultIconSettings,
  iconUrl: "./static/marker-yellow.svg",
  iconRetinaUrl: "./static/marker-yellow.svg"
});

const connectedIcon = new L.Icon({
  ...defaultIconSettings,
  iconUrl: "./static/marker-green.svg",
  iconRetinaUrl: "./static/marker-green.svg"
});

export default ({ connectServer }) => {
  const mapEl = useRef(null);
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
    if (state.servers) {
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

  // when sidebar change, invalidate map size
  // to redraw the correct size
  useEffect(() => {
    if (mapEl && mapEl.current && mapEl.current.leafletElement) {
      mapEl.current.leafletElement.invalidateSize(true);
    }
  }, [state.showSidebar]);

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
      state.isConnecting &&
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
      <div key={`marker-${server.host}`}>
        <Marker
          zIndexOffset={isConnectedTo || isConnectingTo ? 1000 : 1}
          icon={
            isConnectedTo
              ? connectedIcon
              : isConnectingTo
              ? connectIcon
              : defaultIcon
          }
          onClick={e => {
            connectServer(server.ip);
          }}
          onMouseOver={e => {
            e.target.openPopup();
          }}
          onMouseOut={e => {
            setTimeout(() => e.target.closePopup(), 1000);
          }}
          position={{ lat: server.latitude, lng: server.longitude }}
        >
          <Popup>
            {server.city && `${server.city}, ${server.country.toUpperCase()}`}
            {!server.city && server.countryName}
          </Popup>
        </Marker>
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-hidden">
      {viewport.latitude && viewport.longitude && (
        <Map
          ref={mapEl}
          className="h-full"
          attributionControl={false}
          zoom={viewport.zoom}
          minZoom={4}
          maxZoom={5}
          center={{ lat: viewport.latitude, lng: viewport.longitude }}
        >
          <TileLayer url="./static/mapTiles/{z}/{x}/{y}.jpg" />
          {state.servers
            .filter((server, sIndex, sArray) => {
              if (
                (state.isConnected || state.isConnecting) &&
                state.currentServer &&
                server.host === state.currentServer.host
              ) {
                // make sure this one will be added to the map
                return true;
              }

              // already have this lat long
              // we just don't draw all marker
              // we filter by lat long and thats it..
              return (
                sArray.findIndex(
                  s =>
                    s.latitude === server.latitude &&
                    s.longitude === server.longitude
                ) === sIndex
              );
            })
            .map(server => buildMarker(server))}
        </Map>
      )}
    </div>
  );
};
