import { v4 as uuidv4 } from "uuid";

export enum VerificationStatus {
  unknown,
  failed,
  success,
  inProgress,
}

export type Repo = {
  id: string;
  name: string;
  userName: string;
  repoName: string;
  token: string;
  enabled: boolean;
  default: boolean;
  verified: VerificationStatus;
};

export type Repos = Repo[];

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

export function createDefaultInitializedRepo(isFirst: boolean): Repo {
  return {
    id: uuidv4(),
    name: "",
    userName: "",
    repoName: "",
    token: "",
    enabled: true,
    default: isFirst ? true : false,
    verified: VerificationStatus.unknown,
  };
}
