import WebSocket from "ws/index";
import { authKey, unixSocket, unixPath, serviceHost } from "./service";

export const subscribe = () => {
  let reconnected = false;
  let url;
  const headers = {
    "Auth-Key": authKey,
    "User-Agent": "vpnht"
  };

  if (unixSocket) {
    url = "ws+unix://" + unixPath + ":/events";
    headers["Host"] = "unix";
  } else {
    url = "ws://" + serviceHost + "/events";
  }

  const socket = new WebSocket(url, {
    headers: headers
  });

  return socket;
};
