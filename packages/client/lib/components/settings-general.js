import React from "react";
import ElectronStore from "../store/persist";

export default () => {
  return (
    <dl>
      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dd className="text-sm leading-5 font-medium text-gray-500">
          VPN Protocol
        </dd>
        <dt className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
          <div className="relative">
            <select
              className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              defaultValue={ElectronStore.get("vpnProtocol") || "udp"}
              onChange={e => {
                ElectronStore.set("vpnProtocol", e.currentTarget.value);
              }}
            >
              <option key="udp" value="udp">
                OpenVPN (UDP)
              </option>
              <option disabled key="tcp" value="tcp">
                OpenVPN (TCP)
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </dt>
      </div>

      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dd className="text-sm leading-5 font-medium text-gray-500">
          Encryption
        </dd>
        <dt className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
          <div className="relative">
            <select
              className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              defaultValue={ElectronStore.get("encryption") || "128"}
              onChange={e => {
                ElectronStore.set("encryption", e.currentTarget.value);
              }}
            >
              <option key="128" value="128">
                128-BIT
              </option>
              <option key="256" value="256">
                256-BIT
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </dt>
      </div>

      <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dd className="text-sm leading-5 font-medium text-gray-500">
          Auto-reconnect
        </dd>
        <dt className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
          <input
            className="mr-2 leading-tight"
            type="checkbox"
            defaultChecked={
              ElectronStore.get("autoReconnect") !== null
                ? ElectronStore.get("autoReconnect")
                : true
            }
            onChange={() => {
              const currentValue =
                ElectronStore.get("autoReconnect") !== null
                  ? ElectronStore.get("autoReconnect")
                  : true;
              ElectronStore.set("autoReconnect", !currentValue);
            }}
          />
        </dt>
      </div>

      <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dd className="text-sm leading-5 font-medium text-gray-500">
          Disable Smart DNS
        </dd>
        <dt className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
          <input
            className="mr-2 leading-tight"
            type="checkbox"
            defaultChecked={
              ElectronStore.get("disableSmartDNS") !== null
                ? ElectronStore.get("disableSmartDNS")
                : false
            }
            onChange={() => {
              const currentValue =
                ElectronStore.get("disableSmartDNS") !== null
                  ? ElectronStore.get("disableSmartDNS")
                  : false;
              ElectronStore.set("disableSmartDNS", !currentValue);
            }}
          />
        </dt>
      </div>

      <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dd className="text-sm leading-5 font-medium text-gray-500">
          Bypass Firewall
        </dd>
        <dt className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
          <input
            className="mr-2 leading-tight"
            type="checkbox"
            defaultChecked={
              ElectronStore.get("bypassFirewall") !== null
                ? ElectronStore.get("bypassFirewall")
                : false
            }
            onChange={() => {
              const currentValue =
                ElectronStore.get("bypassFirewall") !== null
                  ? ElectronStore.get("bypassFirewall")
                  : false;
              ElectronStore.set("bypassFirewall", !currentValue);
            }}
          />
        </dt>
      </div>
    </dl>
  );
};
