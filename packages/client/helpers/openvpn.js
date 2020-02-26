import request from "request-promise-native";

export const downloadConfig = async ({ host }) => {
  const config = await request.get({
    json: true,
    uri: `https://config.digital.ht/?host=${host}`
  });

  return config;
};
