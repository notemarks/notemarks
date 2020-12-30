/* eslint-disable jest/no-conditional-expect */

import { AuthSettings } from "./settings";
import { Repo, createDefaultInitializedRepo } from "./repo";

import * as octokit from "./octokit";
import { GitOps, GitOpKind } from "./git_ops";

test("commitIntegrationTest", async () => {
  if (process.env.REACT_APP_AUTH != null) {
    let repo: Repo = createDefaultInitializedRepo(true);
    repo.userOrOrgName = "notemarks";
    repo.repoName = "DummyRepo";

    let auth: AuthSettings = {
      tokenGitHub: process.env.REACT_APP_AUTH,
    };

    {
      let ops: GitOps = [
        {
          kind: GitOpKind.Write,
          path: "some/subfolder/foo.txt",
          content: "foocontent",
        },
      ];
      let result = await octokit.commit(auth, repo, ops, "added foo.txt");
      console.log(result);
      expect(result.isOk()).toBe(true);
    }
    {
      let ops: GitOps = [
        {
          kind: GitOpKind.Move,
          pathSrc: "some/subfolder/foo.txt",
          pathDst: "some/subfolder/bar.txt",
        },
      ];
      let result = await octokit.commit(auth, repo, ops, "moved foo.txt -> bar.txt");
      console.log(result);
      expect(result.isOk()).toBe(true);
    }
    {
      let ops: GitOps = [
        {
          kind: GitOpKind.Remove,
          path: "some/subfolder/bar.txt",
        },
      ];
      let result = await octokit.commit(auth, repo, ops, "removed bar.txt");
      console.log(result);
      expect(result.isOk()).toBe(true);
    }
  }
}, 20000);
