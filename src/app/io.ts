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
  let date = date_utils.getDateNow();
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
    let links = extractArray(data["links"]);
    if (links == null) {
      return err(new Error("Link data field 'links' isn't an array."));
    }

    for (let link of links) {
      // Mandatory fields
      let title = extractString(link["title"]);
      let target = extractString(link["target"]);

      if (title == null) {
        return err(new Error("Link data field 'title' isn't a string."));
      } else if (target == null) {
        return err(new Error("Link data field 'target' isn't a string."));
      }

      // Optional fields
      if ("standalone" in link) {
        let standalone = extractBool(link["standalone"]);
        if (standalone == null) {
          return err(new Error("Link data field 'standalone' isn't a boolean."));
        }
      } else {
        link["standalone"] = false;
      }

      if ("ownLabels" in link) {
        let ownLabels = extractArrayOfString(link["ownLabels"]);
        if (ownLabels == null) {
          return err(new Error("Link data field 'ownLabels' isn't an array of string."));
        }
      } else {
        link["ownLabels"] = [];
      }
    }
    return ok(links as StoredLink[]);
  }
}

export function serializeStoredLinks(storedLinks: StoredLinks): string {
  storedLinks = [...storedLinks].sort((a, b) => a.target.localeCompare(b.target));
  // Reasons not to use the generic YAML serialization:
  // - Doesn't allow (easily / at all?) to drop properties for maximally concise representation.
  // - Max line length behavior not needed in our use case (unnecessary overhead)
  // - Due to genericity, it is a bit slow.
  // return yaml.safeDump({ links: data });
  let components = ["links:"];
  if (storedLinks.length === 0) {
    components.push("  []");
  } else {
    for (let storedLink of storedLinks) {
      components.push("  - title: " + JSON.stringify(storedLink.title));
      components.push("    target: " + JSON.stringify(storedLink.target));
      if (storedLink.standalone) {
        components.push("    standalone: true");
      }
      if (storedLink.ownLabels.length > 0) {
        components.push("    ownLabels: " + JSON.stringify(storedLink.ownLabels));
      }
    }
  }
  components.push(""); // To enforce final newline
  return components.join("\n");
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
