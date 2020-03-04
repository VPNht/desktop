import request from "request-promise-native";
import ElectronStore from "../lib/store/persist";

export const downloadConfig = async ({ host }) => {
  let configURL = `https://config.digital.ht/?host=${host}`;

  // read settings and generate config
  const vpnProtocol = ElectronStore.get("vpnProtocol");
  const encryption = ElectronStore.get("encryption");

  const bypassFirewall =
    ElectronStore.get("bypassFirewall") !== null
      ? ElectronStore.get("bypassFirewall")
      : false;

  const disableSmartDNS =
    ElectronStore.get("disableSmartDNS") !== null
      ? ElectronStore.get("disableSmartDNS")
      : false;

  const customDnsEnabled =
    ElectronStore.get("customDnsEnabled") !== null
      ? ElectronStore.get("customDnsEnabled")
      : false;

  const customDns1 = ElectronStore.get("customDns1");
  const customDns2 = ElectronStore.get("customDns2");

  if (bypassFirewall) {
    configURL = `${configURL}&port=443`;
  } else {
    if (vpnProtocol) {
      configURL = `${configURL}&protocol=${vpnProtocol}`;
    }
    if (encryption) {
      configURL = `${configURL}&enc=${encryption}`;
    }
  }

  if (disableSmartDNS) {
    configURL = `${configURL}&smartdns=false`;
  }

  let config = await request.get({
    json: true,
    uri: configURL
  });

  // dns enable and have at least 1 dns server...
  if (customDnsEnabled && (customDns1 || customDns2)) {
    config += "\nroute-nopull";
    config += "\nredirect-gateway def1";
    if (customDns1) {
      config += `\ndhcp-option DNS ${customDns1}`;
    }
    if (customDns2) {
      config += `\ndhcp-option DNS ${customDns2}`;
    }
  }

  return config;
};
