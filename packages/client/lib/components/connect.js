import React, { useContext, useEffect, useState } from "react";
import FormState from "@shopify/react-form-state";

import Loading from "./loading";
import Connecting from "./connecting";
import ElectronStore from "../store/persist";
import appContext from "../store";

import { connect } from "../../helpers/service";
import { downloadConfig } from "../../helpers/openvpn";
import { updateProfile } from "../../helpers/profile";

import {
  CONNECTING,
  CURRENT_ACTION,
  VPN_ERROR,
  VIEW
} from "../constants/actions";
import { CONNECTED as CONNECTED_VIEW } from "../constants/view";

import {
  DOWNLOAD_CONFIG,
  UPDATE_PROFILE,
  LAUNCH_OPENVPN
} from "../constants/vpn";
import { EMPTY_USER_PASS } from "../constants/errors";

export default ({ servers }) => {
  const [state, dispatch] = useContext(appContext);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (state.isConnected) {
      dispatch({
        type: VIEW,
        payload: {
          view: CONNECTED_VIEW
        }
      });
    } else {
      setIsReady(true);
    }
  }, []);

  const authConfig = ElectronStore.get("authConfig") || null;

  let username = "";
  let password = "";

  const savePassword = ElectronStore.get("savePassword") || false;

  if (!isReady) {
    return <Loading />;
  }

  if (authConfig && savePassword) {
    [username, password] = new Buffer(authConfig, "base64")
      .toString()
      .split(/:(.+)?/)
      .slice(0, 2);
  }

  return (
    <>
      <FormState
        initialValues={{
          selectedServer: ElectronStore.get("lastServer") || "us"
        }}
        onSubmit={async ({ fields }) => {
          dispatch({
            type: CONNECTING
          });

          dispatch({
            type: CURRENT_ACTION,
            payload: {
              action: DOWNLOAD_CONFIG
            }
          });

          ElectronStore.set("lastServer", fields.selectedServer.value);

          // DOWNLOAD REMOTE CONFIG
          const config = await downloadConfig({
            host: fields.selectedServer.value
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
        }}
      >
        {({ fields, submit, submitting }) => {
          const { selectedServer } = fields;

          return (
            <form onSubmit={submit}>
              {state.isConnecting ? (
                <Connecting />
              ) : (
                <>
                  <div className="formContainer">
                    <div className="bannerContainer">
                      {state.vpnError && (
                        <div className="banner">{state.vpnError}</div>
                      )}
                    </div>
                    <select
                      className="select"
                      id={selectedServer.name}
                      key={selectedServer.name}
                      onChange={({ currentTarget }) => {
                        selectedServer.onChange(currentTarget.value);
                      }}
                      value={selectedServer.value}
                    >
                      {servers.map(server => {
                        return (
                          <option key={server.host} value={server.host}>
                            {server.country}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      className="button"
                      type="submit"
                      disabled={submitting}
                    >
                      Connect
                    </button>
                  </div>
                </>
              )}
            </form>
          );
        }}
      </FormState>
      <style jsx>{`
        .formContainer {
          margin-top: 10px;
          width: 100%;
          padding: 30px;
        }

        .input {
          margin-bottom: 10px;
          display: block;
          width: 100%;
          height: 34px;
          padding: 20px 12px;
          font-size: 16px;
          font-size: bold;
          color: #fff;
          background-color: #007775;
          background-image: none;
          border: none;
          border-radius: 4px;
        }

        .input:focus {
          outline: none;
        }

        .input::placeholder {
          color: rgb(255, 255, 255, 0.2);
        }

        .select {
          margin-bottom: 10px;
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: #444;
          line-height: 1.3;
          padding: 0.6em 1.4em 0.5em 0.8em;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          border: 1px solid #aaa;
          box-shadow: 0 1px 0 1px rgba(0, 0, 0, 0.04);
          border-radius: 0.5em;
          -moz-appearance: none;
          -webkit-appearance: none;
          appearance: none;
          background-color: #fff;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007775%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"),
            linear-gradient(to bottom, #ffffff 0%, #e5e5e5 100%);
          background-repeat: no-repeat, repeat;
          background-position: right 0.7em top 50%, 0 0;
          background-size: 0.65em auto, 100%;
        }
        .select::-ms-expand {
          display: none;
        }
        .select:hover {
          border-color: #888;
        }
        .select:focus {
          border-color: #aaa;
          box-shadow: 0 0 1px 3px rgba(59, 153, 252, 0.7);
          box-shadow: 0 0 0 3px -moz-mac-focusring;
          color: #222;
          outline: none;
        }
        .select option {
          font-weight: normal;
        }

        .button {
          width: 100%;
          background: #fff;
          border: none;
          font-weight: bold;
          font-size: 25px;
          padding: 20px;
          border-radius: 5px;
          color: #007775;
          cursor: pointer;
        }

        .button:hover {
          color: #000;
        }

        .button:focus {
          outline: none;
        }

        .banner {
          margin: 10px 0;
          padding: 5px;
          border-radius: 5px;
          background: #fff8e1;
          color: #007775;
        }

        .checkboxIcon {
          stroke: #007775;
          fill: #007775;
        }

        .pretty {
          font-size: 17px;
        }

        .pretty .state label:before {
          border-color: red;
          border: 2px solid #007775;
          border-radius: 5px;
        }

        .state label {
          color: #007775;
        }
        .savePassword {
          margin-bottom: 30px;
        }
      `}</style>
    </>
  );
};
