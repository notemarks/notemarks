import { Entries, Label, Labels } from "./types";
import * as fn from "./fn_utils";

export function iterateSubLabels(
  label: string,
  func: (baseName: string, fullName: string, parents: string[]) => void
) {
  let components = label.split("/");
  for (let i = 0; i < components.length; ++i) {
    let baseName = components[i];
    let fullName = components.slice(0, i + 1).join("/");
    let location = components.slice(0, i);
    func(baseName, fullName, location);
  }
}

export type Stats = {
  count: number;
  children: StatsMap;
};
export type StatsMap = { [index: string]: Stats };

export function extractStatsMap(entries: Entries, priorityMap = {}): StatsMap {
  let statsMap = {} as StatsMap;
  for (let entry of entries) {
    for (let label of entry.labels) {
      iterateSubLabels(label, (baseName, fullName, parents) => {
        // Descend map according to parents
        let currentStatsMap = statsMap;
        for (let parent of parents) {
          currentStatsMap = currentStatsMap[parent].children;
        }
        // Either create new stats map or update count
        if (!currentStatsMap.hasOwnProperty(baseName)) {
          currentStatsMap[baseName] = {
            count: 1,
            children: {},
          };
        } else {
          currentStatsMap[baseName].count += 1;
        }
      });
    }
  }
  return statsMap;
}

type PriorityMap = { [fullName: string]: number };

export function convertStatsMapToLabelArray(
  statsMap: StatsMap,
  priorityMap: PriorityMap = {},
  parents: string[] = []
): Label[] {
  let labels = fn.mapEntries(statsMap, (baseName: string, stats: Stats) => {
    let allComponents = [...parents, baseName];
    let fullName = allComponents.join("/");
    let children = convertStatsMapToLabelArray(stats.children, priorityMap, allComponents);
    return {
      baseName,
      fullName,
      children,
      count: stats.count,
      priority: priorityMap[fullName] || 0,
    };
  });

  labels = labels.sort((a, b) => {
    // TODO: Incorporate sort priorities here.
    return a.baseName.toLowerCase().localeCompare(b.baseName.toLowerCase());
  });

  return labels;
}

export function extractLabels(entries: Entries, priorityMap: PriorityMap = {}): Labels {
  let statsMap = extractStatsMap(entries);
  return convertStatsMapToLabelArray(statsMap);
}
