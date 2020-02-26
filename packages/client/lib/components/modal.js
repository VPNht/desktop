import React, { useContext, useEffect, useState } from "react";
import appContext from "../store";
import { CLOSE_MODAL } from "../constants/actions";

import Login from "./login";
import Signup from "./signup";
import PickPan from "./pickPlan";
import ResetPassword from "./resetPasswd";

const ModalApp = () => {
  const [state, dispatch] = useContext(appContext);
  const [currentFormStep, changeFormStep] = useState(null);
  const [currentView, changeView] = useState(null);

  useEffect(() => {
    changeView(state.currentModalView);
  }, [state.currentModalView]);

  // reset when modal is shown or hidden
  // or when view is changed
  useEffect(() => {
    changeFormStep(null);
  }, [state.showModal, currentView]);

  if (!state.showModal) {
    return <div />;
  }

  // prevent screenflashin'
  if (!currentView) {
    return <div />;
  }

  let currentTitle = "Log In";

  if (currentView === "signup") {
    currentTitle = "Sign Up";
  }

  if (currentView === "pickPlan") {
    currentTitle = "Select A Plan";
  }

  if (currentView === "resetPasswd") {
    currentTitle = "Reset Your Password";
  }

  if (
    currentFormStep &&
    currentFormStep === "signup-step2" &&
    currentView === "pickPlan"
  ) {
    currentTitle = "Select A Payment Method";
  }

  if (
    currentFormStep &&
    currentFormStep === "signup-step3" &&
    currentView === "pickPlan"
  ) {
    currentTitle = "Thank You";
  }

  return (
    <div className="modal modal-active fixed w-full h-full top-0 left-0 flex items-center justify-center text-gray-900">
      <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-50"></div>

      <div className="modal-container bg-white w-8/12 mx-auto rounded shadow-lg z-50 overflow-y-auto">
        <div className="modal-content py-4 text-left px-6">
          <div className="flex justify-between items-center pb-3">
            <p className="text-2xl font-bold text-special-green-dark">
              {currentTitle}
            </p>
            <button
              className="modal-close z-50 focus:outline-none"
              onClick={() =>
                dispatch({
                  type: CLOSE_MODAL
                })
              }
            >
              <svg
                className="fill-current text-black"
                width="18"
                height="18"
                viewBox="0 0 18 18"
              >
                <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
              </svg>
            </button>
          </div>

          {currentView === "login" && <Login changeView={changeView} />}
          {currentView === "signup" && (
            <Signup changeView={changeView} changeFormStep={changeFormStep} />
          )}
          {currentView === "pickPlan" && (
            <PickPan changeView={changeView} changeFormStep={changeFormStep} />
          )}
          {currentView === "resetPasswd" && (
            <ResetPassword changeView={changeView} />
          )}
        </div>
      </div>

      <style jsx>{`
        .modal {
          z-index: 10000;
        }
        .text-special-green-dark {
          color: #007775;
        }
      `}</style>
    </div>
  );
};

export default ModalApp;
