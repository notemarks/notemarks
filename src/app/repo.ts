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

// ----------------------------------------------------------------------------
// Multi repo data type and helper
// ----------------------------------------------------------------------------

/*
// TBD if we should actually account for optionality in value lookup...
// The ` | undefined` on the values definitely sucks, because we don't really
// want existing values to be undefined.
// https://github.com/microsoft/TypeScript/issues/13778
// The easiest solution seems to be to wrap the map in a class where the getter
// return `Value | undefined` but the setter and the internal map use the type
// without optionality.

export type MultiRepoData<T> = { [id: string]: { repo: Repo; data: T } };

export function mapMultiRepo<T, R>(
  multiRepoData: MultiRepoData<T>,
  f: (repo: Repo, data: T) => R
): R[] {
  let result = [] as R[];
  let repoIds = Object.keys(multiRepoData);
  for (let repoId of repoIds) {
    let { repo, data } = multiRepoData[repoId];
    result.push(f(repo, data));
  }
  return result;
}
*/

export type MultiRepoDataMapValueType<T> = { repo: Repo; data: T };

export type MultiRepoDataMapType<T> = { [id: string]: MultiRepoDataMapValueType<T> };

export class MultiRepoData<T> {
  constructor(readonly map: MultiRepoDataMapType<T> = {}) {}

  mapMultiRepo<R>(f: (repo: Repo, data: T) => R): R[] {
    let result = [] as R[];
    let repoIds = Object.keys(this.map);
    for (let repoId of repoIds) {
      let { repo, data } = this.map[repoId];
      result.push(f(repo, data));
    }
    return result;
  }

  set(repo: Repo, data: T) {
    this.map[getRepoId(repo)] = { repo: repo, data: data };
  }

  get(repo: Repo): MultiRepoDataMapValueType<T> | undefined {
    return this.map[getRepoId(repo)];
  }

  getFromRepoId(repoId: string): MultiRepoDataMapValueType<T> | undefined {
    return this.map[repoId];
  }

  keys(): string[] {
    return Object.keys(this.map);
  }

  values(): MultiRepoDataMapValueType<T>[] {
    return Object.values(this.map);
  }
}

export type MultiRepoFile = MultiRepoData<string>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MultiRepoFile = MultiRepoData as { new (): MultiRepoFile };
