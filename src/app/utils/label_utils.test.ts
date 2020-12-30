import { Labels, Entry, EntryKind } from "../types";
import { VerificationStatus } from "../repo";
import {
  normalizeLabels,
  extractLabelsFromString,
  isSameLabels,
  matchesOrIsSublabel,
  extractStatsMap,
  convertStatsMapToLabelArray,
  extractLabels,
  StatsMap,
} from "./label_utils";

function createDummyEntry(labels: string[]): Entry {
  let date = new Date();
  return {
    title: "title",
    priority: 0,
    labels: labels,
    content: {
      kind: EntryKind.Document,
      repo: {
        key: "unique_key",
        name: "SomeRepo",
        userOrOrgName: "",
        repoName: "",
        enabled: true,
        default: true,
        verified: VerificationStatus.unknown,
      },
      location: "folder",
      extension: "md",
      timeCreated: date,
      timeUpdated: date,
      rawUrl: "SomeRawURL",
    },
    key: `${date}`,
  };
}

describe("normalizeLabels", () => {
  it("should do nothing if not needed", () => {
    expect(normalizeLabels(["bar", "foo"])).toEqual(["bar", "foo"]);
  });

  it("should sort", () => {
    expect(normalizeLabels(["foo", "bar"])).toEqual(["bar", "foo"]);
  });

  it("should drop duplicates", () => {
    expect(normalizeLabels(["foo", "foo"])).toEqual(["foo"]);
  });

  it("should drop empty labels", () => {
    expect(normalizeLabels(["foo", ""])).toEqual(["foo"]);
  });

  it("should chop off leading/trailing slashes", () => {
    expect(normalizeLabels(["foo/foo/", "/bar/bar"])).toEqual(["bar/bar", "foo/foo"]);
    expect(normalizeLabels(["foo/foo///", "///bar/bar"])).toEqual(["bar/bar", "foo/foo"]);
  });
});

describe("extractLabelsFromString", () => {
  it("should handle basic case", () => {
    expect(extractLabelsFromString("  foo    foo/bar    baz")).toEqual(["baz", "foo", "foo/bar"]);
  });

  it("should handle tabs", () => {
    expect(extractLabelsFromString("	foo	bar	")).toEqual(["bar", "foo"]);
  });

  it("should handle slashes", () => {
    expect(extractLabelsFromString("/a /b/ c/ /// d// //e// //f")).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  });
});

// ----------------------------------------------------------------------------
// Comparison
// ----------------------------------------------------------------------------

test("isSameLabels", () => {
  expect(isSameLabels(["foo", "bar"], ["foo", "bar"])).toBe(true);
  expect(isSameLabels(["foo", "bar"], ["bar", "foo"])).toBe(true);

  expect(isSameLabels(["foo"], [])).toBe(false);
  expect(isSameLabels([], ["foo"])).toBe(false);
  expect(isSameLabels(["foo"], ["foo", "bar"])).toBe(false);
});

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
