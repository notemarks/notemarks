/* eslint-disable jest/no-conditional-expect */
import * as path_utils from "./path_utils";

test("splitLocationFilename", () => {
  let splitLocationFilename = path_utils.splitLocationFilename;
  expect(splitLocationFilename("foo/bar")).toEqual(["foo", "bar"]);
  expect(splitLocationFilename("foo/bar/baz")).toEqual(["foo/bar", "baz"]);
  expect(splitLocationFilename("foobar")).toEqual(["", "foobar"]);
});

test("splitTitleExtension", () => {
  let splitTitleExtension = path_utils.splitTitleExtension;
  expect(splitTitleExtension("my_title")).toEqual(["my_title", ""]);
  expect(splitTitleExtension("my_title.md")).toEqual(["my_title", "md"]);
  expect(splitTitleExtension("my_title....txt")).toEqual(["my_title...", "txt"]);
  expect(splitTitleExtension("A \u29F8 B.stuff")).toEqual(["A / B", "stuff"]);
});

test("splitLocationTitleExtension", () => {
  let splitLocationTitleExtension = path_utils.splitLocationTitleExtension;
  expect(splitLocationTitleExtension("my_title.md")).toEqual(["", "my_title", "md"]);
  expect(splitLocationTitleExtension("foo/bar/my_title")).toEqual(["foo/bar", "my_title", ""]);
  expect(splitLocationTitleExtension("A \u29F8 B/A \u29F8 B")).toEqual(["A \u29F8 B", "A / B", ""]);
});

test("unescapeTitle", () => {
  let unescapeTitle = path_utils.unescapeTitle;

  // Encoding of /
  expect(unescapeTitle("foo\u29F8bar")).toEqual("foo/bar");
  expect(unescapeTitle("foo\u29F8bar\u29F8baz")).toEqual("foo/bar/baz");
  expect(unescapeTitle("foo\u29F8")).toEqual("foo/");
  expect(unescapeTitle("\u29F8foo")).toEqual("/foo");

  // Escaping of \u29F8
  expect(unescapeTitle("\u29F9\u29F8")).toEqual("\u29F8");
  expect(unescapeTitle("foo\u29F9\u29F8bar")).toEqual("foo\u29F8bar");
  expect(unescapeTitle("\u29F9\u29F8\u29F8")).toEqual("\u29F8/");
  expect(unescapeTitle("\u29F8\u29F9\u29F8")).toEqual("/\u29F8");

  // Escaping of \u29F9
  expect(unescapeTitle("\u29F9\u29F9")).toEqual("\u29F9");
  expect(unescapeTitle("foo\u29F9\u29F9bar")).toEqual("foo\u29F9bar");
  expect(unescapeTitle("\u29F9\u29F9\u29F9\u29F9")).toEqual("\u29F9\u29F9");

  expect(unescapeTitle("\u29F9\u29F9\u29F8")).toEqual("\u29F9/");
  expect(unescapeTitle("\u29F8\u29F9\u29F9")).toEqual("/\u29F9");

  expect(unescapeTitle("\u29F9\u29F9\u29F9\u29F8")).toEqual("\u29F9\u29F8");
  expect(unescapeTitle("\u29F9\u29F8\u29F9\u29F9")).toEqual("\u29F8\u29F9");
});

test("escapeTitle", () => {
  let escapeTitle = path_utils.escapeTitle;

  // Encoding of /
  expect(escapeTitle("foo/bar")).toEqual("foo\u29F8bar");
  expect(escapeTitle("foo/bar/baz")).toEqual("foo\u29F8bar\u29F8baz");
  expect(escapeTitle("foo/")).toEqual("foo\u29F8");
  expect(escapeTitle("/foo")).toEqual("\u29F8foo");

  // Escaping of \u29F8
  expect(escapeTitle("\u29F8")).toEqual("\u29F9\u29F8");
  expect(escapeTitle("foo\u29F8bar")).toEqual("foo\u29F9\u29F8bar");
  expect(escapeTitle("\u29F8/")).toEqual("\u29F9\u29F8\u29F8");
  expect(escapeTitle("/\u29F8")).toEqual("\u29F8\u29F9\u29F8");

  // Escaping of \u29F9
  expect(escapeTitle("\u29F9")).toEqual("\u29F9\u29F9");
  expect(escapeTitle("foo\u29F9bar")).toEqual("foo\u29F9\u29F9bar");
  expect(escapeTitle("\u29F9\u29F9")).toEqual("\u29F9\u29F9\u29F9\u29F9");

  expect(escapeTitle("\u29F9/")).toEqual("\u29F9\u29F9\u29F8");
  expect(escapeTitle("/\u29F9")).toEqual("\u29F8\u29F9\u29F9");

  expect(escapeTitle("\u29F9\u29F8")).toEqual("\u29F9\u29F9\u29F9\u29F8");
  expect(escapeTitle("\u29F8\u29F9")).toEqual("\u29F9\u29F8\u29F9\u29F9");
});
