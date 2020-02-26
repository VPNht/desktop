import React, { useContext } from "react";
import appContext from "../store";

export default ({ connectServer }) => {
  const [state] = useContext(appContext);

  return (
    <div className="w-full h-full bg-gray-200">
      <div className="pt-1 px-3 overflow-auto h-full pb-1">
        {state.servers.map(server => (
          <div className="flex justify-between" key={`sbar-${server.host}`}>
            <button
              onClick={() => connectServer(server.ip)}
              className="buttonContainer py-1 px-1 flex text-gray-700 text-xs items-center hover:bg-gray-700 hover:text-white rounded-md w-full focus:outline-none tracking-tighter"
            >
              <img
                className="flagIcons ml-1 mr-1 rounded-full"
                src={`./static/flags/${server.country}.png`}
              />
              {server.countryName} ({server.host})
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollableSize {
          height: calc(100% - 70px);
        }

        .flagIcons {
          width: 16px;
          height: 11px;
        }
      `}</style>
    </div>
  );
};
