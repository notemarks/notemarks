import { EntryKind, EntryFile, Content, WrappedError } from "./types";
import { Repo, MultiRepoData } from "./repo";

import { MetaData } from "./io";
import * as io from "./io";

import { FileKind } from "./utils/path_utils";
import * as path_utils from "./utils/path_utils";

import * as markdown_utils from "./utils/markdown_utils";

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
    return new FileMap({ ...this.map });
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

export function convertFilesToFileMap(files: Files) {
  let fileMap = new FileMap();
  for (let file of files) {
    fileMap.setFile(file.path, file);
  }
  return fileMap;
}

export function convertFilesToFileContentMap(files: Files) {
  let fileMap = {} as FileMapRaw;
  for (let file of files) {
    if (file.content != null) {
      fileMap[file.content] = file;
    }
  }
  return fileMap;
}

// ----------------------------------------------------------------------------
// Entry Extraction
// ----------------------------------------------------------------------------

export function extractFileEntriesAndUpdateFileMap(
  allFileMapsOrig: MultiRepoFileMap
): [EntryFile[], MultiRepoFileMap] {
  let fileEntries: EntryFile[] = [];
  let allFileMapsEdit = allFileMapsOrig.clone();

  allFileMapsOrig.mapMultiRepo((repo, fileMap) => {
    fileMap.forEach((file) => {
      let isNotemarksFile = path_utils.isNotemarksFile(file.path);
      // let isFetchedFile = file.content != null || file.error != null;
      if (isFileFetched(file) && !isNotemarksFile) {
        // For meta data there are three cases:
        // - No meta file exists => okay, create/stage new
        // - Meta file exists, but fetch fails => create/stage not good, report as error,
        //   remove the corresponding entry to avoid accidentally overwriting the (possibly
        //   valid) meta file.
        // - Meta file exists, fetch is okay, but parse fails => In this case staging seems
        //   okay. If meta data is broken, users may want to have it fixed anyway. Also
        //   a user sees this action clearly by the staged change, and git history is
        //   recoverable anyway.

        let associatedMetaPath = path_utils.getAssociatedMetaPath(file.path);
        let associatedMetaFile = fileMap.get(associatedMetaPath);
        let createMetaDataFromScratch = false;

        if (associatedMetaFile != null && associatedMetaFile.content != null) {
          // Meta file fetch successful
          let metaData = io.parseMetaData(associatedMetaFile.content);
          if (metaData.isOk()) {
            // Parse successful
            let entry = constructFileEntry(repo, file, metaData.value);
            fileEntries.push(entry);
          } else {
            // Parse failed => load entry + stage fix
            createMetaDataFromScratch = true;
          }
        } else if (associatedMetaFile != null && associatedMetaFile.error != null) {
          // Meta file fetch failed
          console.log(
            `Skipping entry extraction for ${file.path} because associated meta couldn't be fetched.`
          );
        } else {
          // No meta file at all => load entry + stage fix
          createMetaDataFromScratch = true;
        }

        if (createMetaDataFromScratch) {
          let newMetaData = io.createNewMetaData();
          let newMetaDataContent = io.serializeMetaData(newMetaData);
          allFileMapsEdit.get(repo)?.data.setContent(associatedMetaPath, newMetaDataContent);
          let entry = constructFileEntry(repo, file, newMetaData);
          fileEntries.push(entry);
        }
      }
    });
  });

  return [fileEntries, allFileMapsEdit];
}

export function constructFileEntry(repo: Repo, file: FileFetched, metaData: MetaData): EntryFile {
  let fileKind = path_utils.getFileKind(file.path);
  let [location, title, extension] = path_utils.splitLocationTitleExtension(file.path);

  let content: Content;
  // Regarding double enum conversion
  // https://stackoverflow.com/a/42623905/1804173
  // https://stackoverflow.com/questions/55377365/what-does-keyof-typeof-mean-in-typescript
  if (fileKind === FileKind.NoteMarkdown) {
    let text = file.content;
    let [html, links] = markdown_utils.processMarkdownText(text);

    content = {
      kind: (fileKind as keyof typeof FileKind) as EntryKind.NoteMarkdown,
      repo: repo,
      location: location,
      extension: extension,
      timeCreated: metaData.timeCreated as Date,
      timeUpdated: metaData.timeUpdated as Date,
      rawUrl: file.rawUrl,
      text: text,
      html: html,
      links: links,
    };
  } else {
    content = {
      kind: (fileKind as keyof typeof FileKind) as EntryKind.Document,
      repo: repo,
      location: location,
      extension: extension,
      timeCreated: metaData.timeCreated as Date,
      timeUpdated: metaData.timeUpdated as Date,
      rawUrl: file.rawUrl,
    };
  }

  return {
    title: title,
    priority: 0,
    labels: metaData.labels,
    content: content,
    key: `${repo.key}:${location}:${title}`,
  };
}
