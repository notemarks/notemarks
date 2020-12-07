import { EntryKind } from "./types";

export const NOTEMARKS_FOLDER = ".notemarks";

export function getEntryKind(path: string): EntryKind {
  let extension = path.split(".").pop()?.toLowerCase();
  if (extension === "md") {
    return EntryKind.NoteMarkdown;
  } else if (extension === "desktop") {
    return EntryKind.Link;
  } else {
    return EntryKind.Document;
  }
}

export function getAssociatedMetaPath(path: string): string {
  return `${NOTEMARKS_FOLDER}/${path}.yaml`;
}

export function splitLocationAndFilename(path: string): [string, string] {
  let idxLastSlash = path.lastIndexOf("/");
  if (idxLastSlash === -1) {
    return ["", path];
  } else {
    return [path.substring(0, idxLastSlash), path.substring(idxLastSlash + 1)];
  }
}

/*
Notes on encoding:

In Unicode the normal `/` is U+002F SOLIDUS.
Therefore the closest replacement is U+29F8 BIG SOLIDUS.

- http://www.fileformat.info/info/unicode/char/29F8/index.htm
- https://stackoverflow.com/questions/9847288/is-it-possible-to-use-in-a-filename/9847306#comment12550838_9847306
- https://stackoverflow.com/a/61448658/1804173
- https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
*/

function unescapeTitle(s: string): string {
  return s
    .replace(/([^\u{29F8}]|^)\u{29F8}([^\u{29F8}]|$)/gu, "$1/$2")
    .replace(/\u{29F8}\u{29F8}/gu, "\u{29F8}");
}

export function filenameToTitle(filename: string) {
  // TODO: Unescaping of special chars has to go here...

  let idxLastDot = filename.lastIndexOf(".");
  if (idxLastDot === -1) {
    return unescapeTitle(filename);
  } else {
    return unescapeTitle(filename.substring(0, idxLastDot));
  }
}

export function titleToFilename(title: string, extension?: string) {
  // TODO: Escaping of special chars has to go here...
  let titleEscaped = title;
  if (extension != null && extension.length > 0) {
    return `${titleEscaped}.${extension}`;
  } else {
    return titleEscaped;
  }
}
