import React, { useContext, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt } from "@fortawesome/free-solid-svg-icons";

import appContext from "../../store";
import { disconnect, connect } from "../../../helpers/service";
import { downloadConfig } from "../../../helpers/openvpn";

import { CONNECTING } from "../../constants/actions";

export default () => {
  const [state, dispatch] = useContext(appContext);
  const [loading, setLoading] = useState(false);

  let buttonTitle = "Quick connect";

  if (state.isConnected) {
    buttonTitle = "Disconnect";
  }

  if (state.isConnecting) {
    buttonTitle = "Cancel";
  }

  return (
    <>
      <button
        disabled={loading}
        className="bg-special-green border-gray-800 text-gray-800 font-bold py-1 px-2 rounded-md focus:outline-none text-xs"
        onClick={async () => {
          setLoading(true);

          if (state.isConnected || state.isConnecting) {
            await disconnect();
            setLoading(false);
            return;
          }

          const closestServer = state.servers.reduce((prev, curr) => {
            return prev.distance < curr.distance ? prev : curr;
          });

          dispatch({
            type: CONNECTING,
            payload: {
              server: state.servers.find(
                server => server.host === closestServer.host
              )
            }
          });

          const config = await downloadConfig({
            host: closestServer.host
          });

          await connect({
            username: state.serviceDetails.username,
            password: state.serviceDetails.password,
            data: config
          });

          setLoading(false);
        }}
      >
        {loading ? (
          <FontAwesomeIcon spin className="w-4 text-white" icon={faSyncAlt} />
        ) : (
          buttonTitle
        )}
      </button>
      <style jsx>
        {`
          .bg-special-green {
            background-color: #00a6a3;
            color: #fff;
          }
        `}
      </style>
    </>
  );
};
