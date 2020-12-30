import * as localforage from "localforage";

import { Repos, createDefaultInitializedRepo } from "./repo";

export type AuthSettings = {
  tokenGitHub?: string;
};

export type EditorSettings = {
  fontSize: number;
  theme: "dark" | "light";
  wordWrap: "off" | "on" | "wordWrapColumn" | "bounded";
  wordWrapColumn: number;
};

export type Settings = {
  repos: Repos;
  auth: AuthSettings;
  editor: EditorSettings;
};

export function getDefaultEditorSettings(): EditorSettings {
  return {
    fontSize: 12,
    theme: "dark",
    wordWrap: "bounded",
    wordWrapColumn: 100,
  };
}

export function getDefaultSettings(): Settings {
  return {
    repos: [createDefaultInitializedRepo(true)],
    auth: {},
    editor: getDefaultEditorSettings(),
  };
}

/*
Possible future settings:

General settings:
  - number of visible rows in list view
  - whether to count links in label counts. Although: If we make the label count update dynamic,
    this wouldn't be needed. Dynamic would definitely be cooler.
*/

// ----------------------------------------------------------------------------
// Settings reducer (trivial for now)
// ----------------------------------------------------------------------------

export type SettingsAction = Partial<Settings>;

export function settingsReducer(state: Settings, action: SettingsAction): Settings {
  return { ...state, ...action };
}

// ----------------------------------------------------------------------------
// Storage I/O
// ----------------------------------------------------------------------------

export function getStoredSettings(): Settings {
  let settings = window.localStorage.getItem("settings");
  if (settings != null) {
    // TODO: We need real validation here
    return JSON.parse(settings) as Settings;
  } else {
    return getDefaultSettings();
  }
}

export function setStoredSettings(settings: Settings) {
  window.localStorage.setItem("settings", JSON.stringify(settings));
}

export function clearAllStorage() {
  localforage.clear();
  for (let key in window.localStorage) {
    delete window.localStorage[key];
  }
}
