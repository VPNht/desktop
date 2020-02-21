import React, { useContext } from "react";
import appContext from "../../store";
import { TOGGLE_SIDEBAR } from "../../constants/actions";

export default () => {
  const [state, dispatch] = useContext(appContext);
  return (
    <>
      <button
        className="bg-gray-100 border-gray-800 text-gray-800 font-bold py-1 px-2 rounded-md ml-2 focus:outline-none"
        onClick={() => {
          dispatch({
            type: TOGGLE_SIDEBAR
          });
        }}
      >
        {state.showSidebar ? (
          <svg
            className="fill-current text-gray-600 w-3 h-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M0 19V1a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zM18 8V6a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0zm0 6v-2a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0zm-1 5a1 1 0 0 1 1-1 1 1 0 1 1 2 0v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zm1-17a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0zm-3-1a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1zm-4 18a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1zm-4-1V2H2v16h5z"
            />
          </svg>
        ) : (
          <svg
            className="fill-current text-gray-600 w-3 h-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M20 19V1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1zM2 8a1 1 0 1 1-2 0V6a1 1 0 1 1 2 0v2zm0 6v-2a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0m1 5a1 1 0 0 0-1-1 1 1 0 1 0-2 0v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1M2 2a1 1 0 1 0 0-2H1a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0m3-1a1 1 0 0 0 1 1h2a1 1 0 1 0 0-2H6a1 1 0 0 0-1 1m4 18a1 1 0 0 0-1-1H6a1 1 0 1 0 0 2h2a1 1 0 0 0 1-1m4-1h5V2h-5v16z"
            />
          </svg>
        )}
      </button>
    </>
  );
};
