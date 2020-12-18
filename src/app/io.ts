import * as yaml from "js-yaml";

import * as date_utils from "./utils/date_utils";

import { ok, err, Result } from "neverthrow";

/*
Types and function used during serialization/deserialization.

This is where we have to care about backwards compatibility.
*/

export type MetaData = {
  labels: string[];
  timeCreated: Date;
  timeUpdated: Date;
};

// ----------------------------------------------------------------------------
// Meta data utils
// ----------------------------------------------------------------------------

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
  let metaData = yaml.safeLoad(content) as MetaData;

  if (metaData == null) {
    return err(new Error("Meta data parsing returned null"));
  } else {
    let labels = Array.isArray(metaData["labels"]) ? (metaData["labels"] as string[]) : undefined;
    let timeCreated =
      typeof metaData["timeCreated"] === "string"
        ? date_utils.stringToDate(metaData["timeCreated"])
        : undefined;
    let timeUpdated =
      typeof metaData["timeUpdated"] === "string"
        ? date_utils.stringToDate(metaData["timeUpdated"])
        : undefined;

    if (labels == null) {
      return err(new Error("Meta data field 'labels' isn't an array."));
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
