import React, { useContext, useRef, useState } from "react";
import Highlight from "react-highlight.js";
import { disconnect } from "../../helpers/service";

import appContext from "../store";

export default () => {
  const [state] = useContext(appContext);
  const [disconnecting, setDisconnecting] = useState(false);
  const logViewerElem = useRef();

  if (logViewerElem.current) {
    logViewerElem.current.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <div className="container">
        <div className="logViewer">
          <Highlight language="accesslog">{state.logs}</Highlight>
          <div className="scrollToBottom" ref={logViewerElem} />
        </div>
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
            {disconnecting ? "Please wait..." : "Cancel"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .container {
          margin-top: 10px;
          width: 100%;
          padding: 30px;
        }

        .logViewer {
          user-select: text;
          background-color: #007775;
          border-radius: 5px;
          font-size: 8px;
          height: 175px;
          overflow-y: auto;
        }

        .scrollToBottom {
          margin-bottom: 20px;
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
};
