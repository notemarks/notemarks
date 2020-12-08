/* eslint-disable jest/no-conditional-expect */
import * as path_utils from "./path_utils";

test("splitLocationAndTitle", () => {
  let splitLocationAndFilename = path_utils.splitLocationAndFilename;
  expect(splitLocationAndFilename("foo/bar")).toEqual(["foo", "bar"]);
  expect(splitLocationAndFilename("foo/bar/baz")).toEqual(["foo/bar", "baz"]);
  expect(splitLocationAndFilename("foobar")).toEqual(["", "foobar"]);
});

test("filenameToTitle", () => {
  let filenameToTitle = path_utils.filenameToTitle;
  expect(filenameToTitle("my_title")).toEqual("my_title");
  expect(filenameToTitle("my_title.md")).toEqual("my_title");
  expect(filenameToTitle("my_title....md")).toEqual("my_title...");

  // Encoding of /
  expect(filenameToTitle("foo\u29F8bar")).toEqual("foo/bar");
  expect(filenameToTitle("foo\u29F8bar\u29F8baz")).toEqual("foo/bar/baz");
  expect(filenameToTitle("foo\u29F8")).toEqual("foo/");
  expect(filenameToTitle("\u29F8foo")).toEqual("/foo");

  // Escaping of \u29F8
  expect(filenameToTitle("\u29F9\u29F8")).toEqual("\u29F8");
  expect(filenameToTitle("foo\u29F9\u29F8bar")).toEqual("foo\u29F8bar");
  expect(filenameToTitle("\u29F9\u29F8\u29F8")).toEqual("\u29F8/");
  expect(filenameToTitle("\u29F8\u29F9\u29F8")).toEqual("/\u29F8");

  // Escaping of \u29F9
  expect(filenameToTitle("\u29F9\u29F9")).toEqual("\u29F9");
  expect(filenameToTitle("foo\u29F9\u29F9bar")).toEqual("foo\u29F9bar");
  expect(filenameToTitle("\u29F9\u29F9\u29F9\u29F9")).toEqual("\u29F9\u29F9");

  expect(filenameToTitle("\u29F9\u29F9\u29F8")).toEqual("\u29F9/");
  expect(filenameToTitle("\u29F8\u29F9\u29F9")).toEqual("/\u29F9");

  expect(filenameToTitle("\u29F9\u29F9\u29F9\u29F8")).toEqual("\u29F9\u29F8");
  expect(filenameToTitle("\u29F9\u29F8\u29F9\u29F9")).toEqual("\u29F8\u29F9");
});

test("titleToFilename", () => {
  let titleToFilename = path_utils.titleToFilename;
  expect(titleToFilename("my_title")).toEqual("my_title");
  expect(titleToFilename("my_title", "md")).toEqual("my_title.md");
  expect(titleToFilename("my_title...", "md")).toEqual("my_title....md");

  // Encoding of /
  expect(titleToFilename("foo/bar")).toEqual("foo\u29F8bar");
  expect(titleToFilename("foo/bar/baz")).toEqual("foo\u29F8bar\u29F8baz");
  expect(titleToFilename("foo/")).toEqual("foo\u29F8");
  expect(titleToFilename("/foo")).toEqual("\u29F8foo");

  // Escaping of \u29F8
  expect(titleToFilename("\u29F8")).toEqual("\u29F9\u29F8");
  expect(titleToFilename("foo\u29F8bar")).toEqual("foo\u29F9\u29F8bar");
  expect(titleToFilename("\u29F8/")).toEqual("\u29F9\u29F8\u29F8");
  expect(titleToFilename("/\u29F8")).toEqual("\u29F8\u29F9\u29F8");

  // Escaping of \u29F9
  expect(titleToFilename("\u29F9")).toEqual("\u29F9\u29F9");
  expect(titleToFilename("foo\u29F9bar")).toEqual("foo\u29F9\u29F9bar");
  expect(titleToFilename("\u29F9\u29F9")).toEqual("\u29F9\u29F9\u29F9\u29F9");

  expect(titleToFilename("\u29F9/")).toEqual("\u29F9\u29F9\u29F8");
  expect(titleToFilename("/\u29F9")).toEqual("\u29F8\u29F9\u29F9");

  expect(titleToFilename("\u29F9\u29F8")).toEqual("\u29F9\u29F9\u29F9\u29F8");
  expect(titleToFilename("\u29F8\u29F9")).toEqual("\u29F9\u29F8\u29F9\u29F9");
});
