import { v4 as uuidv4 } from "uuid";
import * as fn from "./utils/fn_utils";

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
  userOrOrgName: string;
  repoName: string;
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
    name: "Default",
    userOrOrgName: "",
    repoName: "",
    enabled: true,
    default: isFirst ? true : false,
    verified: VerificationStatus.unknown,
  };
}

export function getRepoId(repo: Repo): string {
  // In GitHub world, this should provide a unique identifier.
  return `github_${repo.userOrOrgName}_${repo.repoName}`;
}

export function filterActiveRepos(repos: Repos): Repos {
  return repos.filter((repo) => repo.enabled && repo.verified);
}

export function getDefaultRepo(repos: Repos): Repo | undefined {
  let defaultRepo = repos.find((repo) => repo.default);
  if (defaultRepo != null) {
    return defaultRepo;
  } else {
    return repos.length > 0 ? repos[0] : undefined;
  }
}

// ----------------------------------------------------------------------------
// Utility functions
// ----------------------------------------------------------------------------

export function getRepoCommitPage(repo: Repo, commitHash: string): string {
  return `https://github.com/${repo.userOrOrgName}/${repo.repoName}/commit/${commitHash}`;
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
  constructor(readonly mapData: MultiRepoDataMapType<T> = {}) {}

  forEach(f: (repo: Repo, data: T) => void) {
    for (let repoId of Object.keys(this.mapData)) {
      let { repo, data } = this.mapData[repoId];
      f(repo, data);
    }
  }

  map<R>(f: (repo: Repo, data: T) => R): R[] {
    let result = [] as R[];
    for (let repoId of Object.keys(this.mapData)) {
      let { repo, data } = this.mapData[repoId];
      result.push(f(repo, data));
    }
    return result;
  }

  flatMap<R>(f: (repo: Repo, data: T) => R[]): R[] {
    let result = [] as R[];
    for (let repoId of Object.keys(this.mapData)) {
      let { repo, data } = this.mapData[repoId];
      for (let x of f(repo, data)) {
        result.push(x);
      }
    }
    return result;
  }

  set(repo: Repo, data: T) {
    this.mapData[getRepoId(repo)] = { repo: repo, data: data };
  }

  get(repo: Repo): MultiRepoDataMapValueType<T> | undefined {
    return this.mapData[getRepoId(repo)];
  }

  getFromRepoId(repoId: string): MultiRepoDataMapValueType<T> | undefined {
    return this.mapData[repoId];
  }

  keys(): string[] {
    return Object.keys(this.mapData);
  }

  values(): MultiRepoDataMapValueType<T>[] {
    return Object.values(this.mapData);
  }

  size(): number {
    return Object.keys(this.mapData).length;
  }

  clone(): MultiRepoData<T> {
    return fn.clone(this);
  }
}
