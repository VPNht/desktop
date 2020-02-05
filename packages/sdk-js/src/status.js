import EventEmitter from "events";
import WebSocket from "ws/index";
import fs from "fs";
import { unixSocket, unixPath, serviceHost } from "./service";
import authPath from "./auth-path";

const statusEmitter = new EventEmitter();

export default () => {
  let url = "ws://" + serviceHost + "/events";
  const authKey = fs.readFileSync(authPath(), "utf8");
  const headers = {
    "Auth-Key": authKey,
    "User-Agent": "vpnht"
  };
  try {
    if (unixSocket) {
      url = "ws+unix://" + unixPath + ":/events";
      headers["Host"] = "unix";
    }

    const socket = new WebSocket(url, {
      headers: headers
    });

    socket.on("message", data => {
      const evt = JSON.parse(data);
      if (
        evt &&
        evt.type &&
        (evt.type === "connected" || evt.type === "disconnected")
      ) {
        statusEmitter.emit(evt.type);
      }
    });
    socket.on("error", error => {
      statusEmitter.emit("error", error);
    });
  } catch (error) {
    statusEmitter.emit("error", error);
  }
  return statusEmitter;
};
