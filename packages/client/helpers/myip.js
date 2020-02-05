import request from "request-promise-native";

export const getIP = async (fallback = false) => {
  const data = await request.get({
    json: true,
    uri: fallback
      ? "http://check.myip.ht:8080/status"
      : "https://myip.ht/status",
    timeout: 3000
  });

  return data;
};
