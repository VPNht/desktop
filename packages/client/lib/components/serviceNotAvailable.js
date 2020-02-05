import React, { useContext, useState } from "react";
import appContext from "../store";
import { CANT_FETCH_REMOTE } from "../constants/errors";
import { disconnect } from "../../helpers/service";

export default () => {
  const [state] = useContext(appContext);
  const [disconnecting, setDisconnecting] = useState(false);

  if (state.isConnected && state.serviceError === CANT_FETCH_REMOTE) {
    return (
      <>
        <div className="container">
          Something went wrong try to disconnect and try again. If problem
          persist, please contact us for advanced debugging.
          <div className="buttonContainer">
            <button
              type="button"
              disabled={disconnecting}
              className="button"
              onClick={async () => {
                setDisconnecting(true);
                await disconnect();
              }}
            >
              {disconnecting ? "Please wait..." : "Disconnect"}
            </button>
          </div>
        </div>
        <style jsx>{`
          .container {
            margin-top: 10px;
            width: 100%;
            padding: 30px;
          }

          .buttonContainer {
            margin-top: 20px;
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
        `}</style>
      </>
    );
  }

  return (
    <>
      <div>
        {state.serviceError} service not available try to restart your computer
      </div>
      <style jsx>{``}</style>
    </>
  );
};
