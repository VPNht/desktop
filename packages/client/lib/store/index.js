import React from "react";

const appContext = React.createContext({});

export const Provider = appContext.Provider;
export const Consumer = appContext.Consumer;
export default appContext;
