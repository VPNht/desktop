import React, { useState } from "react";

import SettingsGeneral from "./settings-general";
import SettingsDNS from "./settings-dns";

export default () => {
  const [currentTab, setTab] = useState("general");

  return (
    <div className="p-5">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <ul className="flex">
            <li className="mr-3">
              <button
                className={
                  currentTab === "general"
                    ? "focus:outline-none inline-block rounded py-1 px-3 bg-green-vpn text-white"
                    : "focus:outline-none inline-block rounded hover:border-gray-200 text-green-vpn hover:bg-gray-200 py-1 px-3"
                }
                onClick={() => {
                  setTab("general");
                }}
              >
                General
              </button>
            </li>
            <li className="mr-3">
              <button
                className={
                  currentTab === "dns"
                    ? "focus:outline-none inline-block rounded py-1 px-3 bg-green-vpn text-white"
                    : "focus:outline-none inline-block rounded hover:border-gray-200 text-green-vpn hover:bg-gray-200 py-1 px-3"
                }
                onClick={() => {
                  setTab("dns");
                }}
              >
                DNS
              </button>
            </li>
          </ul>
        </div>
        <div>
          {currentTab === "general" && <SettingsGeneral />}
          {currentTab === "dns" && <SettingsDNS />}
        </div>
      </div>

      <style jsx>
        {`
          .bg-green-vpn {
            background-color: #007775;
          }
          .text-green-vpn {
            color: #007775;
          }
        `}
      </style>
    </div>
  );
};
