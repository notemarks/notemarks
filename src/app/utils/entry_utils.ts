import { EntryKind, Entry, Entries, Content, NoteContent, FileContent } from "../types";

const entryKindNumericValues = {
  [EntryKind.NoteMarkdown]: 0,
  [EntryKind.Document]: 1,
  [EntryKind.Link]: 2,
};

export function sortAndIndexEntries(entries: Entries) {
  entries.sort((a, b) => {
    if (a.entryKind !== b.entryKind) {
      return entryKindNumericValues[a.entryKind] - entryKindNumericValues[b.entryKind];
    } else {
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    }
  });
  for (let i = 0; i < entries.length; ++i) {
    entries[i].idx = i;
  }
}

// User defined type guard helpers:
// https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
// Unfortunately it looks like nested property access is not possible?

/*
export function isNote(entry: Entry): entry.content is NoteContent {
  return true;
}
*/

export function isNote(content: Content): content is NoteContent {
  return content.kind === EntryKind.NoteMarkdown;
}

export function isFile(content: Content): content is NoteContent | FileContent {
  return content.kind === EntryKind.NoteMarkdown || content.kind === EntryKind.Document;
}

export function getText(entry: Entry): string | undefined {
  if (entry.content.kind === EntryKind.NoteMarkdown) {
    return entry.content.text;
  }
}
