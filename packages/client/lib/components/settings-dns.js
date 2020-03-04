import React, { useState, useEffect } from "react";
import ElectronStore from "../store/persist";

export default () => {
  const [editDns, setEditDns] = useState(false);
  const [tempDNS, setTempDNS] = useState("");

  const [customDns1, setCustomDns1] = useState(ElectronStore.get("customDns1"));
  const [customDns2, setCustomDns2] = useState(ElectronStore.get("customDns2"));

  useEffect(() => {
    setCustomDns1(ElectronStore.get("customDns1"));
    setCustomDns2(ElectronStore.get("customDns2"));
  }, [ElectronStore.get("customDns1"), ElectronStore.get("customDns2")]);

  const validateIpInput = value => {
    const re = /^[0-9.\b]+$/;

    if (value === "" || re.test(value)) {
      return true;
    }

    return false;
  };

  const validateIp = value => {
    const re = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

    if (value === "" || re.test(value)) {
      return true;
    }

    return false;
  };

  const saveDNS = dnsKey => {
    if (!validateIp(tempDNS)) {
      return;
    }

    ElectronStore.set(dnsKey, tempDNS);
    setEditDns(false);
    setTempDNS("");
  };

  return (
    <div className="p-5 text-gray-800">
      <table className="text-left w-full border-collapse">
        <tbody>
          <tr className="hover:bg-grey-lighter">
            <td className="py-4 px-6 border-b border-grey-light">
              {editDns && editDns === "dns1" ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    saveDNS("customDns1");
                  }}
                >
                  <input
                    autoFocus
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    type="text"
                    value={tempDNS}
                    onChange={e => {
                      if (validateIpInput(e.currentTarget.value)) {
                        setTempDNS(e.currentTarget.value);
                      }
                    }}
                    placeholder="Enter custom DNS IP Address"
                  />
                </form>
              ) : customDns1 ? (
                <label
                  className="cursor-pointer"
                  onClick={() => {
                    setEditDns("dns1");
                    setTempDNS(customDns1);
                  }}
                >
                  {customDns1}
                </label>
              ) : (
                <span
                  className="cursor-pointer text-gray-600 text-sm italic"
                  onClick={() => {
                    setEditDns("dns1");
                    setTempDNS("");
                  }}
                >
                  Custom DNS Not Set
                </span>
              )}
            </td>
            <td className="py-4 px-6 border-b border-grey-light text-right">
              {editDns && editDns === "dns1" ? (
                <button
                  onClick={() => {
                    saveDNS("customDns1");
                  }}
                  className="focus:outline-none text-grey-lighter font-bold py-1 px-3 rounded text-xs bg-green hover:bg-green-dark"
                >
                  Save
                </button>
              ) : customDns1 ? (
                <div>
                  <button
                    onClick={() => {
                      setEditDns("dns1");
                      setTempDNS(customDns1);
                    }}
                    className="focus:outline-none text-grey-lighter font-bold py-1 px-3 rounded text-xs bg-green hover:bg-green-dark"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      ElectronStore.delete("customDns1");
                      setCustomDns1(false);
                    }}
                    className="focus:outline-none text-grey-lighter font-bold py-1 px-3 rounded text-xs bg-green hover:bg-green-dark"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditDns("dns1");
                  }}
                  className="focus:outline-none text-grey-lighter font-bold py-1 px-3 rounded text-xs bg-green hover:bg-green-dark"
                >
                  Edit
                </button>
              )}
            </td>
          </tr>

          <tr className="hover:bg-grey-lighter">
            <td className="py-4 px-6 border-b border-grey-light">
              {editDns && editDns === "dns2" ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    saveDNS("customDns2");
                  }}
                >
                  <input
                    autoFocus
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    type="text"
                    value={tempDNS}
                    onChange={e => {
                      if (validateIpInput(e.currentTarget.value)) {
                        setTempDNS(e.currentTarget.value);
                      }
                    }}
                    placeholder="Enter custom DNS IP Address"
                  />
                </form>
              ) : customDns2 ? (
                <label
                  className="cursor-pointer"
                  onClick={() => {
                    setEditDns("dns2");
                    setTempDNS(customDns2);
                  }}
                >
                  {customDns2}
                </label>
              ) : (
                <span
                  className="cursor-pointer text-gray-600 text-sm italic"
                  onClick={() => {
                    setEditDns("dns2");
                    setTempDNS("");
                  }}
                >
                  Custom DNS Not Set
                </span>
              )}
            </td>
            <td className="py-4 px-6 border-b border-grey-light text-right">
              {editDns && editDns === "dns2" ? (
                <button
                  onClick={() => {
                    saveDNS("customDns2");
                  }}
                  className="focus:outline-none text-grey-lighter font-bold py-1 px-3 rounded text-xs bg-green hover:bg-green-dark"
                >
                  Save
                </button>
              ) : customDns2 ? (
                <div>
                  <button
                    onClick={() => {
                      setEditDns("dns2");
                      setTempDNS(customDns2);
                    }}
                    className="focus:outline-none text-grey-lighter font-bold py-1 px-3 rounded text-xs bg-green hover:bg-green-dark"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      ElectronStore.delete("customDns2");
                      setCustomDns2(false);
                    }}
                    className="focus:outline-none text-grey-lighter font-bold py-1 px-3 rounded text-xs bg-green hover:bg-green-dark"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditDns("dns2");
                  }}
                  className="focus:outline-none text-grey-lighter font-bold py-1 px-3 rounded text-xs bg-green hover:bg-green-dark"
                >
                  Edit
                </button>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-5">
        <label className="md:w-2/3 block text-gray-500 font-sm">
          <input
            className="mr-2 leading-tight"
            type="checkbox"
            defaultChecked={
              ElectronStore.get("customDnsEnabled") !== null
                ? ElectronStore.get("customDnsEnabled")
                : false
            }
            onChange={() => {
              const currentValue =
                ElectronStore.get("customDnsEnabled") !== null
                  ? ElectronStore.get("customDnsEnabled")
                  : false;
              ElectronStore.set("customDnsEnabled", !currentValue);
            }}
          />
          <span className="text-sm">Enable Custom DNS Server</span>
        </label>
      </div>
    </div>
  );
};
