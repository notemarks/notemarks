import { Entries, Label, Labels } from "../types";
import * as fn from "./fn_utils";

export function newLabel(fullName: string): Label {
  return {
    fullName,
    baseName: getBaseName(fullName),
    count: 0,
    children: [],
    priority: 0,
  };
}

export function getBaseName(fullName: string): string {
  let components = fullName.split("/");
  return components[components.length - 1];
}

// ----------------------------------------------------------------------------
// Label normalization / extraction
// ----------------------------------------------------------------------------

export function normalizeLabels(labels: string[]): string[] {
  let resultLabels = [];
  let existing = {} as { [label: string]: boolean };
  for (let label of labels) {
    let labelSanizized = label.replace(/^\/+|\/+$/g, "");
    if (!(labelSanizized in existing) && labelSanizized !== "") {
      resultLabels.push(labelSanizized);
      existing[labelSanizized] = true;
    }
  }
  resultLabels.sort();
  return resultLabels;
}

export function extractLabelsFromString(labelsString: string): string[] {
  return normalizeLabels(labelsString.split(/\s/));
}

// ----------------------------------------------------------------------------
// Comparison
// ----------------------------------------------------------------------------

export function isSameLabels(labelsA: string[], labelsB: string[]): boolean {
  labelsA = normalizeLabels(labelsA);
  labelsB = normalizeLabels(labelsB);
  if (labelsA.length !== labelsB.length) {
    return false;
  } else {
    for (let i = 0; i < labelsA.length; ++i) {
      if (labelsA[i] !== labelsB[i]) {
        return false;
      }
    }
  }
  return true;
}

export function matchesOrIsSublabel(queryLabel: string, referenceLabel: string): boolean {
  if (queryLabel === referenceLabel) {
    return true;
  } else {
    let queryComponents = queryLabel.split("/");
    let referenceComponents = referenceLabel.split("/");
    if (queryComponents.length > referenceComponents.length) {
      return false;
    }
    for (let i = 0; i < queryComponents.length; ++i) {
      if (queryComponents[i] !== referenceComponents[i]) {
        return false;
      }
    }
    return true;
  }
}

export function doesLabelMatchLabels(queryLabel: string, labels: string[]): boolean {
  return labels.some((referenceLabel) => matchesOrIsSublabel(queryLabel, referenceLabel));
}

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

// ----------------------------------------------------------------------------
// Helper for extractLabels
// ----------------------------------------------------------------------------

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
