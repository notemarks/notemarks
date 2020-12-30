import * as localforage from "localforage";

import { Repos, createDefaultInitializedRepo } from "./repo";

export type EditorSettings = {
  fontSize: number;
  theme: string;
  wordWrap: "off" | "on" | "wordWrapColumn" | "bounded";
  wordWrapColumn: number;
};

export type Settings = {
  repos: Repos;
  editor: EditorSettings;
};

export function getDefaultEditorSettings(): EditorSettings {
  return {
    fontSize: 12,
    theme: "dark",
    wordWrap: "on",
    wordWrapColumn: 100,
  };
}

export function getDefaultSettings(): Settings {
  return {
    repos: [createDefaultInitializedRepo(true)],
    editor: getDefaultEditorSettings(),
  };
}

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

/*
export function getStoredRepos(): Repos {
  let reposEntry = window.localStorage.getItem("repos");
  if (reposEntry != null) {
    return JSON.parse(reposEntry) as Repos;
  } else {
    return [createDefaultInitializedRepo(true)];
  }
}

export function setStoredRepos(repos: Repos) {
  window.localStorage.setItem("repos", JSON.stringify(repos));
}
*/

export function getStoredSettings(): Settings {
  let settings = window.localStorage.getItem("settings");
  if (settings != null) {
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
