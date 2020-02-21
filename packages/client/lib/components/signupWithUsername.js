import React, { useContext, useEffect, useState } from "react";
import FormState, { validate } from "@shopify/react-form-state";
import { useMutation } from "@shopify/react-graphql";
import gql from "graphql-tag";
import { error as errorLog } from "../../helpers/logger";

import Spinner from "./spinner";
import appContext from "../store";

import { checkUsername } from "../../helpers/usernames";

const serviceGql = gql`
  mutation CreateCustomerMutation($customer: CustomerInput!) {
    createCustomer(customer: $customer) {
      firstname
      lastname
      email
      password
      country
    }
  }
`;

export default ({ changeView }) => {
  const [state, dispatch] = useContext(appContext);
  const [isLogin, setLogin] = useState(false);
  const [usernameTimer, setUsernameTimer] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);
  const createAccountMutation = useMutation(serviceGql);

  const validateUsername = username => {
    try {
      setUsernameValid(false);
      if (usernameTimer) {
        clearTimeout(usernameTimer);
      }
      const timer = setTimeout(async () => {
        const isValid = await checkUsername(username);
        if (isValid && isValid.valid) {
          setUsernameValid(true);
        }
        setUsernameTimer(null);
      }, 100);

      setUsernameTimer(timer);
    } catch (error) {
      errorLog(error);
    }
  };

  return (
    <>
      <FormState
        validateOnSubmit
        initialValues={{
          email: "",
          username: "",
          password: ""
        }}
        validators={{
          username(input) {
            if (input === "") {
              return "Username can't be blank";
            }
            if (input.length <= 4) {
              return "Username require 5 characters minumum";
            }
            return null;
          },
          email(input) {
            if (!/\S+@\S+\.\S+/.test(input)) {
              return "Invalid e-mail";
            }
            if (input === "") {
              return "E-mail can't be blank";
            }
            return null;
          },
          password(input) {
            if (input === "") {
              return "Password can't be blank";
            }
            if (input.length <= 5) {
              return "Password require 6 characters minumum";
            }
            return null;
          }
        }}
        onSubmit={async ({ fields }) => {
          if (!usernameValid) {
            return [new Error("Invalid username")];
          }

          const { username, password, email } = fields;

          const { data } = await createAccountMutation({
            variables: {
              customer: {
                firstname: "Anonymous",
                lastname: "Customer",
                email: email.value,
                password: password.value,
                country: "US"
              }
            }
          });

          console.log("create account");
        }}
      >
        {({ fields, submit, errors }) => {
          const { username, password, email } = fields;

          console.log({ usernameValid, username, usernameTimer });

          return (
            <form onSubmit={submit}>
              <div className="formContainer">
                <div className="bannerContainer">
                  {errors && errors.length > 0 ? (
                    <div className="banner">{errors[0].message}</div>
                  ) : !usernameValid && username.value.length > 0 ? (
                    <div className="banner">Invalid username</div>
                  ) : (
                    <div />
                  )}
                </div>
                <input
                  id={username.name}
                  key={username.name}
                  className="input"
                  type="text"
                  placeholder="Username"
                  value={username.value}
                  onChange={({ currentTarget }) => {
                    setUsernameValid(false);
                    username.onChange(currentTarget.value);
                  }}
                  onBlur={({ currentTarget }) => {
                    console.log({ currentTarget: currentTarget.value });
                    validateUsername(currentTarget.value);
                  }}
                />
                <input
                  id={email.name}
                  key={email.name}
                  className="input"
                  type="text"
                  placeholder="Email"
                  value={email.value}
                  onChange={({ currentTarget }) => {
                    email.onChange(currentTarget.value);
                  }}
                />
                <input
                  id={password.name}
                  key={password.name}
                  className="input"
                  placeholder="Password"
                  type="password"
                  value={password.value}
                  onChange={({ currentTarget }) => {
                    password.onChange(currentTarget.value);
                  }}
                />

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      changeView("login");
                    }}
                    className="px-4 w-32 bg-transparent p-3 rounded-lg hover:bg-gray-100 text-special-green-dark mr-2 focus:outline-none"
                  >
                    Login
                  </button>
                  <button
                    type="submit"
                    disabled={isLogin}
                    className="modal-close w-40 px-4 bg-special-green p-3 rounded-lg text-white hover:shadow-md focus:outline-none"
                  >
                    {isLogin ? (
                      <Spinner className="m-auto w-6 text-white" />
                    ) : (
                      "Create account"
                    )}
                  </button>
                </div>
              </div>
            </form>
          );
        }}
      </FormState>
      <style jsx>{`
        .formContainer {
          width: 100%;
          padding: 20px;
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
