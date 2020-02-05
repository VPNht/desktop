import React, { useContext, useEffect, useState } from "react";
import FormState from "@shopify/react-form-state";
import { useMutation } from "@shopify/react-graphql";
import gql from "graphql-tag";

import Loading from "./loading";
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

export default () => {
  const [state, dispatch] = useContext(appContext);
  const [isReady, setIsReady] = useState(false);
  const [isLogin, setLogin] = useState(false);
  const login = useMutation(loginGql);
  const getServiceDetails = useMutation(serviceGql);
  const checkService = async (fromEffect = false) => {
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
      } else {
        setIsReady(true);
        if (fromEffect) {
          return;
        }
        throw new Error("NO_VPN");
      }
    } catch (error) {
      if (error && error.message === "NO_VPN") {
        throw new Error("No active VPN account found");
      }
      errorLog(error);
      setIsReady(true);
    }
  };

  useEffect(() => {
    try {
      checkService(true);
    } catch (error) {
      errorLog(error);
    }
  }, []);

  const authConfig = ElectronStore.get("authConfig") || null;

  let username = "";
  let password = "";

  const savePassword = ElectronStore.get("savePassword") || false;

  if (!isReady) {
    return <Loading />;
  }

  if (authConfig && savePassword) {
    [username, password] = new Buffer(authConfig, "base64")
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
                new Buffer(
                  `${fields.username.value}:${fields.password.value}`
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
            <form onSubmit={submit}>
              {state.isConnecting ? (
                <Connecting />
              ) : (
                <>
                  <div className="formContainer">
                    <div className="bannerContainer">
                      {errors && errors.length > 0 && (
                        <div className="banner">{errors[0].message}</div>
                      )}
                    </div>

                    <input
                      id={username.name}
                      key={username.name}
                      className="input"
                      type="text"
                      placeholder="Username or email"
                      value={username.value}
                      onChange={({ currentTarget }) => {
                        username.onChange(currentTarget.value);
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
                    <div className="savePassword pretty p-svg p-toggle ">
                      <input
                        id={savePassword.name}
                        key={savePassword.name}
                        type="checkbox"
                        defaultChecked={savePassword.value}
                        onChange={() => {
                          if (!savePassword.value) {
                            ElectronStore.set("savePassword", true);
                          } else {
                            ElectronStore.set("savePassword", false);
                          }
                          savePassword.onChange(!savePassword.value);
                        }}
                      />
                      <div className="state p-on">
                        <svg viewBox="0 0 20 20" className="svg svg-icon">
                          <path
                            d="M7.293 14.707l-3-3a.999.999 0 1 1 1.414-1.414l2.236 2.236 6.298-7.18a.999.999 0 1 1 1.518 1.3l-7 8a1 1 0 0 1-.72.35 1.017 1.017 0 0 1-.746-.292z"
                            className="checkboxIcon"
                          />
                        </svg>

                        <label htmlFor="savePassword">
                          Remember username and password
                        </label>
                      </div>
                      <div className="state p-off">
                        <svg viewBox="0 0 20 20" className="svg svg-icon">
                          <path
                            d="M11.414 10l4.293-4.293a.999.999 0 1 0-1.414-1.414L10 8.586 5.707 4.293a.999.999 0 1 0-1.414 1.414L8.586 10l-4.293 4.293a.999.999 0 1 0 1.414 1.414L10 11.414l4.293 4.293a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414L11.414 10z"
                            className="checkboxIcon"
                          />
                        </svg>

                        <label htmlFor="savePassword">
                          Remember username and password
                        </label>
                      </div>
                    </div>
                    <button className="button" type="submit" disabled={isLogin}>
                      {isLogin ? "Please wait..." : "Login"}
                    </button>
                  </div>
                </>
              )}
            </form>
          );
        }}
      </FormState>
      <style jsx>{`
        .formContainer {
          margin-top: 10px;
          width: 100%;
          padding: 30px;
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
          background-color: #007775;
          background-image: none;
          border: none;
          border-radius: 4px;
        }

        .input:focus {
          outline: none;
        }

        .input::placeholder {
          color: rgb(255, 255, 255, 0.2);
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
          color: #007775;
        }

        .checkboxIcon {
          stroke: #007775;
          fill: #007775;
        }

        .pretty {
          font-size: 17px;
        }

        .pretty .state label:before {
          border-color: red;
          border: 2px solid #007775;
          border-radius: 5px;
        }

        .state label {
          color: #007775;
        }
        .savePassword {
          margin-bottom: 30px;
        }
      `}</style>
    </>
  );
};
