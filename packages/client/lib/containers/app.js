import React, { useEffect, useContext } from "react";
import { useMutation } from "@shopify/react-graphql";
import gql from "graphql-tag";

import Header from "./header";
import { ping, status, disconnect } from "../../helpers/service";
import { getAllServers } from "../../helpers/service";
import { subscribe } from "../../helpers/events";
import { info, error as errorLog } from "../../helpers/logger";
import ElectronStore from "../store/persist";

import rpc from "../rpc";

import appContext from "../store";
import {
  APP_READY,
  SERVICE_ERROR,
  CONNECTED,
  SERVICE_SENT_UPDATE,
  UPDATE_SERVERS_LIST,
  SERVICE_LOG,
  VPN_ERROR,
  VIEW,
  LOGOUT,
  LOGIN
} from "../constants/actions";

import {
  LOGS as LOGS_VIEW,
  SETTINGS as SETTINGS_VIEW
} from "../constants/view";

import {
  SERVICE_NOT_AVAILABLE,
  AUTH_FAILED,
  DISCONNECT_INACTIVE,
  TIMEOUT_CONNECT
} from "../constants/errors";

import ServiceNotAvailable from "../components/serviceNotAvailable";
import Loading from "../components/loading";
import Connect from "../components/connect";
import Settings from "../components/settings";
import Logs from "../components/logs";
import AppModal from "../components/modal";

const serviceGql = gql`
  mutation ServiceMutation {
    service {
      id
      username
      password
    }
  }
`;

export default () => {
  const [state, dispatch] = useContext(appContext);
  const getServiceDetails = useMutation(serviceGql);
  const isMac = /Mac/.test(navigator.userAgent);

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
        try {
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
            case "servers_list":
              {
                const allServers = await getAllServers();
                if (allServers && allServers.length > 0) {
                  dispatch({
                    type: UPDATE_SERVERS_LIST,
                    payload: { servers: allServers }
                  });
                }
              }

              break;
          }
        } catch (error) {
          errorLog(error);
        }
      });
    };

    const checkStatus = async () => {
      try {
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

        const allServers = await getAllServers();
        dispatch({
          type: APP_READY,
          payload: { servers: allServers }
        });

        // are we connected or not?
        const vpnStatus = await status();
        if (vpnStatus) {
          info("Current status: Connected");
          // last server
          const lastServer = ElectronStore.get("lastServer");
          dispatch({
            type: CONNECTED,
            payload: {
              server: allServers.find(server => server.host === lastServer)
            }
          });
        } else {
          info("Current status: Not Connected");
        }

        subscribeEvents();
      } catch (error) {
        errorLog(error);
      }
    };

    // auto login
    const autoLogin = async () => {
      try {
        // skip auto login if not token found
        const apiToken = ElectronStore.get("apiToken");
        if (!apiToken) {
          return;
        }

        const serviceDetails = await getServiceDetails();
        if (
          serviceDetails &&
          serviceDetails.data &&
          serviceDetails.data.service
        ) {
          dispatch({
            type: LOGIN,
            payload: {
              service: serviceDetails.data.service
            }
          });
        } else {
          dispatch({
            type: LOGIN,
            payload: {
              service: null
            }
          });
        }
      } catch (error) {
        errorLog(error);
      }
    };

    checkStatus();
    autoLogin();
  }, []);

  let content = <Connect />;
  if (state.isReady) {
    switch (state.currentView) {
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
      <div className="vpnht w-full h-screen">
        <Header />
        <div className="flex-1 h-content">{content}</div>
        <AppModal />
      </div>
      <style jsx>{`
        .vpnht {
          user-select: none;
        }

        .h-content {
          height: calc(100vh - ${isMac ? "63px" : "33px"});
        }
      `}</style>
    </>
  );
};
