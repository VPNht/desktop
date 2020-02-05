import { spawn } from "child_process";
import appPath from "./app-path";
export default () => {
  if (process.platform === "win32") {
    const appProcess = spawn("start", [appPath()], {
      detached: true,
      stdio: "ignore"
    });
    appProcess.unref();
  } else {
    const appProcess = spawn(appPath(), {
      detached: true,
      stdio: "ignore"
    });
    appProcess.unref();
  }
};
