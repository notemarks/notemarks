import {
  Content,
  ContentDoc,
  ContentNote,
  ContentLink,
  ContentFile,
  EntryKind,
  Entry,
  Entries,
  EntryDoc,
  EntryNote,
  EntryLink,
  EntryFile,
} from "../types";

const entryKindNumericValues = {
  [EntryKind.NoteMarkdown]: 0,
  [EntryKind.Document]: 1,
  [EntryKind.Link]: 2,
};

export function sortAndIndexEntries(entries: Entries) {
  entries.sort((a, b) => {
    if (a.content.kind !== b.content.kind) {
      return entryKindNumericValues[a.content.kind] - entryKindNumericValues[b.content.kind];
    } else {
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    }
  });
  for (let i = 0; i < entries.length; ++i) {
    entries[i].idx = i;
  }
}

/*
User defined type guard helpers:
https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards

Regarding nesting see:
https://stackoverflow.com/questions/65347424/user-defined-type-guard-on-outer-type-nested-property
*/

// On Content

export function isDocContent(content: Content): content is ContentDoc {
  return content.kind === EntryKind.Document;
}

export function isNoteContent(content: Content): content is ContentNote {
  return content.kind === EntryKind.NoteMarkdown;
}

export function isLinkContent(content: Content): content is ContentLink {
  return content.kind === EntryKind.Link;
}

export function isFileContent(content: Content): content is ContentFile {
  return content.kind === EntryKind.Document || content.kind === EntryKind.NoteMarkdown;
}

// On Entry

export function isDoc(entry: Entry): entry is EntryDoc {
  return entry.content.kind === EntryKind.Document;
}

export function isNote(entry: Entry): entry is EntryNote {
  return entry.content.kind === EntryKind.NoteMarkdown;
}

export function isLink(entry: Entry): entry is EntryLink {
  return entry.content.kind === EntryKind.Link;
}

export function isFile(entry: Entry): entry is EntryFile {
  return entry.content.kind === EntryKind.Document || entry.content.kind === EntryKind.NoteMarkdown;
}

// Other Helpers

export function getText(entry: Entry): string | undefined {
  if (entry.content.kind === EntryKind.NoteMarkdown) {
    return entry.content.text;
  }
}
