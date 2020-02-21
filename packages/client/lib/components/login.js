import React, { useContext, useState } from "react";
import FormState from "@shopify/react-form-state";
import { useMutation } from "@shopify/react-graphql";
import gql from "graphql-tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLifeRing } from "@fortawesome/free-solid-svg-icons";

import Spinner from "./spinner";
import Connecting from "./connecting";
import ElectronStore from "../store/persist";
import appContext from "../store";

import { LOGIN } from "../constants/actions";
import { info, error as errorLog } from "../../helpers/logger";

const loginGql = gql`
  mutation LoginMutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
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

export default ({ changeView }) => {
  const [state, dispatch] = useContext(appContext);
  const [isLogin, setLogin] = useState(false);
  const login = useMutation(loginGql);
  const getServiceDetails = useMutation(serviceGql);
  const checkService = async () => {
    try {
      // check if we have an active service
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
      } else {
        dispatch({
          type: LOGIN,
          payload: {
            service: null
          }
        });
      }
    } catch (error) {
      errorLog(error);
    }
  };

  const authConfig = ElectronStore.get("authConfig") || null;

  let username = "";
  let password = "";

  const savePassword = ElectronStore.get("savePassword") || false;

  if (authConfig && savePassword) {
    [username, password] = Buffer.from(authConfig, "base64")
      .toString()
      .split(/:(.+)?/)
      .slice(0, 2);
  }

  return (
    <>
      <FormState
        initialValues={{
          username,
          password,
          savePassword
        }}
        onSubmit={async ({ fields }) => {
          try {
            setLogin(true);
            info("Trying to authentificate...");
            if (fields.savePassword.value) {
              info("Save password");
              ElectronStore.set(
                "authConfig",
                Buffer.from(
                  `${fields.username.value}:${fields.password.value}`,
                  "utf8"
                ).toString("base64")
              );
            } else {
              ElectronStore.set("authConfig", null);
            }

            const loginInfo = await login({
              variables: {
                email: fields.username.value,
                password: fields.password.value
              }
            });
            if (loginInfo && loginInfo.data && loginInfo.data.login) {
              ElectronStore.set("apiToken", loginInfo.data.login.token);
              try {
                await checkService();
              } catch (error) {
                errorLog(error);
                setLogin(false);
                return {
                  message:
                    error && error.message
                      ? error.message
                      : "Please contact support with error code: 0002"
                };
              }
            } else {
              setLogin(false);
              return {
                message: "Please contact support with error code: 0001"
              };
            }
          } catch (error) {
            setLogin(false);
            if (error.graphQLErrors) {
              console.log(error.graphQLErrors[0]);
              errorLog(error.graphQLErrors[0]);
              return error.graphQLErrors[0];
            }
            errorLog("Unable to login");
            return { message: "Unable to login, try again later." };
          }
        }}
      >
        {({ fields, submit, errors }) => {
          const { username, password, savePassword } = fields;

          return (
            <form onSubmit={submit} className="px-4">
              {state.isConnecting ? (
                <Connecting />
              ) : (
                <>
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
                      for="username"
                    >
                      Email
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="username"
                      type="text"
                      placeholder="Email"
                      value={username.value}
                      onChange={({ currentTarget }) => {
                        username.onChange(currentTarget.value);
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <div className="flex mb-2 text-gray-700">
                      <label className="font-bold text-sm" for="password">
                        Password
                      </label>
                      <button
                        onClick={() => {
                          changeView("resetPasswd");
                        }}
                        type="button"
                        className="ml-auto text-xs focus:outline-none"
                      >
                        <FontAwesomeIcon
                          className="mr-1 w-4 text-gray-700"
                          icon={faLifeRing}
                        />
                        Reset
                      </button>
                    </div>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password.value}
                      onChange={({ currentTarget }) => {
                        password.onChange(currentTarget.value);
                      }}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        changeView("signup");
                      }}
                      className="px-4 w-40 bg-transparent p-3 rounded-lg hover:bg-gray-100 text-special-green-dark mr-2 focus:outline-none"
                    >
                      Create account
                    </button>
                    <button
                      type="submit"
                      disabled={isLogin}
                      className="modal-close w-32 px-4 bg-special-green p-3 rounded-lg text-white hover:shadow-md focus:outline-none"
                    >
                      {isLogin ? (
                        <Spinner className="m-auto w-6 text-white" />
                      ) : (
                        "Login"
                      )}
                    </button>
                  </div>
                </>
              )}
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
