import fs from "fs";
import stripLastNewLine from "strip-final-newline";
import { systemLogPath, serviceLogPath, vpnLogPath } from "./path";

const formatLog = (logPath, type) => {
  const fileExist = fs.existsSync(logPath);
  if (!fileExist) {
    return [];
  }
  const data = fs.readFileSync(logPath, "utf8");
  if (data) {
    const strippedData = stripLastNewLine(data);
    const logs = [
      ...strippedData.matchAll(/(\[.*?\])(\[.*?\])([\s\S]*?(?=\n.*?\[|$))/g)
    ];

    return logs.map(log => {
      return {
        type,
        date: new Date(log[1].slice(1, -1)),
        level: log[2],
        data: log[3]
      };
    });
  }
  return [];
};

export const readSystemLog = () => {
  return formatLog(systemLogPath(), "APP");
};

export const readServiceLog = () => {
  return formatLog(serviceLogPath(), "SERVICE");
};

export const writeSystemLog = (lvl, log) => {
  console.log(`[${lvl}] ${log}`);
  const path = systemLogPath();
  const fileExist = fs.existsSync(path);
  if (!fileExist) {
    fs.closeSync(fs.openSync(path, "w"));
  }

  const time = new Date();
  const msg =
    "[" +
    time.getFullYear() +
    "-" +
    (time.getMonth() + 1) +
    "-" +
    time.getDate() +
    " " +
    time.getHours() +
    ":" +
    time.getMinutes() +
    ":" +
    time.getSeconds() +
    "][" +
    lvl +
    "] ▶  app: " +
    log +
    "\n";

  fs.appendFileSync(path, msg);
};

export const info = log => {
  writeSystemLog("INFO", log);
};

export const error = log => {
  let realLog = log;
  if (typeof log === "object" && log.message) {
    realLog = log.message;
  }
  writeSystemLog("ERROR", realLog);
};

export const warning = log => {
  writeSystemLog("WARN", log);
};

export const readProfileLog = () => {
  const path = vpnLogPath();
  const fileExist = fs.existsSync(path);
  if (!fileExist) {
    return [];
  }
  const data = fs.readFileSync(path, "utf8");

  if (data) {
    const strippedData = stripLastNewLine(data);
    const logs = [
      ...strippedData.matchAll(
        /([a-zA-Z]{3} [a-zA-Z]{3} [0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} [0-9]{4}) ([\s\S]*?(?=\n.*?([a-zA-Z]{3} [a-zA-Z]{3} [0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} [0-9]{4})|$))/g
      )
    ];
    return logs.map(log => {
      return {
        type: "PROFILE",
        date: new Date(log[1]),
        level: "INFO",
        data: ` ▶  vpn: ${log[2]}`
      };
    });
  }

  return [];
};

export const flushAllLogs = () => {
  try {
    fs.unlinkSync(vpnLogPath());
    fs.closeSync(fs.openSync(vpnLogPath(), "w"));
  } catch (error) {}
  try {
    fs.unlinkSync(systemLogPath());
    fs.closeSync(fs.openSync(systemLogPath(), "w"));
  } catch (error) {}
};
