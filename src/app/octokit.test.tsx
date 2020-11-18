/* eslint-disable jest/no-conditional-expect */
import * as octokit from './octokit';
import { Repo, createDefaultInitializedRepo } from './repo';


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


test('commitIntegrationTest', async () => {
  if (process.env.REACT_APP_AUTH != null) {
    console.log("foobar");

    let repo: Repo = createDefaultInitializedRepo(true)
    repo.userName = "notemarks";
    repo.repoName = "DummyRepo";
    repo.token = process.env.REACT_APP_AUTH;

    let result = await octokit.commit(repo);
    console.log(result)
    expect(result.isOk()).toBe(true);
  }
});