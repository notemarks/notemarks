
import { EntryKind, Entries, Label, LabelCounts } from "./types"
import * as fn_utils from "./fn_utils"


export function getLabelCounts(entries: Entries): LabelCounts {

  let counts: {[index: string]: number} = {}
  for (let entry of entries) {
    for (let label of entry.labels) {
      counts[label] = (counts[label] || 0) + 1;
    }
  }

  let labelCounts = fn_utils.mapEntries(counts, (k: Label, v: number) => ({
    label: k,
    count: v,
  }))

  labelCounts = labelCounts.sort((a, b) => {
    return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
  })

  return labelCounts
}


const entryKindNumericValues = {
  [EntryKind.NoteMarkdown]: 0,
  [EntryKind.Document]: 1,
  [EntryKind.Link]: 2,
}

export function sortAndIndexEntries(entries: Entries) {
  entries.sort((a, b) => {
    if (a.entryKind !== b.entryKind) {
      return entryKindNumericValues[a.entryKind] - entryKindNumericValues[b.entryKind]
    } else {
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    }
  })
  for (let i = 0; i < entries.length; ++i) {
    entries[i].idx = i;
  }
}