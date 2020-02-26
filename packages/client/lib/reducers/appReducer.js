import ElectronStore from "../store/persist";
import rpc from "../rpc";

import { LOADING, CONNECT as CONNECT_VIEW } from "../constants/view";

import {
  APP_READY,
  CONNECTED,
  CONNECTING,
  DISCONNECTED,
  VIEW,
  CURRENT_ACTION,
  VPN_ERROR,
  SERVICE_LOG,
  SERVICE_ERROR,
  SERVICE_SENT_UPDATE,
  LOGIN,
  LOGOUT,
  SHOW_MODAL,
  CLOSE_MODAL,
  TOGGLE_SIDEBAR,
  UPDATE_SERVERS_LIST
} from "../constants/actions";

export const initialAppState = {
  isReady: false,
  isLogged: false,
  isConnected: false,
  isConnecting: false,
  servers: [],
  currentAction: "",
  currentView: LOADING,
  currentServer: null,
  connectTimestamp: ElectronStore.get("connectTimestamp"),
  serverAddr: ElectronStore.get("serverAddr"),
  clientAddr: ElectronStore.get("clientAddr"),
  vpnError: null,
  serviceError: null,
  serviceDetails: null,
  logs: "",
  showModal: false,
  currentModalView: null,
  showSidebar: true
};

export const appReducer = (state, action) => {
  switch (action.type) {
    case APP_READY:
      return {
        ...state,
        currentView: CONNECT_VIEW,
        servers: action.payload.servers,
        isReady: true
      };

    case LOGIN: {
      rpc.emit("set status login");
      return {
        ...state,
        currentView: CONNECT_VIEW,
        serviceDetails: action.payload.service,
        showModal: false,
        currentModalView: null,
        isLogged: true
      };
    }

    case LOGOUT: {
      rpc.emit("set status logout");
      ElectronStore.set("apiToken", null);
      return {
        ...state,
        currentView: CONNECT_VIEW,
        serviceDetails: null,
        showModal: true,
        currentModalView: "login",
        isLogged: false
      };
    }

    case CONNECTED:
      return {
        ...state,
        isConnected: true,
        currentServer: action.payload.server
          ? action.payload.server
          : state.currentServer,
        isConnecting: false
      };

    case CONNECTING:
      return {
        ...state,
        logs: "",
        currentServer: action.payload.server,
        vpnError: null,
        isConnecting: true
      };

    case DISCONNECTED:
      return {
        ...state,
        currentServer: null,
        isConnected: false
      };

    case VIEW:
      return {
        ...state,
        currentView: action.payload.view
      };

    case TOGGLE_SIDEBAR:
      return {
        ...state,
        showSidebar: !state.showSidebar
      };

    case UPDATE_SERVERS_LIST:
      return {
        ...state,
        servers: action.payload.servers
      };

    case SHOW_MODAL:
      return {
        ...state,
        showModal: true,
        currentModalView: action.payload.defaultView
          ? action.payload.defaultView
          : "login"
      };

    case CLOSE_MODAL:
      return {
        ...state,
        showModal: false,
        currentModalView: null
      };

    case SERVICE_LOG: {
      return {
        ...state,
        logs: `${state.logs}\n${action.payload.log}`
      };
    }

    case CURRENT_ACTION:
      return {
        ...state,
        currentAction: action.payload.action
      };

    case VPN_ERROR: {
      return {
        ...state,
        currentAction: "",
        currentView: CONNECT_VIEW,
        vpnError: action.payload.error,
        isConnecting: false
      };
    }

    case SERVICE_ERROR:
      return {
        ...state,
        serviceError: action.payload.error
      };

    case SERVICE_SENT_UPDATE: {
      if (
        action.payload.status === "connecting" ||
        action.payload.status === "reconnecting"
      ) {
        return {
          ...state,
          isConnected: false,
          isConnecting: true
        };
      }
      if (action.payload.status === "connected") {
        rpc.emit("show notification", "Your connection is now secured.");
        ElectronStore.set({
          clientAddr: action.payload.client_addr,
          serverAddr: action.payload.server_addr,
          connectTimestamp: action.payload.timestamp
        });

        return {
          ...state,
          isConnected: true,
          serverAddr: action.payload.server_addr,
          clientAddr: action.payload.client_addr,
          connectTimestamp: action.payload.timestamp,
          isConnecting: false
        };
      }

      if (action.payload.status === "disconnected") {
        rpc.emit(
          "show notification",
          "You have been disconnected from the VPN."
        );
        return {
          ...state,
          connectTimestamp: null,
          isConnected: false,
          isConnecting: false,
          serviceError: false
        };
      }

      return {
        ...state
      };
    }

    default:
      return state;
  }
};
