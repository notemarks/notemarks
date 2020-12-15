import { Repo } from "./repo";

/*
For reference, these were the types used in the old implementation:

export type Label = string;

export interface Note {
  id: string,
  title: string,
  labels: Label[],
  markdown: string,
  timeCreated: Date,
  timeUpdated: Date,
  link?: string,
}
export interface NoteUpdate {
  id?: string,
  title?: string,
  labels?: string[],
  markdown?: string,
  timeCreated?: Date,
  timeUpdated?: Date,
  link?: string,
}

export type Notes = { [s: string]: Note }

export type LabelCount = {
  name: string,
  count: number,
}
export type LabelCounts = LabelCount[]

*/

export enum EntryKind {
  NoteMarkdown = "NoteMarkdown",
  Link = "Link",
  Document = "Document",
}

/*
Design questions regarding Entry fields
---------------------------------------

Should the entry store a `repoId` or a full `repo` reference?

At first, I only stored a `repoId` within the entries, relying on lookup
of the full repo data if needed. However, this raises the question what
to do when the user edits the repo settings, and an entry refers either
to a non-existing repo id, or also to a repo different from the one it
was loaded from? Properly maintaining such a foreign key relationship
seems painful.

So what about de-normalizing the repo into the entry? The fact that an
entry exists actually proves that the repo it was loaded from was at
least valid at the time of loading. If the user now edits the repos
page, the attached repo and the "settings repo" could be different,
but when the next "entry reload" runs, the newly loaded entries get
the modified repo attached. Should be fine.
*/
export type Entry = {
  // General fields
  repo: Repo;
  rawUrl: string;
  // Fields derived from filename/path
  location: string;
  title: string;
  extension: string;
  entryKind: EntryKind;
  // From meta data:
  labels: string[];
  timeCreated: Date;
  timeUpdated: Date;
  // From file content (optional):
  content: string | undefined;
  // React specific key to use Entry in lists. Will typically be a composition of
  // repoId + location + title
  key: string;
  // Internal index within ordered/unfiltered entries array.
  // Allows for easier/faster lookups compared to using `key`.
  idx?: number;
};

export type Entries = Entry[];

export type Label = {
  baseName: string;
  fullName: string;
  count: number;
  children: Labels;
  priority: number;
};

export type Labels = Label[];
