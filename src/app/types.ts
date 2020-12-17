import { Repo } from "./repo";

export enum EntryKind {
  NoteMarkdown = "NoteMarkdown",
  Link = "Link",
  Document = "Document",
}

export type FileEntryProps = {
  location: string;
  extension: string;
  timeCreated: Date;
  timeUpdated: Date;
  rawUrl: string;
};

export type ContentDoc = {
  kind: EntryKind.Document;
} & FileEntryProps;

export type ContentNote = FileEntryProps & {
  kind: EntryKind.NoteMarkdown;
  text: string;
};

export type ContentLink = {
  kind: EntryKind.Link;
  locations: string[];
  inheritedLabels: string[];
  additionalLabels: string[];
};

export type Content = ContentDoc | ContentNote | ContentLink;

export type ContentFile = ContentDoc | ContentNote;
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
  // Common props
  title: string;
  priority: number;
  labels: string[];
  // Kind specific content
  content: Content;
  // React specific key to use Entry in lists. Will typically be a composition of
  // repoId + location + title
  key: string;
  // Internal index within ordered/unfiltered entries array.
  // Allows for easier/faster lookups compared to using `key`.
  idx?: number;
};

// Entry flavors
export type EntryDoc = Omit<Entry, "content"> & { content: ContentDoc };
export type EntryNote = Omit<Entry, "content"> & { content: ContentNote };
export type EntryLink = Omit<Entry, "content"> & { content: ContentLink };

export type EntryFile = Omit<Entry, "content"> & { content: ContentFile };

export type Entries = Entry[];

export type Label = {
  baseName: string;
  fullName: string;
  count: number;
  children: Labels;
  priority: number;
};

export type Labels = Label[];
