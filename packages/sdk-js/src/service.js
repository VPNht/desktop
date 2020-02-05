import fs from "fs";
import request from "request-promise-native";
import authPath from "./auth-path";

export const unixSocket =
  process.platform === "linux" || process.platform === "darwin";
export const serviceHost = "127.0.0.1:9770";
export const unixPath = "/var/run/vpnht.sock";

export default async ({ method, path, body }) => {
  const authKey = fs.readFileSync(authPath(), "utf8");
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
