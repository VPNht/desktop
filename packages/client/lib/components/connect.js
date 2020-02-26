import React, { useContext } from "react";

import Loading from "./loading";
import ElectronStore from "../store/persist";
import appContext from "../store";

import Sidebar from "./sidebar";
import Map from "./map";

import { connect, disconnect } from "../../helpers/service";
import { downloadConfig } from "../../helpers/openvpn";
import { updateProfile } from "../../helpers/profile";

import {
  DISCONNECTED,
  CONNECTING,
  CURRENT_ACTION,
  SHOW_MODAL
} from "../constants/actions";

import {
  DOWNLOAD_CONFIG,
  UPDATE_PROFILE,
  LAUNCH_OPENVPN
} from "../constants/vpn";

export default () => {
  const [state, dispatch] = useContext(appContext);

  const connectServer = async ip => {
    if (state.isConnected) {
      await disconnect();
      // prevent currentServer to fail
      dispatch({
        type: DISCONNECTED
      });
    }

    // is loggued?
    if (!state.isLogged) {
      dispatch({
        type: SHOW_MODAL,
        payload: {
          defaultView: "login"
        }
      });
      return;
    }

    // no active service
    if (!state.serviceDetails) {
      dispatch({
        type: SHOW_MODAL,
        payload: {
          defaultView: "pickPlan"
        }
      });
      return;
    }

    dispatch({
      type: CONNECTING,
      payload: {
        server: state.servers.find(server => server.ip === ip)
      }
    });

    dispatch({
      type: CURRENT_ACTION,
      payload: {
        action: DOWNLOAD_CONFIG
      }
    });

    ElectronStore.set("lastServer", ip);

    // DOWNLOAD REMOTE CONFIG
    const config = await downloadConfig({
      host: ip
    });

    dispatch({
      type: CURRENT_ACTION,
      payload: {
        action: UPDATE_PROFILE
      }
    });

    await updateProfile(config);

    dispatch({
      type: CURRENT_ACTION,
      payload: {
        action: LAUNCH_OPENVPN
      }
    });

    await connect({
      username: state.serviceDetails.username,
      password: state.serviceDetails.password,
      data: config
    });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className={state.showSidebar ? "w-1/4" : "hidden"}>
        <Sidebar connectServer={connectServer} />
      </div>
      <div className={state.showSidebar ? "w-3/4" : "w-full"}>
        <Map connectServer={connectServer} />
      </div>
    </div>
  );
};
