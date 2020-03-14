import EventEmitter from "events";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import request from "request-promise-native";
import progress from "request-progress";
import isInstalled from "./is-installed";
import lastVersion from "./last-version";

const installEmitter = new EventEmitter();

let command = "open";

if (process.platform === "linux") {
  command = "pkexec";
}

export default async installPath => {
  let realPath = installPath;
  let isDebian = false;

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
      isDebian = fs.existsSync("/etc/debian_version");
      if (isDebian) {
        extension = "deb";
      } else {
        extension = "rpm";
      }
    }

    const outFile = `${realPath}/install.${extension}`;

    progress(
      request(
        `https://vpnhtsoftware.s3.amazonaws.com/${appVersion}/VPNht-${appVersion}.${extension}`
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

        if (process.platform === "linux") {
          if (isDebian) {
            execFileSync(command, ["apt", "install", "-f", "--yes", outFile]);
          } else {
            execFileSync(command, [
              "yum",
              "--nogpgcheck",
              "localinstall",
              outFile
            ]);
          }
        } else if (process.platform === "win32") {
          let tries = 5;
          const trySpawn = () => {
            try {
              tries--;
              execFileSync(outFile);
            } catch (err) {
              if ((err.code === "ETXTBSY" || err.code === "EBUSY") && tries) {
                setTimeout(() => {
                  trySpawn();
                }, 2000);
              }
            }
          };
          trySpawn();
        } else {
          execFileSync(command, [outFile]);
        }

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
