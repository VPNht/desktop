import EventEmitter from "events";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import request from "request-promise-native";
import progress from "request-progress";
import isInstalled from "./is-installed";
import lastVersion from "./last-version";
import { repository } from "../package.json";

const installEmitter = new EventEmitter();

let command = "open";

if (process.platform === "win32") {
  command = "start";
}

export default async installPath => {
  let realPath = installPath;
  if (!installPath) {
    realPath = fs.mkdtempSync(path.join(os.tmpdir(), "vpnht-"));
  }

  try {
    const appVersion = await lastVersion();

    let extension = "pkg";
    if (process.platform === "win32") {
      extension = "exe";
    }

    if (process.platform === "linux") {
      const isDebian = fs.existsSync("/etc/debian_version");
      if (isDebian) {
        extension = "deb";
      } else {
        extension = "rpm";
      }
    }

    const outFile = `${realPath}/install.${extension}`;

    progress(
      request(
        `https://github.com/${repository}/releases/download/v${appVersion}/VPNht-${appVersion}.${extension}`
      )
    )
      .on("progress", function(state) {
        installEmitter.emit("download", state);
      })
      .on("error", function(err) {
        installEmitter.emit("error", err);
      })
      .on("end", function() {
        installEmitter.emit("downloaded", { path: realPath, file: outFile });
        execFileSync(command, [outFile]);

        const checkInterval = setInterval(() => {
          if (isInstalled()) {
            clearInterval(checkInterval);
            installEmitter.emit("installed");
          }
        }, 2000);
      })
      .pipe(fs.createWriteStream(outFile));
  } catch (error) {
    installEmitter.emit("error", error);
  }

  return installEmitter;
};
