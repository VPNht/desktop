import request from "request-promise-native";

export const downloadConfig = async ({ host }) => {
  const config = await request.get({
    json: true,
    uri: `https://vpn.ht/openvpn-config/${host}/128?disable-smartdns`
  });

  return config;
};
