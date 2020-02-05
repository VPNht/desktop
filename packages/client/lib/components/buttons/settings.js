import React from "react";
import rpc from "../../rpc";

export default () => {
  return (
    <>
      <button
        className="button"
        onClick={() => {
          rpc.emit("open hamburger menu", null);
        }}
      >
        <svg
          className="icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M19 11H1a1 1 0 1 1 0-2h18a1 1 0 1 1 0 2zm0-7H1a1 1 0 0 1 0-2h18a1 1 0 1 1 0 2zm0 14H1a1 1 0 0 1 0-2h18a1 1 0 1 1 0 2z" />
        </svg>
      </button>
      <style jsx>{`
        .button {
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
        }
        .button:focus {
          outline: none;
        }

        .icon {
          fill: #007772;
          cursor: pointer;
        }

        .button:hover .icon {
          fill: #000;
        }
      `}</style>
    </>
  );
};
