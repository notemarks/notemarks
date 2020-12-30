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
  let settingsClone: any = { ...settings };
  delete settingsClone["auth"];
  window.localStorage.setItem("settings", JSON.stringify(settingsClone));
}

export function clearAllStorage() {
  localforage.clear();
  for (let key in window.localStorage) {
    delete window.localStorage[key];
  }
}

// ----------------------------------------------------------------------------
// Crypto helpers
// ----------------------------------------------------------------------------

type Salt = Uint8Array;

export async function encrypt(data: string) {
  //let digest = await crypto.subtle.digest("SHA-256", data);
}

export function generateSalt(): Salt {
  var salt = new Uint8Array(8);
  window.crypto.getRandomValues(salt);
  return salt;
}

/*
export async function deriveKey(pw: string, salt: Salt) {
  //let digest = await crypto.subtle.digest("SHA-256", data);

  let alg = { name: "HMAC", hash: "SHA-256" };
  let usages = ["sign", "verify"];
  let key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: 10000 },
    pw,
    alg,
    false,
    usages
  );
}
*/

/*
export function retrievePWKey() {
  var usages = ["deriveKey"];
  return crypto.subtle.generateKey("PBKDF2", false, usages);
}
*/

function stringToByteArray(s: string): Uint8Array {
  var encoder = new TextEncoder();
  var sEncoded = encoder.encode(s);
  return sEncoded;
}

export async function generateKey(password: string, salt: Salt): Promise<CryptoKey> {
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey
  let iterations = 1000;

  let keyOrig = await window.crypto.subtle.importKey(
    "raw",
    stringToByteArray(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  let key = await window.crypto.subtle.deriveKey(
    // algorithm
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    // baseKey
    keyOrig,
    // derivedKeyAlgorithm
    { name: "AES-CBC", length: 256 },
    // extractable
    true,
    // keyUsages
    ["encrypt", "decrypt"]
  );

  return key;
}
