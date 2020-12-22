import { WrappedError } from "./types";
import { MultiRepoData } from "./repo";

export type File = {
  path: string;
  sha: string;
  rawUrl: string;
  content?: string;
  error?: WrappedError;
};

export type Files = File[];

export type FileMap = { [path: string]: File };

export type MultiRepoFileMap = MultiRepoData<FileMap>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MultiRepoFileMap = MultiRepoData as { new (): MultiRepoFileMap };

export function convertFilesToFileMap(files: Files) {
  let fileMap: FileMap = {};
  for (let file of files) {
    fileMap[file.path] = file;
  }
  return fileMap;
}

export function convertFilesToFileContentMap(files: Files) {
  let fileMap: FileMap = {};
  for (let file of files) {
    if (file.content != null) {
      fileMap[file.content] = file;
    }
  }
  return fileMap;
}
