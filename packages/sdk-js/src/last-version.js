import request from "request-promise-native";
import { repository } from "../package.json";
export default async () => {
  try {
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
        return data.tag_name.substr(1);
      }
      return data.tag_name;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};
