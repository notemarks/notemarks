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

    {
      let ops: octokit.GitOp[] = [
        {
          kind: "write",
          path: "some/subfolder/foo.txt",
          content: "foocontent",
        }
      ]
      let result = await octokit.commit(repo, ops, "added foo.txt");
      console.log(result)
      expect(result.isOk()).toBe(true);
    }
    {
      let ops: octokit.GitOp[] = [
        {
          kind: "move",
          pathFrom: "some/subfolder/foo.txt",
          pathTo: "some/subfolder/bar.txt",
        }
      ]
      let result = await octokit.commit(repo, ops, "moved foo.txt -> bar.txt");
      console.log(result)
      expect(result.isOk()).toBe(true);
    }
    {
      let ops: octokit.GitOp[] = [
        {
          kind: "remove",
          path: "some/subfolder/bar.txt",
        }
      ]
      let result = await octokit.commit(repo, ops, "removed bar.txt");
      console.log(result)
      expect(result.isOk()).toBe(true);
    }
  }
}, 20000);