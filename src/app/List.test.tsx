import { checkMatchingTitle, checkMatchingLabels, LabelFilter } from "./List";
import { newLabel } from "./label_utils";

test("checkMatchingTitle", () => {
  expect(checkMatchingTitle("foo", [])).toEqual(true);
  expect(checkMatchingTitle("foo", ["f"])).toEqual(true);
  expect(checkMatchingTitle("foo", ["foo"])).toEqual(true);
  expect(checkMatchingTitle("foo", ["f", "o"])).toEqual(true);

  expect(checkMatchingTitle("foo", ["x"])).toEqual(false);
  expect(checkMatchingTitle("foo", ["x", "foo"])).toEqual(false);
});

test("checkMatchingLabels", () => {
  function filter(fullName: string, state: number): LabelFilter {
    return {
      label: newLabel(fullName),
      state: state,
    };
  }

  expect(checkMatchingLabels([], [])).toEqual(true);
  expect(checkMatchingLabels(["some", "labels"], [])).toEqual(true);

  expect(checkMatchingLabels([], [filter("search-label", 1)])).toEqual(false);
  expect(checkMatchingLabels([], [filter("search-label", -1)])).toEqual(true);
  expect(checkMatchingLabels(["search-label"], [filter("search-label", 1)])).toEqual(true);

  expect(checkMatchingLabels(["foo"], [filter("foo", 1), filter("bar", 1)])).toEqual(false);
  expect(checkMatchingLabels(["bar"], [filter("foo", 1), filter("bar", 1)])).toEqual(false);
  expect(checkMatchingLabels(["foo", "bar"], [filter("foo", 1), filter("bar", 1)])).toEqual(true);

  expect(checkMatchingLabels(["foo", "bar"], [filter("foo", 1), filter("bar", -1)])).toEqual(false);
});
