import * as octokit from './octokit';


test('splitLocationAndTitle', () => {
  let splitLocationAndFilename = octokit.splitLocationAndFilename
  expect(splitLocationAndFilename("foo/bar")).toEqual(["foo", "bar"]);
  expect(splitLocationAndFilename("foo/bar/baz")).toEqual(["foo/bar", "baz"]);
  expect(splitLocationAndFilename("foobar")).toEqual(["", "foobar"]);
});


test('filenameToTitle', () => {
  let filenameToTitle = octokit.filenameToTitle
  expect(filenameToTitle("my_title")).toEqual("my_title");
  expect(filenameToTitle("my_title.md")).toEqual("my_title");
  expect(filenameToTitle("my_title....md")).toEqual("my_title...");
});
