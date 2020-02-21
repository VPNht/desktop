import React, { useEffect } from "react";
import { useMutation } from "@shopify/react-graphql";
import gql from "graphql-tag";
import { LOGIN } from "../constants/actions";

import Loading from "./loading";
import rpc from "../rpc";

const serviceGql = gql`
  mutation ServiceMutation {
    service {
      id
      username
      password
    }
  }
`;

const PleaseWait = ({ isWaiting, invoiceUrl }) => {
  const getServiceDetails = useMutation(serviceGql);

  const openInvoice = () => {
    rpc.emit("open url", invoiceUrl);
  };

  const checkService = async () => {
    try {
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
    }
  };

  useEffect(() => {
    if (invoiceUrl) {
      // open the invoice
      openInvoice();

      // we should set a timer who check every 30 sec
      // if we have a service from graphql
      // once we have it we simply emit the login with service details
      const timer = setInterval(() => checkService(), 30000);

      // clear timeout on unmount
      return () => clearInterval(timer);
    }
  }, [invoiceUrl]);

  if (isWaiting) {
    return <Loading height="100px" color="#4a5568" />;
  }
  return (
    <div>
      <div className="flex items-center">
        <p>Invoice created successfuly.</p>
        <button
          onClick={() => openInvoice()}
          className="ml-4 bg-gray-100 border-gray-800 text-gray-800 font-bold py-1 px-2 rounded-md focus:outline-none"
        >
          Open
        </button>
      </div>
      <p>A copy has been sent to your email.</p>
    </div>
  );
};

export default PleaseWait;
