import { EntryKind } from "./types"

export const NOTEMARKS_FOLDER = ".notemarks"

export function getEntryKind(path: string): EntryKind {
  let extension = path.split('.').pop()?.toLowerCase();
  if (extension === "md") {
    return EntryKind.NoteMarkdown;
  } else if (extension === "desktop") {
    return EntryKind.Link;
  } else {
    return EntryKind.Document;
  }
}

export function getAssociatedMetaPath(path: string): string {
  return `${NOTEMARKS_FOLDER}/${path}.yaml`
}

export function splitLocationAndFilename(path: string): [string, string] {
  let idxLastSlash = path.lastIndexOf('/')
  if (idxLastSlash === -1) {
    return ["", path]
  } else {
    return [
      path.substring(0, idxLastSlash),
      path.substring(idxLastSlash + 1),
    ]
  }
}

export function filenameToTitle(filename: string) {
  // TODO: Unescaping of special chars has to go here...
  let idxLastDot = filename.lastIndexOf('.')
  if (idxLastDot === -1) {
    return filename;
  } else {
    return filename.substring(0, idxLastDot);
  }
}

export function titleToFilename(title: string, extension?: string) {
  // TODO: Escaping of special chars has to go here...
  let titleEscaped = title
  if (extension != null && extension.length > 0) {
    return `${titleEscaped}.${extension}`;
  } else {
    return titleEscaped;
  }
}