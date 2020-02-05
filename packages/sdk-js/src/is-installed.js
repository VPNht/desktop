import fs from "fs";
import authPath from "./auth-path";

export default () => {
  try {
    return fs.existsSync(authPath());
  } catch (error) {
    console.log(error);
    return false;
  }
};
