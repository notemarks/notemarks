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

export function recomputeLinkEntries(
  entries: EntryFile[],
  existingLinks: EntryLink[]
): EntryLink[] {
  console.time("link extraction");

  // TODO Loop over existing/explicit links and insert them into the linkMap
  /*
  If the links variable contains the current array of EntryLinks, how
  should this loop look like exactly? In order to allow for non-standalone
  to disappear, we should actually only insert standalone links in the
  results. However, this would mean that we lose the title and labels
  information that is directly attached to these links (the links
  inferred below can only be initialized with the default title equaling
  the link target, and the labels directly inherited from the note).
  Therefore, we should insert all existing links to the result, but
  we would need a post-processing to remove those links that are not
  standalone and did not get any references attached. A bit ugly.

  Better idea: Use two data structures:
  - The final link result list
  - An intermediate lookup for existing links

  The loop can fill standalone links directly into the result.

  Non-standalone links can be added to the lookup map so that if they
  are needed in the infer part below they can be read from there.
  */

  let linkEntries = [] as EntryLink[];
  let linkMap: { [link: string]: EntryLink } = {};

  for (let link of existingLinks) {
    // We need to 'reset' the link data so that the infered fields can be computed from scratch.
    // TODO: Perhaps pull this out into a `cloneResetLink` helper function for better testability.
    let resetLinkEntry: EntryLink = {
      title: link.title,
      priority: link.priority,
      labels: link.content.ownLabels,
      content: {
        kind: EntryKind.Link,
        target: link.content.target,
        referencedBy: [],
        refRepos: [],
        refLocations: [],
        standaloneRepo: link.content.standaloneRepo,
        ownLabels: link.content.ownLabels,
      },
      key: link.key,
    };
    // TODO: There is still a potential problem here if the existingLinks would
    // contain duplicate links, right? I.e., different link data (title/labels),
    // but same link target would be two entries in the list, but only one of
    // them is accessible in the linkMap.
    if (link.content.standaloneRepo != null) {
      linkEntries.push(resetLinkEntry);
    }
    linkMap[link.content.target] = resetLinkEntry;
  }

  for (let entry of entries) {
    if (isNote(entry)) {
      for (let linkTarget of entry.content.links) {
        // TODO: rename entry.content.links to linkTargets because they aren't "real" links?
        if (!(linkTarget in linkMap)) {
          let linkEntry: EntryLink = {
            title: linkTarget, // TODO fetch here but then this whole thing becomes async and slow?
            priority: 0,
            labels: entry.labels.slice(0),
            content: {
              kind: EntryKind.Link,
              target: linkTarget,
              referencedBy: [entry],
              refRepos: [entry.content.repo],
              refLocations: [entry.content.location],
              ownLabels: [],
            },
            key: `__link_${linkTarget}`,
          };
          linkEntries.push(linkEntry);
          linkMap[linkTarget] = linkEntry;
        } else {
          let linkEntry = linkMap[linkTarget];
          linkEntry.content.referencedBy.push(entry);
          mergeLabels(linkEntry.labels, entry.labels);
          mergeRepos(linkEntry.content.refRepos, entry.content.repo);
          mergeLocations(linkEntry.content.refLocations, entry.content.location);
        }
      }
    }
  }

  // TODO: Check if we have to sort the labels attached to links.
  // In case we call mergeLabels, they should be sorted, because it sorts
  // internally. However, we initialize by `ownLabels` and if we never
  // call mergeLabels (i.e. no reference = standalone link), we would
  // never sort them, and it is maybe not good to rely on them
  // being sorted on disc?
  // Perhaps it is easier to get rid of sorting them during the merge
  // but rather have an explicit sort post-processing.

  console.timeEnd("link extraction");
  console.log(linkMap);
  return linkEntries;
}

export function recomputeEntries(
  fileEntries: EntryFile[],
  existingLinkEntries: EntryLink[]
): [EntryLink[], Entries] {
  let linkEntries = recomputeLinkEntries(fileEntries, existingLinkEntries);
  let entries = [...fileEntries, ...linkEntries];

  sortAndIndexEntries(entries);

  return [linkEntries, entries];
}
