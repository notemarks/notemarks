/* eslint-disable jest/no-conditional-expect */
import * as path_utils from './path_utils';


test('splitLocationAndTitle', () => {
  let splitLocationAndFilename = path_utils.splitLocationAndFilename
  expect(splitLocationAndFilename("foo/bar")).toEqual(["foo", "bar"]);
  expect(splitLocationAndFilename("foo/bar/baz")).toEqual(["foo/bar", "baz"]);
  expect(splitLocationAndFilename("foobar")).toEqual(["", "foobar"]);
});


test('filenameToTitle', () => {
  let filenameToTitle = path_utils.filenameToTitle
  expect(filenameToTitle("my_title")).toEqual("my_title");
  expect(filenameToTitle("my_title.md")).toEqual("my_title");
  expect(filenameToTitle("my_title....md")).toEqual("my_title...");
});
