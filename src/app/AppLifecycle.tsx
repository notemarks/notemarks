import React, { useState } from "react";

import App from "./App";
import LoginForm from "./LoginForm";

import { useEffectOnce } from "./utils/react_utils";

import { Settings, StorageSession, isAnyAuthStored, getDefaultSettings } from "./settings";
import { createSimpleRepo } from "./repo";

import * as web_utils from "./utils/web_utils";

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
      console.log("Initial load");

      let locInfo = parseWindowLocation();

      if (locInfo.skipLogin === false) {
        let anyAuthStored = await isAnyAuthStored();
        web_utils.gtagLoginEvent();
        setState({
          mode: "login",
          anyAuthStored: anyAuthStored,
        });
      } else {
        let session = new StorageSession();
        web_utils.gtagDemoEvent();
        setState({
          mode: "app",
          initialSettings: locInfo.settings,
          session: session,
        });
      }
    }
    load();
  });

  switch (state.mode) {
    case "none":
      return null;
    case "login":
      return <LoginForm anyAuthStored={state.anyAuthStored} onLogin={onLogin} />;
    case "app":
      return <App initSettings={state.initialSettings} session={state.session} />;
  }
}

type WindowLocationInfo =
  | {
      skipLogin: false;
    }
  | {
      skipLogin: true;
      settings: Settings;
    };

function parseWindowLocation(): WindowLocationInfo {
  let hash = window.location.hash;
  hash = hash.replace(/^#+/g, "");
  console.log(hash);
  if (hash === "demo-awesome" || hash === "demo-tutorial") {
    let settings = getDefaultSettings();
    settings.repos = [createSimpleRepo("Awesome", "notemarks", hash)];
    return {
      skipLogin: true,
      settings,
    };
  } else {
    return {
      skipLogin: false,
    };
  }
}

export default AppLifecycle;
