import { spawn } from "child_process";
import appPath from "./app-path";
export default () => {
  const appProcess = spawn(appPath(), {
    detached: true,
    stdio: "ignore"
  });
  appProcess.unref();
};
