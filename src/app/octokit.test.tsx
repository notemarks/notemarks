/* eslint-disable jest/no-conditional-expect */
import * as octokit from './octokit';
import { Repo, createDefaultInitializedRepo } from './repo';


test('commitIntegrationTest', async () => {
  if (process.env.REACT_APP_AUTH != null) {

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
