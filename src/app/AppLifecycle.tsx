import React, { useState } from "react";

import App from "./App";
import LoginForm from "./LoginForm";

import { useEffectOnce } from "./utils/react_utils";

import { Settings, StorageSession, isAnyAuthStored } from "./settings";

type StateNone = {
  mode: "none";
};

type StateLogin = {
  mode: "login";
  anyAuthStored: boolean;
};

type StateApp = {
  mode: "app";
  initialSettings: Settings;
  session: StorageSession;
};

type State = StateNone | StateLogin | StateApp;

function AppLifecycle() {
  // : React.ReactElement
  console.log("Rendering: AppWrapper");

  let [state, setState] = useState({ mode: "none" } as State);

  const onLogin = (settings: Settings, session: StorageSession) => {
    setState({
      mode: "app",
      initialSettings: settings,
      session: session,
    });
  };

  useEffectOnce(() => {
    async function load() {
      console.log("initial load");
      let anyAuthStored = await isAnyAuthStored();
      setState({
        mode: "login",
        anyAuthStored: anyAuthStored,
      });
    }
    load();
  });

  switch (state.mode) {
    case "none":
      return null;
    case "login":
      return <LoginForm anyAuthStored={state.anyAuthStored} onLogin={onLogin} />;
    case "app":
      return <App initSettings={state.initialSettings} />;
  }
}

export default AppLifecycle;
