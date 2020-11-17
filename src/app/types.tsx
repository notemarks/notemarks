
export type Label = string;

export interface Note {
  repoId: string,
  location: string,
  title: string,
  labels: Label[],
  timeCreated: Date,
  timeUpdated: Date,
  content: string,
}
