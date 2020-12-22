import { Entry } from "./types";
import { Repo, getRepoId, MultiRepoData } from "./repo";
import { MultiRepoFileMap } from "./filemap";

import * as path_utils from "./utils/path_utils";
import * as entry_utils from "./utils/entry_utils";

export enum GitOpKind {
  Write = "write",
  Remove = "remove",
  Move = "move",
}

export type GitOpWriteFile = {
  kind: GitOpKind.Write;
  path: string;
  content: string;
};
export type GitOpRemoveFile = {
  kind: GitOpKind.Remove;
  path: string;
};
export type GitOpMoveFile = {
  kind: GitOpKind.Move;
  pathFrom: string;
  pathTo: string;
};

export type GitOp = GitOpWriteFile | GitOpRemoveFile | GitOpMoveFile;

export type GitOps = GitOp[];

export type MultiRepoGitOps = MultiRepoData<GitOps>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MultiRepoGitOps = MultiRepoData as { new (): MultiRepoGitOps };

// ----------------------------------------------------------------------------
// FileMap diffing for GitOps extraction
// ----------------------------------------------------------------------------

export function diffMultiFileMaps(
  multiFileMapA: MultiRepoFileMap,
  multiFileMapB: MultiRepoFileMap
): MultiRepoGitOps {
  let multiRepoGitOps = new MultiRepoGitOps();
  return multiRepoGitOps;
}
