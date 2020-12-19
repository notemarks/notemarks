import * as yaml from "js-yaml";

import * as date_utils from "./utils/date_utils";

import { ok, err, Result } from "neverthrow";

/*
Types and function used during serialization/deserialization.

This is where we have to care about backwards compatibility.
*/

// ----------------------------------------------------------------------------
// Meta data
// ----------------------------------------------------------------------------

export type MetaData = {
  labels: string[];
  timeCreated: Date;
  timeUpdated: Date;
};

export function createNewMetaData(): MetaData {
  let date = new Date();
  date.setMilliseconds(0);
  return {
    labels: [],
    timeCreated: date,
    timeUpdated: date,
  };
}

export function parseMetaData(content: string): Result<MetaData, Error> {
  let data: any;
  try {
    data = yaml.safeLoad(content) as any;
  } catch (e) {
    return err(e);
  }

  if (typeof data !== "object") {
    return err(new Error("Meta data isn't an object."));
  } else {
    let labels = extractArrayOfString(data["labels"]);
    let timeCreated = extractDate(data["timeCreated"]);
    let timeUpdated = extractDate(data["timeUpdated"]);

    if (labels == null) {
      return err(new Error("Meta data field 'labels' isn't an string array."));
    } else if (timeCreated == null) {
      return err(new Error("Meta data field 'timeCreated' cannot be parsed."));
    } else if (timeUpdated == null) {
      return err(new Error("Meta data field 'timeUpdated' cannot be parsed."));
    } else {
      return ok({
        labels: labels,
        timeCreated: timeCreated,
        timeUpdated: timeUpdated,
      });
    }
  }
}

export function serializeMetaData(data: MetaData): string {
  return yaml.safeDump({
    labels: data.labels,
    timeCreated: date_utils.dateToString(data.timeCreated),
    timeUpdated: date_utils.dateToString(data.timeUpdated),
  });
}

// ----------------------------------------------------------------------------
// Link data
// ----------------------------------------------------------------------------

export type StoredLink = {
  title: string;
  target: string;
  standalone: boolean;
  ownLabels: string[];
};

export type StoredLinks = StoredLink[];

export function parseStoredLinks(content: string): Result<StoredLinks, Error> {
  let data: any;
  try {
    data = yaml.safeLoad(content) as any;
  } catch (e) {
    return err(e);
  }

  if (data == null) {
    return ok([]);
  } else if (typeof data !== "object") {
    return err(new Error("Link data isn't an object."));
  } else {
    // Since no converters are needed in this case a plain validation is sufficient.
    // For now let's do it like that:

    let links = extractArray(data["links"]);
    if (links == null) {
      return err(new Error("Link data field 'links' isn't an array."));
    }

    for (let link of links) {
      let title = extractString(link["title"]);
      let target = extractString(link["target"]);
      let standalone = extractBool(link["standalone"]);
      let ownLabels = extractArrayOfString(link["ownLabels"]);

      if (title == null) {
        return err(new Error("Link data field 'title' isn't an array."));
      } else if (target == null) {
        return err(new Error("Link data field 'target' cannot be parsed."));
      } else if (standalone == null) {
        return err(new Error("Link data field 'standalone' cannot be parsed."));
      } else if (ownLabels == null) {
        return err(new Error("Link data field 'ownLabels' cannot be parsed."));
      }
    }
    return ok(links as StoredLink[]);
  }
}

// ----------------------------------------------------------------------------
// Parse utils
// ----------------------------------------------------------------------------

export function extractString(obj: any | undefined): string | undefined {
  if (typeof obj === "string") {
    return obj as string;
  }
}

export function extractBool(obj: any | undefined): boolean | undefined {
  if (typeof obj === "boolean") {
    return obj as boolean;
  }
}

export function extractDate(obj: any | undefined): Date | undefined {
  if (typeof obj === "string") {
    return date_utils.stringToDate(obj);
  }
}

export function extractArray(obj: any | undefined): any[] | undefined {
  if (Array.isArray(obj)) {
    return obj as any[];
  }
}

export function extractArrayOfString(obj: any | undefined): string[] | undefined {
  if (Array.isArray(obj) && obj.every((x) => typeof x === "string")) {
    return obj as string[];
  }
}
