import React, { useContext } from "react";
import appContext from "../../store";

import { SHOW_MODAL } from "../../constants/actions";

export default () => {
  const [state, dispatch] = useContext(appContext);

  return (
    <div className="flex flex-row-reverse">
      <button
        className="bg-special-green border-gray-800 text-gray-800 font-bold py-1 px-2 rounded-md focus:outline-none text-xs"
        onClick={async () => {
          dispatch({
            type: SHOW_MODAL,
            payload: {
              defaultView: "signup"
            }
          });
        }}
      >
        Create Account
      </button>

      <button
        className="mr-2 bg-gray-100 border-gray-800 text-gray-800 py-1 px-2 rounded-md focus:outline-none text-xs"
        onClick={async () => {
          dispatch({
            type: SHOW_MODAL,
            payload: {
              defaultView: "login"
            }
          });
        }}
      >
        Log In
      </button>
      <style jsx>
        {`
          .bg-special-green {
            background-color: #00a6a3;
            color: #fff;
          }
        `}
      </style>
    </div>
  );
};
