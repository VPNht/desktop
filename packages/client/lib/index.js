import React, { useReducer } from "react";
import { webFrame } from "electron";
import { render } from "react-dom";
import isDev from "electron-is-dev";

import ApolloClient from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloProvider } from "@shopify/react-graphql";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { HttpLink } from "apollo-link-http";
import { RetryLink } from "apollo-link-retry";
import { Provider } from "./store";
import ElectronStore from "./store/persist";

import { appReducer, initialAppState } from "./reducers/appReducer";
import AppFrame from "./containers/app";

// On Linux, the default zoom was somehow changed with Electron 3 (or maybe 2).
// Setting zoom factor to 1.2 brings back the normal default size
if (process.platform === "linux") {
  webFrame.setZoomFactor(1.2);
}

const initialState = {};

const httpLink = new HttpLink({
  uri: isDev
    ? "http://localhost:8080/graphql"
    : "http://217.23.13.24:8080/graphql"
});

const authLink = setContext((request, { headers }) => {
  const token = ElectronStore.get("apiToken") || null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ""
    }
  };
});

const client = new ApolloClient({
  // Disables forceFetch on the server (so queries are only run once)
  ssrMode: typeof window === "undefined",
  link: ApolloLink.from([new RetryLink(), authLink, httpLink]),
  cache: new InMemoryCache().restore(initialState)
});

const App = () => {
  const useAppState = useReducer(appReducer, initialAppState);
  return (
    <ApolloProvider client={client}>
      <Provider value={useAppState}>
        <AppFrame />
      </Provider>
    </ApolloProvider>
  );
};

render(<App />, document.getElementById("mount"));
