import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCcPaypal,
  faBitcoin,
  faCcMastercard,
  faCcVisa,
  faCcAmex
} from "@fortawesome/free-brands-svg-icons";

const PaymentMethod = ({ icon, text, onClick }) => {
  return (
    <article className="border-b">
      <div className="hover:bg-gray-100" onClick={onClick}>
        <header className="flex justify-between items-center p-5 pl-8 pr-8 cursor-pointer select-none">
          <div className="flex">
            <FontAwesomeIcon
              className="mr-3"
              icon={icon}
              color="#718096"
              size="2x"
            />

            <span className="text-gray-900 font-thin text-xl">{text}</span>
          </div>
        </header>
      </div>
    </article>
  );
};

const Payments = ({ selectProcessor }) => {
  return (
    <section className="shadow">
      <PaymentMethod
        key="paypalMethod"
        icon={faCcPaypal}
        text="Paypal"
        onClick={() => {
          selectProcessor("PAYPAL");
        }}
      />
      <PaymentMethod
        key="ccMethod"
        icon={faCcMastercard}
        text="Credit Card"
        onClick={() => {
          selectProcessor("PAYMENTWALL");
        }}
      />
      <PaymentMethod
        key="btcMethod"
        icon={faBitcoin}
        text="Bitcoin"
        onClick={() => {
          selectProcessor("CRYPTO");
        }}
      />
    </section>
  );
};

export default Payments;
