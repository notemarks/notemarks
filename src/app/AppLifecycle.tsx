import React from "react";

import App from "./App";

import { useEffectOnce } from "./utils/react_utils";

import { loadSettings, getSalt } from "./settings";

function AppLifecycle() {
  console.log("Rendering: AppWrapper");
  let initSettings = loadSettings();

  useEffectOnce(() => {
    async function load() {
      let salt = await getSalt();
      console.log("salt result:", salt);
    }
    load();
  });

  return <App initSettings={initSettings} />;
}

export default AppLifecycle;
