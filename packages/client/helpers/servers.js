import request from "request-promise-native";
import countries from "./countries";
import { info } from "./logger";

export const serversCountry = async (fallback = false) => {
  let servers = await request.get({
    json: true,
    uri: fallback
      ? "http://check.myip.ht:8080/servers.json"
      : "https://myip.ht/servers.json",
    timeout: 3000
  });
  console.log(servers);
  info(`Servers list: ${Object.keys(servers).length} country`);

  return Object.keys(servers)
    .sort()
    .map(server => {
      let realServer = server;
      if (server === "mx") {
        realServer = "mex";
      }
      if (server === "gb") {
        realServer = "uk";
      }
      return { host: realServer, country: countries[server.toUpperCase()] };
    });
};
