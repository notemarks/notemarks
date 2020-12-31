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

export type SettingsWithoutAuth = Omit<Settings, "auth">;

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

type SettingsLoadStatus = {
  deserializationFailed: boolean;
  validationFailed: boolean;
  loadAuthFailed: boolean;
};

type SettingsLoadResult = {
  settings: Settings;
  status: SettingsLoadStatus;
};

export class StorageSession {
  constructor(private key?: CryptoKey) {}

  storeSettings(settings: Settings) {
    if (this.key != null) {
      storeAuth(settings.auth, this.key);
    }

    let settingsClone: any = { ...settings };
    delete settingsClone["auth"];
    window.localStorage.setItem("settings", JSON.stringify(settingsClone));
  }

  async loadSettings(resetAuth: boolean): Promise<SettingsLoadResult> {
    let status: SettingsLoadStatus = {
      deserializationFailed: false,
      validationFailed: false,
      loadAuthFailed: false,
    };
    let settingsWithoutAuth = this.loadNormalSettings(status);
    let authSettings = await this.loadAuthSettings(status, resetAuth);

    let settings: Settings = { ...settingsWithoutAuth, auth: authSettings };

    return { settings, status };
  }

  private loadNormalSettings(status: SettingsLoadStatus): SettingsWithoutAuth {
    let settingsSerialized = window.localStorage.getItem("settings");
    if (settingsSerialized != null) {
      // TODO: We need real validation here
      let settings = JSON.parse(settingsSerialized) as Settings;
      return settings;
    } else {
      status.deserializationFailed = true;
      return getDefaultSettings();
    }
  }

  private async loadAuthSettings(
    status: SettingsLoadStatus,
    resetAuth: boolean
  ): Promise<AuthSettings> {
    if (this.key == null || resetAuth) {
      return {};
    } else {
      let authLoaded = await loadAuth(this.key);
      if (authLoaded != null) {
        return authLoaded;
      } else {
        status.loadAuthFailed = true;
        return {};
      }
    }
  }
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
type Nonce = Uint8Array;

export function generateSalt(): Salt {
  var salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  return salt;
}

export async function getSalt(): Promise<Salt> {
  let salt = (await localforage.getItem("salt")) as Salt | undefined;
  if (salt != null) {
    return salt;
  } else {
    salt = generateSalt();
    await localforage.setItem("salt", salt);
    return salt;
  }
}

function stringToByteArray(s: string): Uint8Array {
  var encoder = new TextEncoder();
  var sEncoded = encoder.encode(s);
  return sEncoded;
}

function arrayBufferToString(a: ArrayBuffer): string {
  var decoder = new TextDecoder();
  var s = decoder.decode(a);
  return s;
}

// ----------------------------------------------------------------------------
// Encryption
// ----------------------------------------------------------------------------

export async function generateKey(password: string, salt: Salt): Promise<CryptoKey> {
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey
  let iterations = 10000;

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
    { name: "AES-GCM", length: 256 },
    // extractable
    false,
    // keyUsages
    ["encrypt", "decrypt"]
  );

  return key;
}

export async function generateKeyFromStoredSalt(password: string): Promise<CryptoKey> {
  let salt = await getSalt();
  return generateKey(password, salt);
}

// ----------------------------------------------------------------------------
// Encryption
// ----------------------------------------------------------------------------

export async function encrypt(data: string, key: CryptoKey): Promise<[Uint8Array, Nonce]> {
  let dataArray = stringToByteArray(data);
  let nonce = crypto.getRandomValues(new Uint8Array(16));
  let alg = { name: "AES-GCM", iv: nonce };
  let dataArrayEncrypted = new Uint8Array(await crypto.subtle.encrypt(alg, key, dataArray));
  return [dataArrayEncrypted, nonce];
}

export async function decrypt(
  dataEncryptedArray: Uint8Array,
  key: CryptoKey,
  nonce: Nonce
): Promise<string | undefined> {
  let alg = { name: "AES-GCM", iv: nonce };
  try {
    let dataArray = await crypto.subtle.decrypt(alg, key, dataEncryptedArray);
    return arrayBufferToString(dataArray);
  } catch {
    return undefined;
  }
}

export async function storeAuth(auth: AuthSettings, key: CryptoKey) {
  let authSerialized = JSON.stringify(auth);
  let [authData, authNonce] = await encrypt(authSerialized, key);
  await localforage.setItem("auth_data", authData);
  await localforage.setItem("auth_nonce", authNonce);
}

export async function loadAuth(key: CryptoKey): Promise<AuthSettings | undefined> {
  let authData = (await localforage.getItem("auth_data")) as Uint8Array | undefined;
  let authNonce = (await localforage.getItem("auth_nonce")) as Nonce | undefined;
  if (authData != null && authNonce != null) {
    let authSerialized = await decrypt(authData, key, authNonce);
    if (authSerialized != null) {
      return JSON.parse(authSerialized) as AuthSettings;
    }
  }
}

export async function isAnyAuthStored(): Promise<boolean> {
  let authData = (await localforage.getItem("auth_data")) as Uint8Array | undefined;
  let authNonce = (await localforage.getItem("auth_nonce")) as Nonce | undefined;
  return authData != null && authNonce != null;
}
