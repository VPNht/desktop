import { join, resolve } from "path";
import isDev from "electron-is-dev";
import { app } from "electron";

const defaultPath = resolve(isDev ? "target" : app.getAppPath());

export default {
  default: join(defaultPath, "static", "tray.png"),
  connecting: join(defaultPath, "static", "tray_connecting.png"),
  connected: join(defaultPath, "static", "tray_connected.png")
};
