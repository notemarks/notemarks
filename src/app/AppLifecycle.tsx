import React, { useState } from "react";

import App from "./App";

import { useEffectOnce } from "./utils/react_utils";

import { loadSettings, getSalt } from "./settings";

function AppLifecycle(): React.ReactElement {
  console.log("Rendering: AppWrapper");

  let [app, setApp] = useState(null as React.ReactNode);

  useEffectOnce(() => {
    async function load() {
      console.log("initial load");
      let initSettings = await loadSettings();
      //let salt = await getSalt();
      setApp(<App initSettings={initSettings} />);
    }
    load();
  });

  return <>{app}</>;
}

export default AppLifecycle;
