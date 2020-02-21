import React, { useState } from "react";
import FormState from "@shopify/react-form-state";
import { useMutation } from "@shopify/react-graphql";
import gql from "graphql-tag";

import Spinner from "./spinner";
import Connecting from "./connecting";
import ElectronStore from "../store/persist";
import appContext from "../store";

import { LOGIN } from "../constants/actions";
import { info, error as errorLog } from "../../helpers/logger";

const passwdGql = gql`
  mutation ChangePasswordMutation($email: String!) {
    changePassword(email: $email)
  }
`;

export default ({ changeView }) => {
  const [isLoading, setLoading] = useState(false);
  const newPasswordMutation = useMutation(passwdGql);

  return (
    <>
      <FormState
        validateOnSubmit
        initialValues={{
          email: ""
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
          }
        }}
        onSubmit={async ({ fields }) => {
          try {
            setLoading(true);
            info("Request new password...");

            await newPasswordMutation({
              variables: {
                email: fields.email.value
              }
            });

            return {
              message:
                "A message has been sent with a link to reset your password"
            };
          } catch (error) {
            console.log(error);
            if (error.graphQLErrors) {
              errorLog(error.graphQLErrors[0]);
              return error.graphQLErrors[0];
            }
            errorLog("Unable to request new password");
            return { message: "Unable to request password, try later." };
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ fields, submit, errors }) => {
          const { email } = fields;

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

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    changeView("login");
                  }}
                  className="px-4 w-40 bg-transparent p-3 rounded-lg hover:bg-gray-100 text-special-green-dark mr-2 focus:outline-none"
                >
                  Login
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="modal-close w-32 px-4 bg-special-green p-3 rounded-lg text-white hover:shadow-md focus:outline-none"
                >
                  {isLoading ? (
                    <Spinner className="m-auto w-6 text-white" />
                  ) : (
                    "Reset"
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
