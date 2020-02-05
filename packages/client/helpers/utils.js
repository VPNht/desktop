export const uuid = () => {
  let id = "";

  for (var i = 0; i < 8; i++) {
    id += Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return id;
};

export { version } from "../package.json";
export { repository } from "../package.json";
