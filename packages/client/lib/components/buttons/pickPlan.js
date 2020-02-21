import React, { useContext } from "react";
import appContext from "../../store";

import { SHOW_MODAL } from "../../constants/actions";

export default () => {
  const [state, dispatch] = useContext(appContext);

  return (
    <>
      <button
        className="mr-2 bg-special-green border-gray-800 text-gray-800 py-1 px-2 rounded-md focus:outline-none text-xs"
        onClick={async () => {
          dispatch({
            type: SHOW_MODAL,
            payload: {
              defaultView: "pickPlan"
            }
          });
        }}
      >
        Pick a plan
      </button>
      <style jsx>
        {`
          .bg-special-green {
            background-color: #00a6a3;
            color: #fff;
          }
        `}
      </style>
    </>
  );
};
