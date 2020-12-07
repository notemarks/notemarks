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

export type Label = string;

export enum EntryKind {
  NoteMarkdown = "NoteMarkdown",
  Link = "Link",
  Document = "Document",
}

export type Entry = {
  // General fields
  repoId: string;
  rawUrl: string;
  // Fields derived from filename/path
  location: string;
  title: string;
  entryKind: EntryKind;
  // From meta data:
  labels: Label[];
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

export type LabelCount = {
  label: Label;
  count: number;
};
export type LabelCounts = LabelCount[];
