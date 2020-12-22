import { Repo, MultiRepoData } from "./repo";
import { File, FileMap, MultiRepoFileMap, convertFileMapToFileContentMap } from "./filemap";

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
  pathSrc: string;
  pathDst: string;
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

  let oldContentMap = convertFileMapToFileContentMap(fileMapOld);
  let movedFiles = {} as { [path: string]: boolean };

  fileMapNew.forEach((newFile) => {
    let oldFile = fileMapOld.get(newFile.path);
    let needsToBeWritten = false;
    if (oldFile != null) {
      if (oldFile.content !== newFile.content) {
        needsToBeWritten = true;
      }
    } else {
      let otherOldFile = oldContentMap[newFile.content!] as File | undefined;
      if (otherOldFile == null) {
        needsToBeWritten = true;
      } else {
        gitOps.push({ kind: GitOpKind.Move, pathSrc: otherOldFile.path, pathDst: newFile.path });
        movedFiles[otherOldFile.path] = true;
      }
    }
    if (needsToBeWritten) {
      gitOps.push({ kind: GitOpKind.Write, path: newFile.path, content: newFile.content! });
    }
  });

  fileMapOld.forEach((oldFile) => {
    let newFile = fileMapNew.get(oldFile.path);
    if (newFile == null && !(oldFile.path in movedFiles)) {
      gitOps.push({ kind: GitOpKind.Remove, path: oldFile.path });
    }
  });

  return gitOps;
}
