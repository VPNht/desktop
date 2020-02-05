import path from "path";

export default () => {
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
