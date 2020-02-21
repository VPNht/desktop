import React, { useContext, useEffect, useState } from "react";
import { useMutation } from "@shopify/react-graphql";
import gql from "graphql-tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt } from "@fortawesome/free-solid-svg-icons";

import { LOGIN } from "../constants/actions";

import Plan from "./plan";
import Payments from "./payments";
import PleaseWaitPayment from "./pleaseWait";
import appContext from "../store";
import { error as errorLog } from "../../helpers/logger";

const subGql = gql`
  mutation SubscriptionMutation($subscription: SubscriptionCustInput!) {
    createSubscriptionCust(subscription: $subscription) {
      url
    }
  }
`;

const serviceGql = gql`
  mutation ServiceMutation {
    service {
      id
      username
      password
    }
  }
`;

export default ({ changeView, changeFormStep }) => {
  const [state, dispatch] = useContext(appContext);
  const [isWaiting, setWaiting] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(false);
  // step1 or step2
  const [formView, changeFormView] = useState("step1");
  // MONTHLY or ANNUALLY
  const [plan, selectPlan] = useState(null);
  // payment mwethod
  const [processor, selectProcessor] = useState(null);
  const createSubscriptionMutation = useMutation(subGql);
  const getServiceDetails = useMutation(serviceGql);
  const [checkingService, setCheckingService] = useState(false);

  useEffect(() => {
    if (formView) {
      changeFormStep(`signup-${formView}`);
    }
  }, [formView]);

  useEffect(() => {
    if (plan) {
      changeFormView("step2");
    }
  }, [plan]);

  useEffect(() => {
    if (processor) {
      createSubscription();
      changeFormView("step3");
    }
  }, [processor]);

  const checkService = async () => {
    try {
      setCheckingService(true);
      const serviceDetails = await getServiceDetails();
      if (
        serviceDetails &&
        serviceDetails.data &&
        serviceDetails.data.service
      ) {
        dispatch({
          type: LOGIN,
          payload: {
            service: serviceDetails.data.service
          }
        });
      }
    } catch (error) {
      errorLog(error);
    } finally {
      setCheckingService(false);
    }
  };

  const createSubscription = async () => {
    setWaiting(true);
    try {
      const { data } = await createSubscriptionMutation({
        variables: {
          subscription: {
            plan,
            processor
          }
        }
      });

      if (
        data &&
        data.createSubscriptionCust &&
        data.createSubscriptionCust.url
      ) {
        setWaiting(false);
        setInvoiceUrl(data.createSubscriptionCust.url);
      }
    } catch (error) {
      errorLog(error);
    }

    setWaiting(false);
  };

  const updatePlan = plan => {
    selectPlan(plan);
  };

  const updateProcessor = async processor => {
    selectProcessor(processor);
  };

  return (
    <>
      <div className="formContainer">
        {formView === "step1" && (
          <>
            <div className="flex justify-center">
              <Plan
                type="MONTHLY"
                onClick={() => {
                  updatePlan("MONTHLY");
                }}
              />
              <Plan
                type="ANNUALLY"
                onClick={() => {
                  updatePlan("ANNUALLY");
                }}
              />
            </div>

            <div className="pt-2 text-xs text-center text-gray-700 flex justify-center">
              <div>
                <FontAwesomeIcon
                  spin={checkingService}
                  className="mr-2 w-4 text-gray-500"
                  icon={faSyncAlt}
                />
              </div>
              <button
                onClick={() => checkService()}
                className="focus:outline-none"
              >
                Already purchased a plan?
              </button>
            </div>
          </>
        )}

        {formView === "step2" && <Payments selectProcessor={updateProcessor} />}

        {formView === "step3" && (
          <PleaseWaitPayment isWaiting={isWaiting} invoiceUrl={invoiceUrl} />
        )}
      </div>

      <style jsx>{`
        .formContainer {
          margin-top: 10px;
          width: 100%;
          padding: 30px;
        }

        .bg-special-green {
          background-color: #00a6a3;
        }

        .bg-special-green-dark {
          background-color: #007775;
        }

        .text-special-green-dark {
          color: #007775;
        }

        .input {
          margin-bottom: 10px;
          display: block;
          width: 100%;
          height: 34px;
          padding: 20px 12px;
          font-size: 16px;
          font-size: bold;
          color: #fff;
          background-color: #00a6a3;
          background-image: none;
          border: none;
          border-radius: 4px;
        }

        .input:focus {
          outline: none;
        }

        .input::placeholder {
          color: rgb(255, 255, 255, 0.5);
        }

        .select {
          margin-bottom: 10px;
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: #444;
          line-height: 1.3;
          padding: 0.6em 1.4em 0.5em 0.8em;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          border: 1px solid #aaa;
          box-shadow: 0 1px 0 1px rgba(0, 0, 0, 0.04);
          border-radius: 0.5em;
          -moz-appearance: none;
          -webkit-appearance: none;
          appearance: none;
          background-color: #fff;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007775%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"),
            linear-gradient(to bottom, #ffffff 0%, #e5e5e5 100%);
          background-repeat: no-repeat, repeat;
          background-position: right 0.7em top 50%, 0 0;
          background-size: 0.65em auto, 100%;
        }
        .select::-ms-expand {
          display: none;
        }
        .select:hover {
          border-color: #888;
        }
        .select:focus {
          border-color: #aaa;
          box-shadow: 0 0 1px 3px rgba(59, 153, 252, 0.7);
          box-shadow: 0 0 0 3px -moz-mac-focusring;
          color: #222;
          outline: none;
        }
        .select option {
          font-weight: normal;
        }

        .button {
          width: 100%;
          background: #fff;
          border: none;
          font-weight: bold;
          font-size: 25px;
          padding: 20px;
          border-radius: 5px;
          color: #007775;
          cursor: pointer;
        }

        .button:hover {
          color: #000;
        }

        .button:focus {
          outline: none;
        }

        .banner {
          margin: 10px 0;
          padding: 5px;
          border-radius: 5px;
          background: #fff8e1;
          color: #00a6a3;
        }

        .checkboxIcon {
          stroke: #00a6a3;
          fill: #00a6a3;
        }

        .pretty {
          font-size: 17px;
        }

        .pretty .state label:before {
          border-color: red;
          border: 2px solid #00a6a3;
          border-radius: 5px;
        }

        .state label {
          color: #00a6a3;
        }
        .savePassword {
          margin-bottom: 30px;
        }
      `}</style>
    </>
  );
};
