import { Labels, Entry, EntryKind } from "../types";
import { VerificationStatus } from "../repo";
import {
  matchesOrIsSublabel,
  extractStatsMap,
  convertStatsMapToLabelArray,
  extractLabels,
  StatsMap,
} from "./label_utils";

function createDummyEntry(labels: string[]): Entry {
  let date = new Date();
  return {
    repo: {
      key: "unique_key",
      name: "SomeRepo",
      userName: "",
      repoName: "",
      token: "",
      enabled: true,
      default: true,
      verified: VerificationStatus.unknown,
    },
    rawUrl: "SomeRawURL",
    location: "folder",
    title: "title",
    extension: "md",
    entryKind: EntryKind.NoteMarkdown,
    labels: labels,
    timeCreated: date,
    timeUpdated: date,
    content: "content",
    key: `${date}`,
  };
}

// ----------------------------------------------------------------------------
// matchesOrIsSublabel
// ----------------------------------------------------------------------------

test("matchesOrIsSublabel", () => {
  expect(matchesOrIsSublabel("foo", "bar")).toEqual(false);
  expect(matchesOrIsSublabel("foo", "foobar")).toEqual(false);
  expect(matchesOrIsSublabel("foo", "bar/foo")).toEqual(false);
  expect(matchesOrIsSublabel("foo/bar", "foo")).toEqual(false);

  expect(matchesOrIsSublabel("foo", "foo")).toEqual(true);
  expect(matchesOrIsSublabel("foo", "foo/bar")).toEqual(true);
  expect(matchesOrIsSublabel("foo/bar", "foo/bar")).toEqual(true);
  expect(matchesOrIsSublabel("foo/bar", "foo/bar/baz")).toEqual(true);
});

// ----------------------------------------------------------------------------
// extractStatsMap
// ----------------------------------------------------------------------------

test("extractStatsMap_Basic1", () => {
  let entries = [createDummyEntry(["foo"]), createDummyEntry(["bar"])];
  let expected: StatsMap = {
    foo: {
      count: 1,
      children: {},
    },
    bar: {
      count: 1,
      children: {},
    },
  };
  expect(extractStatsMap(entries)).toEqual(expected);
});

test("extractStatsMap_Basic2", () => {
  let entries = [
    createDummyEntry(["foo"]),
    createDummyEntry(["bar"]),
    createDummyEntry(["foo", "bar"]),
  ];
  let expected: StatsMap = {
    foo: {
      count: 2,
      children: {},
    },
    bar: {
      count: 2,
      children: {},
    },
  };
  expect(extractStatsMap(entries)).toEqual(expected);
});

test("extractStatsMap_Basic3", () => {
  let entries = [createDummyEntry(["foo/bar"])];
  let expected: StatsMap = {
    foo: {
      count: 1,
      children: {
        bar: {
          count: 1,
          children: {},
        },
      },
    },
  };
  expect(extractStatsMap(entries)).toEqual(expected);
});

test("extractStatsMap_Basic4", () => {
  let entries1 = [
    createDummyEntry(["foo"]),
    createDummyEntry(["foo/bar"]),
    createDummyEntry(["foo/bar/baz"]),
  ];
  let entries2 = [
    createDummyEntry(["foo/bar/baz"]),
    createDummyEntry(["foo/bar"]),
    createDummyEntry(["foo"]),
  ];
  let expected: StatsMap = {
    foo: {
      count: 3,
      children: {
        bar: {
          count: 2,
          children: {
            baz: {
              count: 1,
              children: {},
            },
          },
        },
      },
    },
  };
  expect(extractStatsMap(entries1)).toEqual(expected);
  expect(extractStatsMap(entries2)).toEqual(expected);
});

// ----------------------------------------------------------------------------
// convertStatsMapToLabelArray
// ----------------------------------------------------------------------------

test("convertStatsMapToLabelArray_Basic1", () => {
  let statsMap: StatsMap = {
    foo: {
      count: 1,
      children: {},
    },
    bar: {
      count: 2,
      children: {},
    },
  };
  let expected: Labels = [
    {
      baseName: "bar",
      fullName: "bar",
      count: 2,
      children: [],
      priority: 0,
    },
    {
      baseName: "foo",
      fullName: "foo",
      count: 1,
      children: [],
      priority: 0,
    },
  ];
  expect(convertStatsMapToLabelArray(statsMap)).toEqual(expected);
});

test("convertStatsMapToLabelArray_Basic2", () => {
  let statsMap: StatsMap = {
    foo: {
      count: 3,
      children: {
        bar: {
          count: 2,
          children: {
            baz: {
              count: 1,
              children: {},
            },
          },
        },
      },
    },
  };
  let expected: Labels = [
    {
      baseName: "foo",
      fullName: "foo",
      count: 3,
      children: [
        {
          baseName: "bar",
          fullName: "foo/bar",
          count: 2,
          children: [
            {
              baseName: "baz",
              fullName: "foo/bar/baz",
              count: 1,
              children: [],
              priority: 0,
            },
          ],
          priority: 0,
        },
      ],
      priority: 0,
    },
  ];
  expect(convertStatsMapToLabelArray(statsMap)).toEqual(expected);
});

// ----------------------------------------------------------------------------
// convertStatsMapToLabelArray
// ----------------------------------------------------------------------------

test("extractLabels", () => {
  let entries = [
    createDummyEntry(["foo"]),
    createDummyEntry(["bar"]),
    createDummyEntry(["foo", "bar"]),
  ];
  let expected: Labels = [
    {
      baseName: "bar",
      fullName: "bar",
      count: 2,
      children: [],
      priority: 0,
    },
    {
      baseName: "foo",
      fullName: "foo",
      count: 2,
      children: [],
      priority: 0,
    },
  ];
  expect(extractLabels(entries)).toEqual(expected);
});
