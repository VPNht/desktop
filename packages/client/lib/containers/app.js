import React, { useState, useEffect, useContext } from "react";
import Header from "./header";
import { ping, status, disconnect } from "../../helpers/service";
import { serversCountry } from "../../helpers/servers";
import { subscribe } from "../../helpers/events";
import { info, error as errorLog } from "../../helpers/logger";

import rpc from "../rpc";

import appContext from "../store";
import {
  APP_READY,
  SERVICE_ERROR,
  CONNECTED,
  SERVICE_SENT_UPDATE,
  SERVICE_LOG,
  VPN_ERROR,
  VIEW,
  LOGOUT
} from "../constants/actions";
import {
  CONNECTED as CONNECTED_VIEW,
  LOGS as LOGS_VIEW,
  SETTINGS as SETTINGS_VIEW,
  CONNECT as CONNECT_VIEW
} from "../constants/view";
import {
  SERVICE_NOT_AVAILABLE,
  AUTH_FAILED,
  DISCONNECT_INACTIVE,
  TIMEOUT_CONNECT,
  CANT_FETCH_REMOTE
} from "../constants/errors";

import ServiceNotAvailable from "../components/serviceNotAvailable";
import Loading from "../components/loading";
import Connect from "../components/connect";
import Login from "../components/login";
import Connected from "../components/connected";
import Settings from "../components/settings";
import Logs from "../components/logs";

export default () => {
  const [servers, setServers] = useState([]);
  const [state, dispatch] = useContext(appContext);

  useEffect(() => {
    const subscribeEvents = () => {
      const profileEvents = subscribe();

      rpc.on("change view", view => {
        dispatch({
          type: VIEW,
          payload: {
            view
          }
        });
      });

      rpc.on("logout", async () => {
        // make sure we disconnect from server as well
        await disconnect();
        // dispatch for the UI
        dispatch({
          type: LOGOUT
        });
      });

      profileEvents.on("message", async data => {
        const evt = JSON.parse(data);

        if (evt.type === "wakeup") {
          profileEvents.send("awake");
        }

        switch (evt.type) {
          case "update":
            dispatch({
              type: SERVICE_SENT_UPDATE,
              payload: {
                ...evt.data
              }
            });
            break;
          case "output":
            dispatch({
              type: SERVICE_LOG,
              payload: {
                log: evt.data.output
              }
            });
            break;
          case "auth_error":
            dispatch({
              type: VPN_ERROR,
              payload: {
                error: AUTH_FAILED
              }
            });
            break;
          case "inactive":
            dispatch({
              type: VPN_ERROR,
              payload: {
                error: DISCONNECT_INACTIVE
              }
            });
            break;
          case "timeout_error":
            dispatch({
              type: VPN_ERROR,
              payload: {
                error: TIMEOUT_CONNECT
              }
            });
            break;
        }
      });
    };

    const checkStatus = async () => {
      const serviceStatus = await ping();
      if (!serviceStatus) {
        errorLog("Service not available (frontend)");
        dispatch({
          type: SERVICE_ERROR,
          payload: {
            error: SERVICE_NOT_AVAILABLE
          }
        });
        return;
      }

      // are we connected or not?
      const vpnStatus = await status();
      if (vpnStatus) {
        info("Current status: Connected");
        dispatch({
          type: CONNECTED
        });
      } else {
        info("Current status: Not Connected");
      }

      try {
        const serversCountryData = await serversCountry();
        setServers(serversCountryData);
        dispatch({
          type: APP_READY
        });
      } catch (error) {
        errorLog(error);
        if (
          error.error &&
          error.error.code &&
          (error.error.code === "ECONNREFUSED" ||
            error.error.code === "ESOCKETTIMEDOUT")
        ) {
          try {
            const serversCountryData = await serversCountry(true);
            setServers(serversCountryData);
            dispatch({
              type: APP_READY
            });
          } catch (error) {
            errorLog(error);
            dispatch({
              type: SERVICE_ERROR,
              payload: {
                error: CANT_FETCH_REMOTE
              }
            });
          }
        }

        if (
          error.error &&
          error.error.code &&
          error.error.code === "ETIMEDOUT"
        ) {
          // probably a dns issue.
          // let's try to disconnect
          setTimeout(async () => {
            try {
              const serversCountryData = await serversCountry();
              setServers(serversCountryData);
              dispatch({
                type: APP_READY
              });
            } catch (error) {
              errorLog(error);
              setTimeout(async () => {
                try {
                  const serversCountryData = await serversCountry();
                  setServers(serversCountryData);
                  dispatch({
                    type: APP_READY
                  });
                } catch (error) {
                  errorLog(error);
                  dispatch({
                    type: SERVICE_ERROR,
                    payload: {
                      error: CANT_FETCH_REMOTE
                    }
                  });
                }
              }, 2000);
            }
          }, 2000);
        }
      }

      subscribeEvents();
    };

    checkStatus();
  }, []);

  let content = <Login />;
  if (state.isReady) {
    switch (state.currentView) {
      case CONNECTED_VIEW:
        content = <Connected />;
        break;
      case CONNECT_VIEW:
        content = <Connect servers={servers} />;
        break;
      case LOGS_VIEW:
        content = <Logs />;
        break;
      case SETTINGS_VIEW:
        content = <Settings />;
        break;
    }
  } else {
    content = <Loading />;
  }

  if (state.serviceError) {
    content = <ServiceNotAvailable />;
  }

  return (
    <>
      <div className="app">
        <Header />
        {content}
      </div>
      <style jsx>{`
        .app {
          overflow: hidden;
          user-select: none;
          font-family: "Inter", sans-serif;
          height: 100%;
        }
      `}</style>
    </>
  );
};
