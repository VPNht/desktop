import React, { useContext, useState } from "react";
import FormState from "@shopify/react-form-state";
import { useMutation } from "@shopify/react-graphql";
import gql from "graphql-tag";
import { error as errorLog } from "../../helpers/logger";

import Spinner from "./spinner";
import appContext from "../store";
import ElectronStore from "../store/persist";
import { LOGIN } from "../constants/actions";

const serviceGql = gql`
  mutation CreateCustomerMutation($customer: CustomerInput!) {
    createCustomer(customer: $customer) {
      token
    }
  }
`;

export default ({ changeView }) => {
  const [state, dispatch] = useContext(appContext);
  const [isLoading, setLoading] = useState(false);
  const createAccountMutation = useMutation(serviceGql);

  return (
    <>
      <FormState
        validateOnSubmit
        initialValues={{
          email: "",
          password: ""
        }}
        validators={{
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
          const { password, email } = fields;
          setLoading(true);
          try {
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

            if (data && data.createCustomer && data.createCustomer.token) {
              // we have an auth token !!!
              ElectronStore.set("apiToken", data.createCustomer.token);

              // save user and pass
              ElectronStore.set("savePassword", true);
              ElectronStore.set(
                "authConfig",
                Buffer.from(
                  `${email.value}:${password.value}`,
                  "utf8"
                ).toString("base64")
              );

              // dispatch out login state without service
              dispatch({
                type: LOGIN,
                payload: {
                  service: null
                }
              });
            }
            setLoading(false);
          } catch (error) {
            setLoading(false);
            errorLog(error);
            return [error];
          }
        }}
      >
        {({ fields, submit, errors }) => {
          const { password, email } = fields;

          return (
            <form onSubmit={submit} className="px-4">
              {errors && errors.length > 0 && (
                <div
                  className="flex items-center bg-special-green text-white text-xs p-2 mb-2 rounded"
                  role="alert"
                >
                  <p>{errors[0].message}</p>
                </div>
              )}

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  for="email"
                >
                  Email
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="email"
                  type="text"
                  placeholder="Email"
                  value={email.value}
                  onChange={({ currentTarget }) => {
                    email.onChange(currentTarget.value);
                  }}
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  for="password"
                >
                  Password
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  id="password"
                  type="password"
                  value={password.value}
                  placeholder="Password"
                  onChange={({ currentTarget }) => {
                    password.onChange(currentTarget.value);
                  }}
                />
              </div>

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
                  disabled={isLoading}
                  className="modal-close w-40 px-4 bg-special-green p-3 rounded-lg text-white hover:shadow-md focus:outline-none"
                >
                  {isLoading ? (
                    <Spinner className="m-auto w-6 text-white" />
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>
          );
        }}
      </FormState>
      <style jsx>{`
        .bg-special-green {
          background-color: #00a6a3;
        }

        .bg-special-green-dark {
          background-color: #007775;
        }

        .text-special-green-dark {
          color: #007775;
        }
      `}</style>
    </>
  );
};
