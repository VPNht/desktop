import fs from "fs";
import request from "request-promise-native";
import { authPath } from "./path";
import { info } from "./logger";

export const unixSocket =
  process.platform === "linux" || process.platform === "darwin";
export const serviceHost = "127.0.0.1:9770";
export const unixPath = "/var/run/vpnht.sock";
export const authKey = fs.readFileSync(authPath(), "utf8");

export const callService = async ({ method, path, body }) => {
  let url;
  let headers = {
    "Auth-Key": authKey,
    "User-Agent": "vpnht"
  };

  if (unixSocket) {
    url = `http://unix:${unixPath}:${path}`;
    headers["Host"] = "unix";
  } else {
    url = `http://${serviceHost}${path}`;
  }

  try {
    let result;
    switch (method) {
      case "GET":
        result = await request.get({
          url: url,
          headers: headers
        });

        return { result, error: false };

      case "POST":
        result = await request.post({
          url: url,
          json: true,
          headers: headers,
          body
        });

        return { result, error: false };

      case "DEL":
        result = await request.del({
          url: url,
          json: true,
          headers: headers,
          body
        });

        return { result, error: false };

      default:
        return { result: false, error: "NOT_AVAILABLE" };
    }
  } catch (error) {
    return { result: false, error };
  }
};

export const ping = async () => {
  const { error } = await callService({ method: "GET", path: "/ping" });
  if (error) {
    return false;
  }
  return true;
};

export const getAllServers = async () => {
  const { error, result } = await callService({
    method: "GET",
    path: "/servers"
  });

  if (error) {
    return false;
  }
  const servers = JSON.parse(result);
  const serversList = Object.keys(servers).map(server => servers[server]);

  info(`Servers list: ${serversList.length} servers found.`);

  return serversList.sort((a, b) => {
    if (a.avgPing < b.avgPing) {
      return -1;
    }
    if (a.avgPing > b.avgPing) {
      return 1;
    }
    return 0;
  });
};

export const wakeup = async () => {
  const { error } = await callService({ method: "POST", path: "/wakeup" });
  if (error) {
    if (error.statusCode) {
      return { statusCode: error.statusCode, wakeup: false };
    }
    return { statusCode: null, wakeup: false };
  }
  return { statusCode: 200, wakeup: true };
};

export const status = async () => {
  const { error, result } = await callService({
    method: "GET",
    path: "/status"
  });
  if (error) {
    return false;
  }
  const serviceStatus = JSON.parse(result);
  return serviceStatus.status;
};

export const getProfile = async () => {
  const { error, result } = await callService({
    method: "GET",
    path: "/profile"
  });

  if (error) {
    return false;
  }
  const profiles = JSON.parse(result);
  return profiles;
};

export const connect = async ({ username, password, data }) => {
  const { error, result } = await callService({
    method: "POST",
    path: "/profile",
    body: {
      id: "default",
      username,
      password,
      reconnect: false,
      timeout: true,
      data
    }
  });

  if (error) {
    return false;
  }
  const profiles = JSON.parse(result);
  return profiles;
};

export const disconnect = async () => {
  const { error } = await callService({
    method: "DEL",
    path: "/profile",
    body: {
      id: "default"
    }
  });

  if (error) {
    return false;
  }

  return true;
};
