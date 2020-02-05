import React, { useEffect, useState, useRef } from "react";
import Highlight from "react-highlight.js";
import Loading from "./loading";
import {
  readSystemLog,
  readServiceLog,
  readProfileLog,
  flushAllLogs
} from "../../helpers/logger";
import { setTimeout } from "timers";

const formatNumber = number => {
  return `0${number}`.slice(-2);
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

export default () => {
  const [isReady, setReady] = useState(false);
  const [isUpdating, setUpdate] = useState(false);
  const [systemLogs, showSystemLogs] = useState(true);
  const [serviceLogs, showServiceLogs] = useState(false);
  const [profileLogs, showProfileLogs] = useState(true);
  const [allLogs, setLogs] = useState([]);
  const logViewerElem = useRef();

  const refreshLogs = () => {
    const systemLog = systemLogs ? readSystemLog() : [];
    const serviceLog = serviceLogs ? readServiceLog() : [];
    const profileLog = profileLogs ? readProfileLog() : [];

    console.log(profileLog);

    const allLogs = [...systemLog, ...serviceLog, ...profileLog].sort(
      (a, b) => a.date - b.date
    );

    setReady(true);
    setLogs(allLogs);
    setTimeout(() => {
      setUpdate(false);
      if (logViewerElem.current) {
        console.log("scroll");
        logViewerElem.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 500);
  };

  useEffect(() => {
    setUpdate(true);
    refreshLogs();
  }, [profileLogs, systemLogs, serviceLogs]);

  if (!isReady) {
    return <Loading />;
  }

  return (
    <div>
      <div className="container">
        <div className="header box">
          <div className="logFilter">
            <div>
              <input
                id="appLogs"
                type="checkbox"
                defaultChecked={systemLogs}
                onChange={() => {
                  setUpdate(true);
                  showSystemLogs(!systemLogs);
                  refreshLogs();
                }}
              />
              <label htmlFor="appLogs">App logs</label>
            </div>
            <div>
              <input
                id="vpnLogs"
                type="checkbox"
                defaultChecked={profileLogs}
                onChange={() => {
                  showProfileLogs(!profileLogs);
                }}
              />
              <label htmlFor="vpnLogs">VPN logs</label>
            </div>
            <div>
              <input
                id="serviceLogs"
                type="checkbox"
                defaultChecked={serviceLogs}
                onChange={() => {
                  setUpdate(true);
                  showServiceLogs(!serviceLogs);
                  refreshLogs();
                }}
              />
              <label htmlFor="serviceLogs">Service logs</label>
            </div>
          </div>

          <div className="push">
            <button
              onClick={() => {
                setUpdate(true);
                flushAllLogs();
                refreshLogs();
              }}
            >
              Delete system logs
            </button>
          </div>
        </div>
        <div className="logViewer">
          {isUpdating ? (
            "Loading"
          ) : (
            <Highlight language="accesslog">
              {allLogs.map(log => {
                const day = formatNumber(log.date.getDate());
                const monthIndex = log.date.getMonth();
                const year = log.date.getFullYear();

                return `[${day}/${
                  monthNames[monthIndex]
                }/${year}:${formatNumber(log.date.getHours())}:${formatNumber(
                  log.date.getMinutes()
                )}:${formatNumber(log.date.getSeconds())}] ${log.data}\n`;
              })}
            </Highlight>
          )}
          <div className="scrollToBottom" ref={logViewerElem} />
        </div>
      </div>
      <style jsx>{`
        .container {
          width: 100%;
          padding: 30px;
        }

        .logViewer {
          user-select: text;
          background-color: #007775;
          border-radius: 5px;
          font-size: 10px;
          height: 270px;
          overflow-y: auto;
        }

        .logFilter {
          margin-top: 5px;
          display: flex;
          align-items: flex-start;
        }

        .logFilter div {
          margin-right: 10px;
          font-size: 10px;
        }

        .logFilter div label {
          padding-left: 3px;
        }

        .header {
          display: flex;
          margin-bottom: 10px;
        }

        .push {
          margin-left: auto;
        }

        .header button {
          background: #fff;
          border: none;
          font-weight: bold;
          padding: 3px;
          border-radius: 5px;
          color: #007775;
          cursor: pointer;
        }

        .header button:hover {
          color: #000;
        }

        .header button:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};
