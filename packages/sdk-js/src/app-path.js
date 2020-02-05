import path from "path";

export default () => {
  if (process.platform === "win32") {
    return path.join("C:\\", "Program Files (x86)", "VPN.ht", "VPNht.exe");
  }

  if (process.platform === "darwin") {
    return path.join(
      path.sep,
      "Applications",
      "VPN.ht.app",
      "Contents",
      "MacOS",
      "VPN.ht"
    );
  }

  return path.join(path.sep, "usr", "lib", "vpnht", "VPNht");
};
