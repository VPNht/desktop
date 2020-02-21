import React, { useContext } from "react";
import appContext from "../../store";

import { VIEW } from "../../constants/actions";
import { CONNECT as CONNECT_VIEW } from "../../constants/view";

export default () => {
  const [state, dispatch] = useContext(appContext);

  return (
    <>
      <button
        className="bg-gray-100 border-gray-800 text-gray-800 font-bold py-1 px-2 rounded-md focus:outline-none"
        onClick={() => {
          dispatch({
            type: VIEW,
            payload: {
              view: CONNECT_VIEW
            }
          });
        }}
      >
        <svg
          className="fill-current text-gray-600 w-3 h-3"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path
            fill="#637381"
            d="M14 20.001a.994.994 0 0 1-.747-.336l-8-9a.999.999 0 0 1 0-1.328l8-9a.999.999 0 1 1 1.494 1.328l-7.41 8.336 7.41 8.336A.999.999 0 0 1 14 20.001"
          />
        </svg>
      </button>
    </>
  );
};
