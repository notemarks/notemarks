import { Repo, MultiRepoData } from "./repo";
import { FileMap, MultiRepoFileMap } from "./filemap";

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
  multiFileMapOld: MultiRepoFileMap,
  multiFileMapNew: MultiRepoFileMap
): MultiRepoGitOps {
  let multiRepoGitOps = new MultiRepoGitOps();

  let allRepos: { [repoId: string]: Repo } = {};
  for (let repoId of multiFileMapOld.keys()) {
    allRepos[repoId] = multiFileMapOld.getFromRepoId(repoId)!.repo;
  }
  for (let repoId of multiFileMapNew.keys()) {
    allRepos[repoId] = multiFileMapNew.getFromRepoId(repoId)!.repo;
  }

  for (let repo of Object.values(allRepos)) {
    let oldRepoFileMap = multiFileMapOld.get(repo)?.data;
    let newRepoFileMap = multiFileMapOld.get(repo)?.data;
    // For now only support case with overlapping repos.
    // If we don't see a 'before' vs 'after' of a repo, we cannot
    // infer meaningful git ops anyway.
    if (oldRepoFileMap != null && newRepoFileMap != null) {
      multiRepoGitOps.set(repo, diffFileMaps(oldRepoFileMap, newRepoFileMap));
    }
  }
  return multiRepoGitOps;
}

export function diffFileMaps(fileMapOld: FileMap, fileMapNew: FileMap): GitOps {
  let gitOps = [] as GitOps;

  fileMapNew.forEach((newFile) => {
    let oldFile = fileMapOld.get(newFile.path);
    if (oldFile == null || oldFile.content !== newFile.content) {
      gitOps.push({ kind: GitOpKind.Write, path: newFile.path, content: newFile.content! });
    }
  });

  fileMapOld.forEach((oldFile) => {
    let newFile = fileMapNew.get(oldFile.path);
    if (newFile == null) {
      gitOps.push({ kind: GitOpKind.Remove, path: oldFile.path });
    }
  });

  return gitOps;
}
