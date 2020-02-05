import request from "request-promise-native";
import isDev from "electron-is-dev";
import { repository } from "../helpers/utils";
import { info, error } from "../helpers/logger";

export const lastRelease = async () => {
  try {
    if (isDev) {
      info("Skipping updates (dev)");
      return null;
    }

    const data = await request.get({
      json: true,
      uri: `https://api.github.com/repos/${repository}/releases/latest`,
      timeout: 3000,
      headers: {
        "User-Agent": "vpnht",
        "Content-Type": "application/json;charset=UTF-8",
        Accept: "application/vnd.github+json"
      }
    });

    if (data && data.tag_name) {
      if (data.tag_name.charAt(0) === "v") {
        const tag = data.tag_name.substr(1);
        info(`Tag found: ${tag}`);
        return tag;
      }
      return data.tag_name;
    }
  } catch (err) {
    error(err);
  }
  return null;
};
