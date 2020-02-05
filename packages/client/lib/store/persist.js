import Store from "electron-store";
const encryptionKey = "385fcf34-395d-11ea-a137-2e728ce88125";
export default new Store({ name: "uiconfig", encryptionKey });
