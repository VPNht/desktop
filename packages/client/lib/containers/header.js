import React from "react";

import SettingsButton from "../components/buttons/settings";
import { version } from "../../helpers/utils";

export default () => {
  return (
    <>
      <div className="header">
        <div className="logo">
          <img src="./static/header_logo.jpg" />
          <span className="version">v{version}</span>
        </div>
        <div className="menu">
          <SettingsButton />
        </div>
      </div>
      <style jsx>{`
        .header {
          font-family: "Inter", sans-serif;
          color: #000;
          background-image: url("./static/header.jpg");
          background-repeat: no-repeat;
          background-size: auto;
          background-color: #fff;
          width: 100%;
          height: 120px;
          display: flex;
          justify-content: space-between;
        }
        .logo {
          height: 56px;
          padding-left: 30px;
          padding-top: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .version {
          margin-top: 20px;
          color: #bdbaba;
          padding-left: 10px;
          font-size: 12px;
        }
        .menu {
          margin-right: 30px;
          margin-top: 30px;
        }
      `}</style>
    </>
  );
};
