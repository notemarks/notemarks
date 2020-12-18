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
  RawLabel,
} from "../types";
import { Repo, getRepoId } from "../repo";

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

export function mergeLabels(existingLabels: RawLabel[], incomingLabels: RawLabel[]) {
  for (let incomingLabel of incomingLabels) {
    if (existingLabels.some((existingLabel) => existingLabel === incomingLabel)) {
      continue;
    } else {
      existingLabels.push(incomingLabel);
    }
  }
  existingLabels.sort();
}

export function mergeRepos(existingRepos: Repo[], incomingRepo: Repo) {
  if (!existingRepos.some((existingRepo) => getRepoId(existingRepo) === getRepoId(incomingRepo))) {
    existingRepos.push(incomingRepo);
  }
}

export function mergeLocations(existingLocations: string[], incomingLocation: string) {
  if (!existingLocations.some((existingLocation) => existingLocation === incomingLocation)) {
    existingLocations.push(incomingLocation);
  }
}

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
              target: link,
              referencedBy: [entry],
              refRepos: [entry.content.repo],
              refLocations: [entry.content.location],
              ownLabels: [],
            },
            key: `__link_${link}`,
          };
          linkEntries.push(linkEntry);
          linkMap[link] = linkEntry;
        } else {
          let linkEntry = linkMap[link];
          linkEntry.content.referencedBy.push(entry);
          mergeLabels(linkEntry.labels, entry.labels);
          mergeRepos(linkEntry.content.refRepos, entry.content.repo);
          mergeLocations(linkEntry.content.refLocations, entry.content.location);
        }
      }
    }
  }
  console.timeEnd("link extraction");

  console.log(linkMap);
  return [...entries, ...linkEntries];
}
