import React, { useContext, useEffect, useState } from "react";
import appContext from "../store";
import { disconnect } from "../../helpers/service";
import { getIP } from "../../helpers/myip";
import { SERVICE_ERROR } from "../constants/actions";
import { CANT_FETCH_REMOTE } from "../constants/errors";
import Loading from "./loading";

export default () => {
  const [state, dispatch] = useContext(appContext);
  const [uptime, setUptime] = useState("");
  const [ready, setReady] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [remoteCountry, setRemoteCountry] = useState(false);
  const [remoteCountryName, setRemoteCountryName] = useState("");
  const [remoteRegion, setRemoteRegion] = useState(false);

  useEffect(() => {
    const getRemoteIp = async () => {
      let myIP = null;
      try {
        myIP = await getIP();
      } catch (error) {
        try {
          myIP = await getIP(true);
        } catch (error) {
          dispatch({
            type: SERVICE_ERROR,
            payload: {
              error: CANT_FETCH_REMOTE
            }
          });
        }
      }

      if (myIP) {
        setRemoteCountry(myIP.country);
        setRemoteCountryName(myIP.advanced.countryName);
        setRemoteRegion(myIP.advanced.regionName);

        setReady(true);
      }
    };

    getRemoteIp();
  }, []);

  useEffect(() => {
    const getUptime = () => {
      if (!state.connectTimestamp) {
        return;
      }

      const curTime = Math.floor(new Date().getTime() / 1000);
      let uptime = curTime - state.connectTimestamp;
      let units;
      let unitStr;
      const uptimeItems = [];

      // sometimes we get a -4 ?
      if (uptime < 0) {
        return setUptime("Loading...");
      }

      if (uptime > 86400) {
        units = Math.floor(uptime / 86400);
        uptime -= units * 86400;
        unitStr = units + " day";
        if (units > 1) {
          unitStr += "s";
        }
        uptimeItems.push(unitStr);
      }

      if (uptime > 3600) {
        units = Math.floor(uptime / 3600);
        uptime -= units * 3600;
        unitStr = units + " hour";
        if (units > 1) {
          unitStr += "s";
        }
        uptimeItems.push(unitStr);
      }

      if (uptime > 60) {
        units = Math.floor(uptime / 60);
        uptime -= units * 60;
        unitStr = units + " min";
        if (units > 1) {
          unitStr += "s";
        }
        uptimeItems.push(unitStr);
      }

      if (uptime) {
        unitStr = uptime + " sec";
        if (uptime > 1) {
          unitStr += "s";
        }
        uptimeItems.push(unitStr);
      }

      setUptime(uptimeItems.join(" "));
    };

    // calc uptime right now
    getUptime();

    // do it every second
    const timer = setTimeout(() => {
      getUptime();
    }, 1000);

    // make sure to delete the timer when view is unmounted
    return () => {
      clearTimeout(timer);
    };
  });

  if (!ready) {
    return <Loading />;
  }

  return (
    <>
      <div>
        <div className="statusHeader">
          <div className="left">
            <div className="flag">
              <img src={`./static/flags/${remoteCountry}_64.png`} />
            </div>
            <div className="details">
              <div className="countryName">{remoteCountryName}</div>
              <div className="regionName">{remoteRegion}</div>
            </div>
          </div>
          <div className="right">
            <div className="connected">
              Connected <span className="dot"></span>
            </div>
            <div className="ip">{state.serverAddr}</div>
          </div>
        </div>

        <div className="statusContainer">
          <div>Connection time</div> <div>{uptime}</div>
        </div>

        <div className="statusContainer">
          <div>Local IP</div> <div>{state.clientAddr}</div>
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
            {disconnecting ? "Please wait..." : "Disconnect"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .statusContainer {
          background-color: rgb(0, 119, 117, 60);
          margin-bottom: 2px;
          display: flex;
          justify-content: space-between;
          padding-top: 10px;
          padding-bottom: 10px;
          padding-left: 30px;
          padding-right: 30px;
          font-size: 20px;
        }

        .buttonContainer {
          margin-top: 30px;
          width: 100%;
          padding: 30px;
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

        .statusHeader {
          padding: 30px;
          display: flex;
          justify-content: space-between;
        }

        .statusHeader .left {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .statusHeader .left .flag {
          margin-right: 10px;
        }

        .statusHeader .right {
          text-align: right;
        }

        .countryName {
          font-weight: bold;
        }

        .regionName {
          color: #007775;
        }

        .connected {
          color: #94e79c;
        }

        .connected .dot {
          height: 13px;
          width: 13px;
          background-color: #94e79c;
          border-radius: 50%;
          display: inline-block;
        }
        .ip {
          font-size: 18px;
          letter-spacing: 2px;
          color: #007775;
          font-weight: bold;
        }
      `}</style>
    </>
  );
};
