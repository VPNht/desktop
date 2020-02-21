import electron from "electron";
import isDev from "electron-is-dev";
import path from "path";

export const remoteRequire = () => {
  var remote = electron.remote;
  if (remote) {
    return remote;
  }
  return electron;
};

export const userDataPath = () => {
  return remoteRequire().app.getPath("userData");
};

export const authPath = () => {
  if (isDev) {
    return path.join("..", "..", "dev", "auth");
  }

  if (process.platform === "win32") {
    return path.join("C:\\", "ProgramData", "VPNht", "auth");
  }

  if (process.platform === "darwin") {
    return path.join(
      path.sep,
      "Applications",
      "VPN.ht.app",
      "Contents",
      "Resources",
      "auth"
    );
  }

  return path.join(path.sep, "var", "run", "vpnht.auth");
};

// application logs
export const systemLogPath = () => {
  return path.join(userDataPath(), "vpnht.log");
};

export const profilePath = () => {
  return path.join(userDataPath(), "profiles");
};

// openvpn logs
export const vpnLogPath = () => {
  return path.join(profilePath(), "default.log");
};

// service (go) logs
export const serviceLogPath = () => {
  if (isDev) {
    return path.join("..", "..", "dev", "log", "vpnht.log");
  }

  if (process.platform === "darwin") {
    return path.join(
      path.sep,
      "Applications",
      "VPN.ht.app",
      "Contents",
      "Resources",
      "vpnht.log"
    );
  } else if (process.platform === "win32") {
    return path.join("C:\\", "ProgramData", "VPNht", "vpnht.log");
  }

  return path.join(path.sep, "var", "log", "vpnht.log");
};
