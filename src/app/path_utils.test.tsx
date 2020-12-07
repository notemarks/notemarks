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

  expect(filenameToTitle("foo\u29F8bar")).toEqual("foo/bar");
  expect(filenameToTitle("foo\u29F8bar\u29F8baz")).toEqual("foo/bar/baz");
  expect(filenameToTitle("foo\u29F8")).toEqual("foo/");
  expect(filenameToTitle("\u29F8foo")).toEqual("/foo");

  expect(filenameToTitle("foo\u29F8\u29F8bar")).toEqual("foo\u29F8bar");
  expect(filenameToTitle("foo\u29F8\u29F8\u29F8\u29F8bar")).toEqual("foo\u29F8\u29F8bar");
  // expect(filenameToTitle("foo\u29F8\u29F8\u29F8bar")).toEqual("foo\u29F8/bar"); // FIXME
});
