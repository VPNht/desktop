const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");
const replace = require("replace-in-file");
// wanted version

// NOT OFFICIAL RELEASE
// 1.1.0-canary-28011427
// 1.1.0-master-28011427

// OFFICIAL RELEASE (tag)
// 1.0.0

const { version: previousVersion } = require("../../../package.json");
let currentVersion = "0.0.0";

const formatNumber = number => {
  return `0${number}`.slice(-2);
};

const buildVersion = (ref = "master") => {
  if (ref.charAt(0) === "v") {
    return ref.substr(1);
  }

  const currentDate = new Date();
  return `${previousVersion}-${ref}-${formatNumber(
    currentDate.getUTCDate()
  )}${formatNumber(currentDate.getUTCMonth() + 1)}${formatNumber(
    currentDate.getUTCHours()
  )}${formatNumber(currentDate.getUTCMinutes())}`;
};

try {
  const payload = github.context.payload || null;
  console.log({ previousVersion });

  if (!payload) {
    throw new Error("No payload found");
  }

  const { ref } = payload;
  if (ref) {
    const foundRef = ref.replace("refs/heads/", "").replace("refs/tags/", "");
    currentVersion = buildVersion(foundRef);

    // update the constants for the build
    try {
      const options = {
        files: path.resolve(__dirname, "../../../packages/client/package.json"),
        from: /("version": ".*?")/g,
        to: `"version": "${currentVersion}"`
      };
      const changedFiles = replace.sync(options);
      console.log(changedFiles);
    } catch (error) {
      console.error("Error occurred:", error);
    }

    try {
      const options = {
        files: path.resolve(
          __dirname,
          "../../../packages/client/app/package.json"
        ),
        from: /("version": ".*?")/g,
        to: `"version": "${currentVersion}"`
      };
      const changedFiles = replace.sync(options);
      console.log(changedFiles);
    } catch (error) {
      console.error("Error occurred:", error);
    }

    try {
      const options = {
        files: path.resolve(
          __dirname,
          "../../../packages/service/constants/constants.go"
        ),
        from: /(Version = ".*?")/g,
        to: `Version = "${currentVersion}"`
      };
      const changedFiles = replace.sync(options);
      console.log(changedFiles);
    } catch (error) {
      console.error("Error occurred:", error);
    }

    try {
      const options = {
        files: path.resolve(
          __dirname,
          "../../../resources/linux/DEBIAN/control"
        ),
        from: /(Version: .*)/g,
        to: `Version: ${currentVersion}`
      };
      const changedFiles = replace.sync(options);
      console.log(changedFiles);
    } catch (error) {
      console.error("Error occurred:", error);
    }

    try {
      const options = {
        files: path.resolve(__dirname, "../../../resources/linux/vpnht.spec"),
        from: /(Version: .*)/g,
        to: `Version: ${currentVersion}`
      };
      const changedFiles = replace.sync(options);
      console.log(changedFiles);
    } catch (error) {
      console.error("Error occurred:", error);
    }

    try {
      const options = {
        files: path.resolve(
          __dirname,
          "../../../resources/macos/distribution.xml"
        ),
        from: /(id="ht.vpn.pkg.VPNht" version=".*?")/g,
        to: `id="ht.vpn.pkg.VPNht" version="${currentVersion}"`
      };
      const changedFiles = replace.sync(options);
      console.log(changedFiles);
    } catch (error) {
      console.error("Error occurred:", error);
    }

    try {
      const options = {
        files: path.resolve(__dirname, "../../../resources/windows/setup.iss"),
        from: /(MyAppVersion ".*?")/g,
        to: `MyAppVersion "${currentVersion}"`
      };
      const changedFiles = replace.sync(options);
      console.log(changedFiles);
    } catch (error) {
      console.error("Error occurred:", error);
    }
  }

  console.log({ currentVersion });

  core.setOutput("version", currentVersion);
} catch (error) {
  core.setFailed(error.message);
}
