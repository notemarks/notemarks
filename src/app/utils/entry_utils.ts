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

// ----------------------------------------------------------------------------
// Entry fusion
// ----------------------------------------------------------------------------

export function mergeEntriesAndLinks(entries: EntryFile[], links: {}): Entries {
  console.time("link extraction");

  let linkMap: { [link: string]: EntryLink } = {};

  // TODO Loop over existing/explicit links and insert them into the linkMap

  let linkEntries = [] as EntryLink[];

  for (let entry of entries) {
    if (isNote(entry)) {
      for (let link of entry.content.links) {
        if (!(link in linkMap)) {
          let linkEntry: EntryLink = {
            title: link, // TODO fetch here but then this whole thing becomes async and slow?
            priority: 0,
            labels: entry.labels.slice(0),
            content: {
              kind: EntryKind.Link,
              referencedBy: [entry],
              referencedRepos: [entry.content.repo],
              locations: [entry.content.location],
              inheritedLabels: entry.labels.slice(0),
              additionalLabels: [],
            },
            key: `__link_${link}`,
          };
          linkEntries.push(linkEntry);
          linkMap[link] = linkEntry;
        } else {
          let linkEntry = linkMap[link];
          linkEntry.labels = [...linkEntry.labels, ...entry.labels]; // TODO: proper merge
          linkEntry.content.referencedBy.push(entry);
          linkEntry.content.referencedRepos.push(entry.content.repo); // TODO: proper merge
          linkEntry.content.locations.push(entry.content.location); // TODO: proper merge
          linkEntry.content.inheritedLabels.push(...entry.labels); // TODO: proper merge
        }
      }
    }
  }
  console.timeEnd("link extraction");

  console.log(linkMap);
  return [...entries, ...linkEntries];
}
