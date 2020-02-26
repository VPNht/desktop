import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUnlock, faLock } from "@fortawesome/free-solid-svg-icons";

import Spinner from "../components/spinner";
import SettingsButton from "../components/buttons/settings";
import ToggleListButton from "../components/buttons/toggleList";
import QuickConnectButton from "../components/buttons/quickConnect";
import SigninSignupButtons from "../components/buttons/signinSignup";
import PickPlanButton from "../components/buttons/pickPlan";
import BackButton from "../components/buttons/backHome";

import appContext from "../store";

export default () => {
  const [state] = useContext(appContext);
  const isMac = /Mac/.test(navigator.userAgent);

  let helpTitle = "Sign up or log in to continue";

  if (state.isLogged && state.serviceDetails) {
    helpTitle = "Select a country or click quick connect";
  }

  if (state.isLogged && !state.serviceDetails) {
    helpTitle = "You don't have an active subscription";
  }

  if (state.isConnecting) {
    helpTitle = (
      <div className="flex items-center">
        <Spinner className="spinnerContainer mr-2 w-4 text-gray-500" />
        Connecting to{" "}
        {state.currentServer && state.currentServer.host
          ? state.currentServer.host
          : "hub"}
        .vpn.ht
      </div>
    );
  }

  if (state.isConnected) {
    helpTitle = `Connected to ${
      state.currentServer && state.currentServer.host
        ? state.currentServer.host
        : "hub"
    }.vpn.ht`;
  }

  return (
    <>
      <div
        className={`titlebar flex draggable pb-1 text-center text-gray-500 ${
          isMac ? "pt-8" : "pt-1 leading-snug"
        } items-end`}
      >
        <div className="w-1/4 text-left ml-2">
          {state.currentView === "CONNECT" ? (
            <>
              <SettingsButton />
              <ToggleListButton />
            </>
          ) : (
            <BackButton />
          )}
        </div>
        <div className="w-2/4">
          <div className="inline-flex w-full">
            {state.isConnected ? (
              <div className="bg-gray-300 border-gray-800 text-green-500 py-1 px-2 rounded-l-md focus:outline-none text-xs w-1/3 font-semibold">
                <FontAwesomeIcon
                  className="mr-2"
                  icon={faLock}
                  color="#718096"
                  color=""
                />
                CONNECTED
              </div>
            ) : (
              <div className="bg-gray-300 border-gray-800 text-red-500 py-1 px-2 rounded-l-md focus:outline-none text-xs w-1/3 font-semibold">
                <FontAwesomeIcon
                  className="mr-2"
                  icon={faUnlock}
                  color="#718096"
                />
                DISCONNECTED
              </div>
            )}

            <div className="bg-gray-300 border-gray-800 text-gray-700 py-1 px-2 rounded-r-md focus:outline-none text-xs w-2/3">
              {helpTitle}
            </div>
          </div>
        </div>
        <div className="w-1/4 text-right mr-2">
          {state.isLogged &&
            state.serviceDetails &&
            state.currentView === "CONNECT" && <QuickConnectButton />}
          {state.isLogged && !state.serviceDetails && <PickPlanButton />}
          {!state.isLogged && <SigninSignupButtons />}
        </div>
      </div>
      <style jsx>{`
        .titlebar {
          background: linear-gradient(#d0dbe7, #b6c2cf);
        }
      `}</style>
    </>
  );
};
