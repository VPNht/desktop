import {
  app,
  BrowserWindow,
  dialog,
  shell,
  Tray,
  Menu,
  MenuItem,
  Notification
} from "electron";
import isDev from "electron-is-dev";
import { resolve, join } from "path";
import fs from "fs";

import { wakeup, ping, status, disconnect } from "../helpers/service";
import { subscribe } from "../helpers/events";
import trayIcons from "./tray";
import { vpnLogPath } from "../helpers/path";
import { version } from "../helpers/utils";
import { lastRelease } from "../helpers/github";
import { repository } from "../helpers/utils";
import { info, error, warning } from "../helpers/logger";

import {
  // SETTINGS as SETTINGS_VIEW,
  LOGS as LOGS_VIEW,
  LOGIN as LOGIN_VIEW,
  CONNECT as CONNECT_VIEW
} from "../lib/constants/view";

import createRPC from "./rpc";

let mainWindow;
let tray;
let rpc;
let hamburgerMenu;
let isConnected = false;
let isLogged = false;

info(`----------------`);
info(`Initializing ${version}`);

if (isDev) {
  info("Running in development mode");
}

const url = `file://${resolve(
  isDev ? "target" : app.getAppPath(),
  "index.html"
)}`;

const checkService = async () => {
  info("Process ready");

  // ping service
  const servicePing = await ping();
  const timeout = 6000;

  // delete session log file
  try {
    fs.unlinkSync(vpnLogPath());
  } catch (error) {}

  if (!servicePing) {
    warning("can't connect to service... trying to wake up");
    setTimeout(async () => {
      try {
        const servicePing = await ping();
        if (!servicePing) {
          error("unable to connect to service");
          const clickedButton = dialog.showMessageBoxSync(null, {
            type: "warning",
            buttons: ["Exit", "Retry"],
            defaultId: 1,
            title: "VPN.ht - Service Error",
            message:
              "Unable to communicate with helper service, " +
              "try restarting computer"
          });
          if (clickedButton === 0) {
            app.quit();
          }
          if (clickedButton === 1) {
            checkService();
            return;
          }
        }
      } catch (error) {
        error(error);

        if (error.statusCode && error.statusCode === 401) {
          dialog.showMessageBox(
            null,
            {
              type: "warning",
              buttons: ["Exit"],
              title: "VPN.ht - Service Error",
              message:
                "Unable to establish communication with helper " +
                "service, try restarting computer"
            },
            () => {
              app.quit();
            }
          );
        }
      }
    }, timeout);
    return;
  }

  // wake up the service and make sure it's ready to work
  const { statusCode: wakeUpStatusCode, wakeup: isWakeUp } = await wakeup();

  if (wakeUpStatusCode === 401) {
    error("Can't wakeup the service (401)");
    dialog.showMessageBox(
      null,
      {
        type: "warning",
        buttons: ["Exit"],
        title: "VPN.ht - Service Error",
        message:
          "Unable to establish communication with helper " +
          "service, try restarting computer"
      },
      function() {
        app.quit();
      }
    );
    return;
  }

  if (isWakeUp) {
    error("Can't wakeup the service (isWakeUp)");
    app.quit();
    return;
  }

  info("Service ready");

  // subscribe to service events
  const serviceEvents = subscribe();

  serviceEvents.on("message", async data => {
    const evt = JSON.parse(data);
    if (evt.type === "output") {
      const logPath = vpnLogPath();
      fs.appendFileSync(logPath, evt.data.output + "\n");
    } else if (evt.type === "connected") {
      isConnected = true;
      updateHamburgerMenu();
      if (tray) {
        tray.setImage(trayIcons.connected);
      }
    } else if (evt.type === "disconnected") {
      isConnected = false;
      updateHamburgerMenu();
      if (tray) {
        tray.setImage(trayIcons.default);
      }
    } else if (evt.type === "wakeup") {
      openMainWin();
    }
  });

  let noMain = false;
  process.argv.forEach(function(val) {
    if (val === "--no-main") {
      noMain = true;
    }
  });

  if (!noMain) {
    openMainWin();
  } else if (process.platform === "linux") {
    app.quit();
    return;
  }

  const vpnStatus = await status();
  isConnected = vpnStatus;
  updateHamburgerMenu();

  if (process.platform !== "linux") {
    tray = new Tray(vpnStatus ? trayIcons.connected : trayIcons.default);
    tray.on("click", function() {
      openMainWin();
    });
    tray.on("double-click", function() {
      openMainWin();
    });
  }

  // app menu
  const appMenu = Menu.buildFromTemplate([
    {
      label: "VPN.ht",
      submenu: [
        {
          label: `VPN.ht ${version}`
        },
        {
          label: "Close",
          accelerator: "CmdOrCtrl+Q",
          role: "close"
        },
        {
          label: "Exit",
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          role: "undo"
        },
        {
          label: "Redo",
          accelerator: "Shift+CmdOrCtrl+Z",
          role: "redo"
        },
        {
          type: "separator"
        },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          role: "cut"
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          role: "copy"
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          role: "paste"
        },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          role: "selectall"
        }
      ]
    }
  ]);

  if (!isDev) {
    Menu.setApplicationMenu(appMenu);
  }
};

const openMainWin = async () => {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    title: "VPN.ht",
    frame: true,
    autoHideMenuBar: true,
    fullscreen: false,
    width: 440,
    height: 520,
    show: false,
    sandbox: true,
    minWidth: 440,
    minHeight: 520,
    maxWidth: 440,
    maxHeight: 520,
    backgroundColor: "#00A6A3",
    webPreferences: {
      nodeIntegration: true
    }
  });

  // check updates
  info("Checking updates...");
  const lastVersion = await lastRelease();
  if (lastVersion && version !== lastVersion) {
    showUpdateDialog(lastVersion);
  }

  configureRPC(mainWindow);
  mainWindow.loadURL(url);

  if (app.dock) {
    app.dock.show();
  }

  mainWindow.on("closed", function() {
    if (process.platform === "linux") {
      app.quit();
    }
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", () => {
    if (!mainWindow) {
      error('"mainWindow" is not defined');
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      info("Starting minimized");
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
};

const showUpdateDialogNoVersion = () => {
  dialog.showMessageBoxSync(null, {
    type: "warning",
    buttons: ["Ok"],
    title: "VPN.ht",
    message: "No updates available."
  });
};

const showUpdateDialog = version => {
  info(`New version available: ${version}`);
  const clickedButton = dialog.showMessageBoxSync(null, {
    type: "warning",
    buttons: ["View update", "Remind me later"],
    defaultId: 0,
    title: "VPN.ht - Update available",
    message: `Do you want to install the new version ${version}?`
  });
  if (clickedButton === 0) {
    shell.openExternal(
      `https://github.com/${repository}/releases/tag/v${version}`
    );
  }
  if (clickedButton === 1) {
    // just ignore and continue
    return;
  }
};

const buildHamburgerMenu = menuItems => {
  menuItems.forEach(item => {
    let menuitem;

    // Separator
    if (item.type === "separator") {
      menuitem = new MenuItem({
        type: item.type
      });
    } else {
      menuitem = new MenuItem({
        label: item.label,
        type: item.type,
        accelerator: item.accelerator,
        checked: item.checked,
        enabled: item.enabled,
        visible: item.visible,
        click: item.click
      });
    }

    hamburgerMenu.append(menuitem);
  });
};

const updateHamburgerMenu = () => {
  hamburgerMenu = new Menu();

  let menuItems = [];

  if (isLogged) {
    menuItems = [
      ...menuItems,
      {
        label: "Home",
        click: () => {
          rpc.emit("change view", CONNECT_VIEW);
        }
      }
    ];
  } else {
    menuItems = [
      ...menuItems,
      {
        label: "Login",
        click: () => {
          rpc.emit("change view", LOGIN_VIEW);
        }
      }
    ];
  }

  menuItems = [
    ...menuItems,
    {
      label: "View logs",
      click: () => {
        rpc.emit("change view", LOGS_VIEW);
      }
    },
    {
      label: "Check updates",
      click: async () => {
        const lastVersion = await lastRelease();
        if (lastVersion && version !== lastVersion) {
          showUpdateDialog(lastVersion);
        } else {
          showUpdateDialogNoVersion();
        }
      }
    },
    {
      type: "separator"
    }
  ];

  if (isConnected) {
    menuItems = [
      ...menuItems,
      {
        label: "Disconnect",
        click: async () => {
          await disconnect();
        }
      },
      {
        type: "separator"
      }
    ];
  }

  if (isLogged) {
    menuItems = [
      ...menuItems,
      {
        label: "Sign out",
        click: () => {
          rpc.emit("logout");
        }
      }
    ];
  }

  menuItems = [
    ...menuItems,
    {
      label: "Exit",
      click: () => {
        app.quit();
      }
    }
  ];

  buildHamburgerMenu(menuItems);
};

const configureRPC = win => {
  rpc = createRPC(win);

  rpc.on("open hamburger menu", () => {
    hamburgerMenu.popup();
  });

  rpc.on("show notification", body => {
    const notif = new Notification({
      title: "VPN.ht",
      body
    });
    notif.show();
  });

  rpc.on("set status login", () => {
    isLogged = true;
    updateHamburgerMenu();
  });
  rpc.on("set status logout", () => {
    isLogged = false;
    updateHamburgerMenu();
  });
};

app.on("ready", checkService);

app.on("window-all-closed", function() {
  if (process.platform === "linux" || !tray) {
    app.quit();
  } else {
    if (app.dock) {
      app.dock.hide();
    }
  }
});

app.on("activate", function() {
  if (mainWindow === null) {
    openMainWin();
  }
});

app.on("before-quit", async () => {
  // make sure we are disconnected
  try {
    await disconnect();
  } catch (error) {}
});

app.on("quit", () => {
  app.quit();
});
