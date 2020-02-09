# @vpnht/sdk

Node wrapper for [VPN.ht Desktop](https://github.com/vpnht/desktop).

## Table Of Contents

- [Installation](#installation)
- [Quick Example](#quick-example)
- [API](#api)

## Installation

**With Yarn:**

```bash
$ yarn add @vpnht/sdk
```

**With NPM:**

```bash
$ npm install @vpnht/sdk
```

## Usage

```javascript
const VPNht = require("@vpnht/sdk");
```

## Quick Example

### Run commands

```javascript
const VPNht = require("@vpnht/sdk");

const isConnected = await VPNht.isConnected();

if (!VPNht.isInstalled()) {
  const installer = await VPNht.install();

  installer.on("download", ({ percent, time }) => {
    console.log({ percent, time });
  });

  installer.on("error", data => {
    console.log(data);
  });
}

if (!isConnected) {
  VPNht.open();
}
```

## API

### `isConnected()`

Return a `Promise` with `true` when the VPN is connected.

### `isInstalled()`

Return a `Boolean` with `true` when the VPN Client is installed and ready.

### `open()`

Open the VPN.ht Desktop client and detach it from the opening process.

### `install()`

Return a `Promise` with an [`EventEmitter`](https://nodejs.org/api/events.html#events_class_eventemitter) who expose the following events name.

ATTENTION: When you call the `install()` function, the download is initialized right away.

```javascript
const installer = await VPNht.install();
```

#### `.on('download', function (data) {})`

Return the download progress with the following elements:

```json
{
  "percent": 0.5,
  "speed": 554732,
  "size": {
    "total": 90044871,
    "transferred": 27610959
  },
  "time": {
    "elapsed": 36.235,
    "remaining": 81.403
  }
}
```

#### `.on('downloaded', function (data) {})`

Triggered when the download is complete.

ATTENTION: The sdk will automatically open the installer when ready. You shouldn't have to handle anything here, but the event is exposed in case you may need it.

```json
{
  "path": "/var/tmp",
  "file": "/var/tmp/install.pkg"
}
```

#### `.on('installed', function () {})`

Triggered when the install is completed and the client ready.

We suggest to call `open()`.

#### `.on('error', function (error) {})`

Triggered when something went wrong with the install procedure.

### `status()`

Return a [`EventEmitter`](https://nodejs.org/api/events.html#events_class_eventemitter) who expose the following events name.

ATTENTION: When you call the `status()` function, the service need to be ready. You can validate it with `isInstalled` function.

```javascript
const status = VPNht.status();
```

#### `.on('connected', function () {})`

Triggered when the VPN status changed to connected.

#### `.on('disconnected', function () {})`

Triggered when the VPN status changed to connected.

#### `.on('error', function (error) {})`

Triggered when something went wrong with the service connection.
