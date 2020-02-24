import { EventEmitter } from "events";
import { ipcRenderer } from "electron";
export default class Client {
  emitter;
  ipc;
  id;
  constructor() {
    this.emitter = new EventEmitter();
    this.ipc = ipcRenderer;
    if (window.__rpcId) {
      setTimeout(() => {
        this.id = window.__rpcId;
        this.ipc.on(this.id, this.ipcListener);
        this.emitter.emit("ready", null);
      }, 0);
    } else {
      this.ipc.on("init", (ev, uid) => {
        // we cache so that if the object
        // gets re-instantiated we don't
        // wait for a `init` event
        window.__rpcId = uid;
        this.id = uid;
        this.ipc.on(uid, this.ipcListener);
        this.emitter.emit("ready", null);
      });
    }
  }

  ipcListener = (event, { ch, data }) => {
    this.emitter.emit(ch, data);
  };

  on(ev, fn) {
    this.emitter.on(ev, fn);
  }

  once(ev, fn) {
    this.emitter.once(ev, fn);
  }

  emit(ev, data) {
    if (!this.id) {
      throw new Error("Not ready");
    }
    this.ipc.send(this.id, { ev, data });
  }

  removeListener(ev, fn) {
    this.emitter.removeListener(ev, fn);
  }

  removeAllListeners() {
    this.emitter.removeAllListeners();
  }

  destroy() {
    this.removeAllListeners();
    this.ipc.removeAllListeners(this.id);
  }
}
