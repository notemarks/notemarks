import { v4 as uuidv4 } from "uuid";

export enum VerificationStatus {
  unknown,
  failed,
  success,
  inProgress,
}

/*
Design questions
----------------

What kind of ID mechanism should repos have?

At first I was using an `id` field containing a randomly generated UUID.
The main motivation for this was to have an internal field that is guaranteed
to be different for different repos. However this has the drawback that
when deleting and re-adding the same repository (i.e. same user/repo data),
the repo would have gotten a new UUID. Would this be a problem?

Solution: The role of that ID was purely for React list handling.
Let's rename it to `key` to make its role more clear.
Use getRepoId function below to actually compute a more semantically
meaningful identifier where needed.

*/
export type Repo = {
  key: string;
  name: string;
  userName: string;
  repoName: string;
  token: string;
  enabled: boolean;
  default: boolean;
  verified: VerificationStatus;
};

export type Repos = Repo[];

// ----------------------------------------------------------------------------
// Construction / Helpers
// ----------------------------------------------------------------------------

export function createDefaultInitializedRepo(isFirst: boolean): Repo {
  return {
    key: uuidv4(),
    name: "",
    userName: "",
    repoName: "",
    token: "",
    enabled: true,
    default: isFirst ? true : false,
    verified: VerificationStatus.unknown,
  };
}

export function getRepoId(repo: Repo): string {
  // In GitHub world, this should provide a unique identifier.
  return `github_${repo.userName}_${repo.repoName}`;
}

export function filterActiveRepos(repos: Repos): Repos {
  return repos.filter((repo) => repo.enabled && repo.verified);
}

// ----------------------------------------------------------------------------
// Storage I/O
// ----------------------------------------------------------------------------

export function getStoredRepos(): Repos {
  let reposEntry = window.localStorage.getItem("repos");
  if (reposEntry != null) {
    return JSON.parse(reposEntry) as Repos;
  } else {
    return [createDefaultInitializedRepo(true)];
  }
}

export function setStoredRepos(repos: Repos) {
  window.localStorage.setItem("repos", JSON.stringify(repos));
}

// ----------------------------------------------------------------------------
// Utility functions
// ----------------------------------------------------------------------------

export function getRepoCommitPage(repo: Repo, commitHash: string): string {
  return `https://github.com/${repo.userName}/${repo.repoName}/commit/${commitHash}`;
}
