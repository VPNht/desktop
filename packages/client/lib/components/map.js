import React, { useContext, useEffect, useState } from "react";
import ReactMapGL, { Marker, FlyToInterpolator } from "react-map-gl";
import appContext from "../store";

const settings = {
  dragPan: true,
  scrollZoom: true,
  touchZoom: true,
  doubleClickZoom: true,
  dragRotate: false,
  touchRotate: false,
  minZoom: 2,
  maxZoom: 5
};

export default ({ connectServer }) => {
  const [state] = useContext(appContext);
  const [viewport, setViewport] = useState({});

  const goToViewport = ({ longitude, latitude, zoom = 1 }) => {
    setViewport({
      longitude,
      latitude,
      zoom,
      transitionInterpolator: new FlyToInterpolator(),
      transitionDuration: "auto"
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
        zoom: 3
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
        zoom: 4
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
        zoom: 3
      });
    }
  }, [state.isConnected]);

  const buildMarker = server => {
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
      <Marker
        key={`server-${server.host}`}
        longitude={server.longitude}
        latitude={server.latitude}
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
            zIndex: isConnectedTo || isConnectingTo ? "2000" : "1000",
            stroke: "none"
          }}
          onClick={() => {
            connectServer(server.host);
          }}
        >
          <path d="M20.2,15.7L20.2,15.7c1.1-1.6,1.8-3.6,1.8-5.7c0-5.6-4.5-10-10-10S2,4.5,2,10c0,2,0.6,3.9,1.6,5.4c0,0.1,0.1,0.2,0.2,0.3 c0,0,0.1,0.1,0.1,0.2c0.2,0.3,0.4,0.6,0.7,0.9c2.6,3.1,7.4,7.6,7.4,7.6s4.8-4.5,7.4-7.5c0.2-0.3,0.5-0.6,0.7-0.9 C20.1,15.8,20.2,15.8,20.2,15.7z" />
        </svg>
      </Marker>
    );
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <ReactMapGL
        className="mapbox"
        {...settings}
        {...viewport}
        mapboxApiAccessToken="pk.eyJ1IjoidnBuaHQiLCJhIjoiZmRlMDdmMDM2NDA5N2QxZTYzODE1OTliZGYxMGJhYTcifQ.FX9R5iheGniyeBsPhOEH3g"
        onViewportChange={newViewPort => {
          setViewport({ ...viewport, ...newViewPort });
        }}
        width="100%"
        height="100%"
        mapStyle="mapbox://styles/mapbox/dark-v9?optimize=true"
      >
        {state.servers.map(server => buildMarker(server))}
      </ReactMapGL>
    </div>
  );
};
