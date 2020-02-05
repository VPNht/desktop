import fs from "fs";
import path from "path";
import { profilePath } from "./path";

export const updateProfile = data => {
  const profile = profilePath();
  const profileExist = fs.existsSync(profile);

  const defaultConf = {
    name: "default",
    organization_id: null,
    organization: null,
    server_id: null,
    server: null,
    user_id: null,
    user: null,
    pre_connect_msg: null,
    password_mode: null,
    token: null,
    token_ttl: null,
    autostart: false,
    sync_hosts: [],
    sync_hash: null,
    sync_secret: null,
    sync_token: null,
    server_public_key: null,
    server_box_public_key: null
  };

  if (!profileExist) {
    fs.mkdirSync(profile);
  }

  fs.writeFileSync(path.join(profile, "default.ovpn"), data, {
    mode: 0o600
  });

  fs.writeFileSync(
    path.join(profile, "default.conf"),
    JSON.stringify(defaultConf),
    {
      mode: 0o600
    }
  );

  console.log(profile);
};
