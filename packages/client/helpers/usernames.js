import request from "request-promise-native";

export const checkUsername = async username => {
  const check = await request.get({
    json: true,
    uri: `https://api.vpn.ht/user?username=${username}`
  });

  return check;
};
