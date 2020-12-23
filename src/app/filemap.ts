import { WrappedError } from "./types";
import { MultiRepoData } from "./repo";

import * as fn from "./utils/fn_utils";

export type File = {
  path: string;
  sha?: string;
  rawUrl?: string;
  content?: string;
  error?: WrappedError;
};

export type Files = File[];

// File type flavors

export type FileFetched = {
  path: string;
  sha: string;
  rawUrl: string;
  content: string;
};
export function isFileFetched(file: File): file is FileFetched {
  return file.sha != null && file.rawUrl != null && file.content != null;
}

export type FileFetchedFailed = {
  path: string;
  sha: string;
  rawUrl: string;
  error: WrappedError;
};
export function isFileFetchedFailed(file: File): file is FileFetchedFailed {
  return file.sha != null && file.rawUrl != null && file.error != null;
}

export type FileVirtual = {
  path: string;
  content: string;
};
export function isFileVirtual(file: File): file is FileVirtual {
  return file.content != null;
}

// ----------------------------------------------------------------------------
// FileMap
// ----------------------------------------------------------------------------

export type FileMapRaw = { [path: string]: File };

export class FileMap {
  constructor(readonly map: FileMapRaw = {}) {}

  setContent(path: string, content: string) {
    // TODO: Should we actually compute a proper SHA-1?
    if (path in this.map) {
      this.map[path].content = content;
    } else {
      this.map[path] = {
        path: path,
        content: content,
      };
    }
  }

  setFile(path: string, file: File) {
    this.map[path] = file;
  }

  get(path: string): File | undefined {
    return this.map[path];
  }

  keys(): string[] {
    return Object.keys(this.map);
  }

  values(): File[] {
    return Object.values(this.map);
  }

  clone(): FileMap {
    return fn.clone(this);
  }

  forEach(fn: (file: File) => void) {
    for (let file of Object.values(this.map)) {
      fn(file);
    }
  }
}

export type MultiRepoFileMap = MultiRepoData<FileMap>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MultiRepoFileMap = MultiRepoData as { new (): MultiRepoFileMap };

// ----------------------------------------------------------------------------
// Utils
// ----------------------------------------------------------------------------

export function convertFilesToFileMap(files: Files): FileMap {
  let fileMap = new FileMap();
  for (let file of files) {
    fileMap.setFile(file.path, file);
  }
  return fileMap;
}

export function convertFileMapToFileContentMap(fileMap: FileMap): FileMapRaw {
  let contentMap = {} as FileMapRaw;
  fileMap.forEach((file) => {
    if (file.content != null) {
      contentMap[file.content] = file;
    }
  });
  return contentMap;
}
