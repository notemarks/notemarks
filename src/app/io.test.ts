import { MetaData, StoredLink } from "./io";
import * as io from "./io";

import * as date_utils from "./utils/date_utils";

// ----------------------------------------------------------------------------
// MetaData
// ----------------------------------------------------------------------------

const META_DATA_1: MetaData = {
  labels: ["foo", "bar"],
  timeCreated: date_utils.stringToDate("2020-12-24T18:30:01")!,
  timeUpdated: date_utils.stringToDate("2020-12-24T19:30:01")!,
};

const META_DATA_1_SERIALIZED = `\
labels:
  - foo
  - bar
timeCreated: '2020-12-24T18:30:01'
timeUpdated: '2020-12-24T19:30:01'
`;

test("serializeMetaData", () => {
  expect(io.serializeMetaData(META_DATA_1)).toEqual(META_DATA_1_SERIALIZED);
});

test("serializeMetaDataRoundtrip", () => {
  expect(io.parseMetaData(io.serializeMetaData(META_DATA_1))._unsafeUnwrap()).toEqual(META_DATA_1);
});

// ----------------------------------------------------------------------------
// StoredLink
// ----------------------------------------------------------------------------

const STORED_LINKS_1: StoredLink[] = [
  {
    title: "title with ' and \"",
    target: "targetC",
    standalone: false,
    ownLabels: [],
  },
  {
    title: "titleB",
    target: "targetB",
    standalone: false,
    ownLabels: [],
  },
  {
    title: "titleA",
    target: "targetA",
    standalone: true,
    ownLabels: ["foo", "bar"],
  },
];

const STORED_LINKS_1_SERIALIZED = `\
links:
  - title: "titleA"
    target: "targetA"
    standalone: true
    ownLabels: ["foo","bar"]
  - title: "titleB"
    target: "targetB"
  - title: "title with ' and \\""
    target: "targetC"
`;

test("parseStoredLinks", () => {
  expect(io.parseStoredLinks("[").isErr()).toEqual(true);
  expect(io.parseStoredLinks("[")._unsafeUnwrapErr()).toEqual(
    expect.objectContaining({
      name: "YAMLException",
    })
  );

  expect(io.parseStoredLinks("").isOk()).toEqual(true);
  expect(io.parseStoredLinks("")._unsafeUnwrap()).toEqual([]);

  expect(io.parseStoredLinks("foo").isErr()).toEqual(true);
  expect(io.parseStoredLinks("[]").isErr()).toEqual(true);
  expect(io.parseStoredLinks("{}").isErr()).toEqual(true); // due to missing links field

  expect(io.parseStoredLinks("{links: []}").isOk()).toEqual(true);
  expect(io.parseStoredLinks("{links: []}")._unsafeUnwrap()).toEqual([]);
});

test("serializeStoredLinks", () => {
  expect(io.serializeStoredLinks(STORED_LINKS_1)).toEqual(STORED_LINKS_1_SERIALIZED);
});

test("serializeStoredLinksRoundtrip", () => {
  expect(io.parseStoredLinks(io.serializeStoredLinks(STORED_LINKS_1))._unsafeUnwrap()).toEqual([
    STORED_LINKS_1[2],
    STORED_LINKS_1[1],
    STORED_LINKS_1[0],
  ]);
});
