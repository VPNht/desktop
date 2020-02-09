import request from "request-promise-native";
import countries from "./countries";
import { info } from "./logger";

export const serversCountry = async (fallback = false) => {
  let servers = await request.get({
    json: true,
    uri: fallback
      ? "http://check.myip.ht:8080/servers-geo.json"
      : "https://myip.ht/servers-geo.json",
    timeout: 3000
  });
  info(`Servers list: ${servers.length} servers found.`);
  return servers;
};
