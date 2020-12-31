import React, { useReducer, useRef, useLayoutEffect } from "react";
import "./App.css";

import { Layout, Menu, Modal } from "antd";
import {
  EditOutlined,
  SettingOutlined,
  FileSearchOutlined,
  ReadOutlined,
  ReloadOutlined,
  PlusOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { MenuInfo } from "rc-menu/lib/interface";

import styled from "@emotion/styled";

import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import mousetrap from "mousetrap";

import { useEffectOnce, useDebouncedEffect } from "./utils/react_utils";
import { UiRow } from "./components/UiRow";
import { UploadOutlinedWithStatus } from "./components/HelperComponents";

import {
  EntryKind,
  Entry,
  Entries,
  EntryNote,
  EntryDoc,
  EntryFile,
  EntryLink,
  Labels,
} from "./types";
import * as fn from "./utils/fn_utils";
import * as entry_utils from "./utils/entry_utils";

import { Settings, StorageSession, settingsReducer } from "./settings";

import { Repo, Repos } from "./repo";
import * as repo_utils from "./repo";

import { MultiRepoGitOps } from "./git_ops";
import * as git_ops from "./git_ops";

import { MultiRepoFileMap } from "./filemap";

import * as io from "./io";
import * as path_utils from "./utils/path_utils";
import * as date_utils from "./utils/date_utils";
import * as label_utils from "./utils/label_utils";
import * as markdown_utils from "./utils/markdown_utils";
import * as octokit from "./octokit";
import * as web_utils from "./utils/web_utils";

import List from "./views/List";
import EntryView from "./views/EntryView";
import NoteEditor, { NoteEditorRef } from "./views/NoteEditor";
import PrepareCommit from "./views/PrepareCommit";
import AddEntry from "./views/AddEntry";
import SettingsView from "./views/SettingsView";

const { Content } = Layout;

const ContentStyled = styled(Content)`
  background: #fff;
`;

declare const Mousetrap: any;

Mousetrap.prototype.stopCallback = function (
  e: KeyboardEvent,
  element: HTMLElement,
  combo: string
) {
  // https://craig.is/killing/mice
  // console.log("stopCallback", e, element, combo);
  if (element.tagName === "INPUT" && e.key === "Enter") {
    // don't fire mousetrap events for ENTER on input elements
    return true;
  } else {
    // fire in all other cases
    return false;
  }
};

// https://stackoverflow.com/a/821227/1804173
window.onbeforeunload = function () {
  return "Are you sure you want to navigate away? Uncommitted modifications will be lost.";
};

// ----------------------------------------------------------------------------
// Utils
// ----------------------------------------------------------------------------

function getScrollPosition(): number {
  return document.documentElement.scrollTop || document.body.scrollTop;
}

function setScrollPosition(pos: number) {
  document.documentElement.scrollTop = document.body.scrollTop = pos;
}

// ----------------------------------------------------------------------------
// App state
// ----------------------------------------------------------------------------

enum Page {
  // Real pages
  Main = "Main",
  Settings = "Settings",
  EntryView = "NoteView",
  NoteEditor = "NoteEditor",
  Commit = "Commit",
  // Pseudo pages
  Reload = "Reload",
  Add = "Add",
}

type EditorPosition = {
  scroll?: number;
  cursor?: monacoEditor.Position;
};

const noteViewPositions: { [index: string]: number } = {};
const noteEditorPositions: { [index: string]: EditorPosition } = {};

// Mousetrap bindings are pulled out of the rendering look so that
// in the rendering loop there is a lightweight re-attaching of the
// keyboard hander callbacks (no repeated calls to moustrap.bind).
const keyboardHandlers = {
  handleSwitchEdit: () => {},
  handleSearch: () => {},
};

mousetrap.bind(["command+e", "ctrl+e"], () => {
  keyboardHandlers.handleSwitchEdit();
  return false;
});
mousetrap.bind(["command+p", "ctrl+p"], () => {
  keyboardHandlers.handleSearch();
  return false;
});

// ----------------------------------------------------------------------------
// Reducer types
// ----------------------------------------------------------------------------

type State = {
  entries: Entries;
  fileEntries: EntryFile[];
  linkEntries: EntryLink[];
  labels: Labels;
  isReloading: boolean;
  activeEntryIdx?: number;
  page: Page;
  allFileMapsOrig: MultiRepoFileMap;
  allFileMapsEdit: MultiRepoFileMap;
  stagedGitOps: MultiRepoGitOps;
};

enum ActionKind {
  SwitchToPage = "SwitchToPage",
  SwitchToEntryViewOnIdx = "SwitchToEntryViewOnIdx",
  StartReloading = "StartReloading",
  ReloadingDone = "ReloadingDone",
  UpdateNoteContent = "UpdateNoteContent",
  UpdateEntryMeta = "UpdateEntryMeta",
  UpdateLinkEntryMeta = "UpdateLinkEntryMeta",
  CreateEntry = "CreateEntry",
  SuccessfulCommit = "SuccessfulCommit",
}

type ActionSwitchToPage = {
  kind: ActionKind.SwitchToPage;
  page: Page;
};
type ActionSwitchToEntryViewOnIdx = {
  kind: ActionKind.SwitchToEntryViewOnIdx;
  idx: number;
};
type ActionStartReloading = {
  kind: ActionKind.StartReloading;
};
type ActionReloadingDone = {
  kind: ActionKind.ReloadingDone;
  entries: Entries;
  fileEntries: EntryFile[];
  linkEntries: EntryLink[];
  labels: Labels;
  allFileMapsOrig: MultiRepoFileMap;
  allFileMapsEdit: MultiRepoFileMap;
  stagedGitOps: MultiRepoGitOps;
};
type ActionUpdateNoteContent = {
  kind: ActionKind.UpdateNoteContent;
  content: string;
};
type ActionUpdateEntryMeta = {
  kind: ActionKind.UpdateEntryMeta;
  title: string;
  labels: string[];
};
type ActionUpdateLinkEntryMeta = {
  kind: ActionKind.UpdateLinkEntryMeta;
  title: string;
  ownLabels: string[];
};

type ActionCreateEntry = {
  kind: ActionKind.CreateEntry;
  entryKind: EntryKind;
  title: string;
  labels: string[];
  content: string;
  repo: Repo;
  location?: string;
  extension?: string;
};
type ActionSuccessfulCommit = {
  kind: ActionKind.SuccessfulCommit;
};

type Action =
  | ActionSwitchToPage
  | ActionSwitchToEntryViewOnIdx
  | ActionStartReloading
  | ActionReloadingDone
  | ActionUpdateNoteContent
  | ActionUpdateEntryMeta
  | ActionUpdateLinkEntryMeta
  | ActionCreateEntry
  | ActionSuccessfulCommit;

// *** State change helpers

function modifyFileEntry(
  oldFileEntries: EntryFile[],
  oldLinkEntries: EntryLink[],
  oldEntry: EntryFile,
  newEntry: EntryFile
): [EntryFile[], EntryLink[], Entry[], number] | undefined {
  /*
  Updating a file entry is a slighty tricky operation, because it implies changes to
  linkEntries, allEntries, and the active index. Initial brainstorming was:

  Since the active entry content may have received new links or links were removed, the
  length of the combined entries can change. This also means that the activeEntryIdx
  may longer be valid, and needs to be reset accordingly. Note that it isn't safe to assume
  that the activeEntryIdx doesn't change because notes are always sorted before links.
  In general the activeEntryIdx can point to links as well, not only notes, so it does
  not necessarily "point to a stable area".

  Note: Currently the oldEntry is needed purely for its `key`, but still passed in
  as a full entry for symmetry reasons.
  */

  // Identify active entry within old file entries
  let fileEntryIdx = oldFileEntries.findIndex((entry) => entry.key === oldEntry.key);
  if (fileEntryIdx === -1) {
    // Should be unreachable because we have verified that the active entry is a note.
    console.log("Illegal update: Could not find a file entry for entry key " + oldEntry.key);
    return;
  }

  // Modify the file entries
  let newFileEntries = oldFileEntries.slice(0);
  newFileEntries[fileEntryIdx] = newEntry;

  // Recompute links and all entries
  let [newLinkEntries, newEntries] = entry_utils.recomputeEntries(newFileEntries, oldLinkEntries);

  // Recompute active entry idx
  // Note: Identifiation must not use `oldEntry.key` because it can change.
  let newActiveEntryIdx = newEntries.findIndex((entry) => entry === newEntry);
  if (newActiveEntryIdx === -1) {
    // Should be unreachable, the active entry shouldn't disappear.
    console.log("Logic error: Active entry has disappeared.");
    return;
  }

  return [newFileEntries, newLinkEntries, newEntries, newActiveEntryIdx];
}

function modifyLinkEntry(
  oldFileEntries: EntryFile[],
  oldLinkEntries: EntryLink[],
  oldEntry: EntryLink,
  newEntry: EntryLink
): [EntryLink[], Entry[], number] | undefined {
  // Identify active entry within old link entries
  let linkEntryIdx = oldLinkEntries.findIndex((entry) => entry.key === oldEntry.key);
  if (linkEntryIdx === -1) {
    // Should be unreachable because we have verified that the active entry is a note.
    console.log("Illegal update: Could not find a link entry for entry key " + oldEntry.key);
    return;
  }

  // Modify the link entries
  let tmpLinkEntries = oldLinkEntries.slice(0);
  tmpLinkEntries[linkEntryIdx] = newEntry;

  // Recompute links and all entries
  let [newLinkEntries, newEntries] = entry_utils.recomputeEntries(oldFileEntries, tmpLinkEntries);

  // Recompute active entry idx
  // Note: Resetting the index is needed because title changes can imply order changes.
  let newActiveEntryIdx = newEntries.findIndex((entry) => entry === newEntry);
  if (newActiveEntryIdx === -1) {
    // Should be unreachable, the active entry shouldn't disappear.
    console.log("Logic error: Active entry has disappeared.");
    return;
  }

  return [newLinkEntries, newEntries, newActiveEntryIdx];
}

function addEntry(
  oldFileEntries: EntryFile[],
  oldLinkEntries: EntryLink[],
  newAllFileMapsEdit: MultiRepoFileMap,
  addEntryAction: ActionCreateEntry
): [EntryFile[], EntryLink[], Entry[], number | undefined] {
  const tuple = <T extends any[]>(...args: T): T => args;

  const getNewEntriesForAddNote = () => {
    let newFileEntries = oldFileEntries.slice(0);
    let date = date_utils.getDateNow();
    let newEntry: EntryNote = entry_utils.recomputeKey({
      title: addEntryAction.title,
      priority: 0,
      labels: addEntryAction.labels,
      content: {
        kind: EntryKind.NoteMarkdown,
        repo: addEntryAction.repo!,
        location: addEntryAction.location!,
        extension: "md",
        timeCreated: date,
        timeUpdated: date,
        text: "",
        html: "",
        links: [],
      },
    });
    newFileEntries.push(newEntry);
    let [newLinkEntries, newEntries] = entry_utils.recomputeEntries(newFileEntries, oldLinkEntries);

    // Staging
    stageContent(newEntry, newAllFileMapsEdit);
    stageMeta(newEntry, newAllFileMapsEdit);

    return tuple(newFileEntries, newLinkEntries, newEntries, newEntry);
  };

  const getNewEntriesForAddDocument = () => {
    let newFileEntries = oldFileEntries.slice(0);
    let date = date_utils.getDateNow();
    let newEntry: EntryDoc = entry_utils.recomputeKey({
      title: addEntryAction.title,
      priority: 0,
      labels: addEntryAction.labels,
      content: {
        kind: EntryKind.Document,
        repo: addEntryAction.repo!,
        location: addEntryAction.location!,
        extension: addEntryAction.extension!,
        timeCreated: date,
        timeUpdated: date,
        stagedData: addEntryAction.content,
      },
    });
    newFileEntries.push(newEntry);
    let [newLinkEntries, newEntries] = entry_utils.recomputeEntries(newFileEntries, oldLinkEntries);

    // Staging
    stageContent(newEntry, newAllFileMapsEdit);
    stageMeta(newEntry, newAllFileMapsEdit);

    return tuple(newFileEntries, newLinkEntries, newEntries, newEntry);
  };

  const getNewEntriesForAddLink = () => {
    let newFileEntries = oldFileEntries; // keep
    let tmpLinkEntries = oldLinkEntries.slice(0);
    let newEntry: EntryLink = entry_utils.recomputeKey({
      title: addEntryAction.title,
      priority: 0,
      labels: addEntryAction.labels,
      content: {
        kind: EntryKind.Link,
        target: addEntryAction.content,
        referencedBy: [],
        standaloneRepo: addEntryAction.repo,
        refRepos: [],
        refLocations: [],
        ownLabels: addEntryAction.labels,
      },
    });
    tmpLinkEntries.push(newEntry);
    let [newLinkEntries, newEntries] = entry_utils.recomputeEntries(newFileEntries, tmpLinkEntries);

    // Staging
    entry_utils.stageLinkDBUpdate(newLinkEntries, newAllFileMapsEdit);

    return tuple(newFileEntries, newLinkEntries, newEntries, newEntry);
  };

  let [newFileEntries, newLinkEntries, newEntries, newEntry] =
    addEntryAction.entryKind === EntryKind.NoteMarkdown
      ? getNewEntriesForAddNote()
      : addEntryAction.entryKind === EntryKind.Document
      ? getNewEntriesForAddDocument()
      : getNewEntriesForAddLink();

  // Compute active entry idx for new entry
  let newActiveEntryIdx = newEntries.findIndex((entry) => entry === newEntry) as number | undefined;
  if (newActiveEntryIdx === -1) {
    // Should be unreachable.
    console.log("Logic error: New entry has disappeared.");
    newActiveEntryIdx = undefined;
  }

  // Write new link DB
  entry_utils.stageLinkDBUpdate(newLinkEntries, newAllFileMapsEdit);

  return [newFileEntries, newLinkEntries, newEntries, newActiveEntryIdx];
}

// Stage helpers

function stageNoteContent(entry: EntryNote, allFileMapsEdit: MultiRepoFileMap) {
  let repo = entry.content.repo;
  let path = path_utils.getPath(entry);
  allFileMapsEdit.get(repo)?.data.setContent(path, entry.content.text);
}

function stageDocumentContent(entry: EntryDoc, allFileMapsEdit: MultiRepoFileMap) {
  let repo = entry.content.repo;
  let path = path_utils.getPath(entry);
  if (entry.content.stagedData != null) {
    allFileMapsEdit.get(repo)?.data.setContent(path, entry.content.stagedData);
  }
}

function stageContent(entry: EntryFile, allFileMapsEdit: MultiRepoFileMap) {
  if (entry_utils.isNote(entry)) {
    stageNoteContent(entry, allFileMapsEdit);
  } else if (entry_utils.isDoc(entry)) {
    stageDocumentContent(entry, allFileMapsEdit);
  }
}

function stageMeta(entry: EntryFile, allFileMapsEdit: MultiRepoFileMap) {
  let metaData = entry_utils.extractMetaData(entry);
  let metaDataContent = io.serializeMetaData(metaData);

  let repo = entry.content.repo;
  let path = path_utils.getPaths(entry).metaPath;
  allFileMapsEdit.get(repo)?.data.setContent(path, metaDataContent);
}

// ----------------------------------------------------------------------------
// Main state reducer
// ----------------------------------------------------------------------------

function reducer(state: State, action: Action): State {
  switch (action.kind) {
    case ActionKind.SwitchToPage: {
      return { ...state, page: action.page };
    }
    case ActionKind.SwitchToEntryViewOnIdx: {
      return { ...state, page: Page.EntryView, activeEntryIdx: action.idx };
    }
    case ActionKind.StartReloading: {
      return { ...state, isReloading: true };
    }
    case ActionKind.ReloadingDone: {
      // Note that a reload discards existing stagedGitOps due to the reset semantics.
      return {
        ...state,
        isReloading: false,
        entries: action.entries,
        fileEntries: action.fileEntries,
        linkEntries: action.linkEntries,
        labels: action.labels,
        allFileMapsOrig: action.allFileMapsOrig,
        allFileMapsEdit: action.allFileMapsEdit,
        stagedGitOps: action.stagedGitOps,
      };
    }
    case ActionKind.UpdateNoteContent: {
      if (state.activeEntryIdx == null) {
        console.log("Illegal update: UpdateNoteContent called without an active entry.");
        return state;
      }

      let activeEntry = state.entries[state.activeEntryIdx!];
      if (!entry_utils.isNote(activeEntry)) {
        console.log("Illegal update: UpdateNoteContent called when active entry wasn't a note.");
        return state;
      }

      if (action.content !== activeEntry.content.text) {
        let [html, links] = markdown_utils.processMarkdownText(action.content);

        // TODO: It would be nice if we would only update the "timeUpdate" in case
        // the content is different from the original content, i.e., in case of a
        // revert the timeUpdated gets reverted as well. However that is a bit tricky.
        // It is not so easy to get the original timestamp. We'd compare the
        // current note content to the orignal note content. If it is the same
        // we need the original timestamp. We'd probably have to re-parse the
        // original meta data and extract it from there. Also we have to be
        // careful about other modifications to meta data. I.e., if the note
        // content matches to the original note content, but the labels have
        // changed, we'd need to set `timeUpdated` as well. So the condition
        // actually need to be more complex than just content comparison.
        // Perhaps a helper function based on the 4 variables oldFile, newFile,
        // oldMetaFile, newMetaFile would be good?
        let activeEntryModified = entry_utils.recomputeKey({
          ...activeEntry,
          content: {
            ...activeEntry.content,
            text: action.content,
            html: html,
            links: links,
            timeUpdated: date_utils.getDateNow(),
          },
        });
        let result = modifyFileEntry(
          state.fileEntries,
          state.linkEntries,
          activeEntry,
          activeEntryModified
        );
        if (result == null) {
          return state;
        }
        let [newFileEntries, newLinkEntries, newEntries, newActiveEntryIdx] = result;

        // Stage git ops
        let newAllFileMapsEdit = state.allFileMapsEdit.clone();
        stageNoteContent(activeEntryModified, newAllFileMapsEdit);
        stageMeta(activeEntryModified, newAllFileMapsEdit);

        // Write new link DB
        entry_utils.stageLinkDBUpdate(newLinkEntries, newAllFileMapsEdit);

        // Diff to determine staged git ops
        let stagedGitOps = git_ops.diffMultiFileMaps(state.allFileMapsOrig, newAllFileMapsEdit);

        return {
          ...state,
          activeEntryIdx: newActiveEntryIdx,
          entries: newEntries,
          fileEntries: newFileEntries,
          linkEntries: newLinkEntries,
          allFileMapsEdit: newAllFileMapsEdit,
          stagedGitOps: stagedGitOps,
        };
      } else {
        return state;
      }
    }
    case ActionKind.UpdateEntryMeta: {
      if (state.activeEntryIdx == null) {
        console.log("Illegal update: UpdateEntryMeta called without an active entry.");
        return state;
      }

      let activeEntry = state.entries[state.activeEntryIdx!];
      if (entry_utils.isNote(activeEntry)) {
        let oldTitle = activeEntry.title;
        let newTitle = action.title;

        let oldLabels = activeEntry.labels.slice(0);
        let newLabels = action.labels;

        let titleChanged = oldTitle !== newTitle;
        let labelsChanged = !label_utils.isSameLabels(oldLabels, newLabels);

        if (titleChanged || labelsChanged) {
          let activeEntryModified = entry_utils.recomputeKey({
            ...activeEntry,
            title: newTitle,
            labels: action.labels,
          });
          let result = modifyFileEntry(
            state.fileEntries,
            state.linkEntries,
            activeEntry,
            activeEntryModified
          );
          if (result == null) {
            return state;
          }
          let [newFileEntries, newLinkEntries, newEntries, newActiveEntryIdx] = result;

          // Stage git ops
          // Note: Currently we don't care about titleChanged/labelsChanged values
          // and just delete + re-add the files unconditionally for simplicity.
          let newAllFileMapsEdit = state.allFileMapsEdit.clone();

          let repo = activeEntryModified.content.repo;
          let oldPaths = path_utils.getPaths(activeEntry);
          let newPaths = path_utils.getPaths(activeEntryModified);
          let metaData = entry_utils.extractMetaData(activeEntryModified);
          let entryContent = activeEntryModified.content.text;
          let metaDataContent = io.serializeMetaData(metaData);
          newAllFileMapsEdit.get(repo)?.data.delete(oldPaths.path);
          newAllFileMapsEdit.get(repo)?.data.delete(oldPaths.metaPath);
          newAllFileMapsEdit.get(repo)?.data.setContent(newPaths.path, entryContent);
          newAllFileMapsEdit.get(repo)?.data.setContent(newPaths.metaPath, metaDataContent);

          // Diff to determine staged git ops
          let stagedGitOps = git_ops.diffMultiFileMaps(state.allFileMapsOrig, newAllFileMapsEdit);

          return {
            ...state,
            activeEntryIdx: newActiveEntryIdx,
            entries: newEntries,
            fileEntries: newFileEntries,
            linkEntries: newLinkEntries,
            allFileMapsEdit: newAllFileMapsEdit,
            stagedGitOps: stagedGitOps,
            labels: label_utils.extractLabels(newEntries),
          };
        } else {
          return state;
        }
      } else {
        return state;
      }
    }
    case ActionKind.UpdateLinkEntryMeta: {
      let activeEntry = state.entries[state.activeEntryIdx!];
      if (entry_utils.isLink(activeEntry)) {
        let oldTitle = activeEntry.title;
        let newTitle = action.title;

        let oldOwnLabels = activeEntry.content.ownLabels.slice(0);
        let newOwnLabels = action.ownLabels;

        let titleChanged = oldTitle !== newTitle;
        let labelsChanged = !label_utils.isSameLabels(oldOwnLabels, newOwnLabels);

        if (titleChanged || labelsChanged) {
          let activeEntryModified = entry_utils.recomputeKey({
            ...activeEntry,
            title: newTitle,
            content: {
              ...activeEntry.content,
              ownLabels: newOwnLabels,
            },
          });
          let result = modifyLinkEntry(
            state.fileEntries,
            state.linkEntries,
            activeEntry,
            activeEntryModified
          );
          if (result == null) {
            return state;
          }
          let [newLinkEntries, newEntries, newActiveEntryIdx] = result;

          // Stage git ops
          let newAllFileMapsEdit = state.allFileMapsEdit.clone();

          // Write new link DB
          entry_utils.stageLinkDBUpdate(newLinkEntries, newAllFileMapsEdit);

          // Diff to determine staged git ops
          let stagedGitOps = git_ops.diffMultiFileMaps(state.allFileMapsOrig, newAllFileMapsEdit);

          return {
            ...state,
            activeEntryIdx: newActiveEntryIdx,
            entries: newEntries,
            linkEntries: newLinkEntries,
            allFileMapsEdit: newAllFileMapsEdit,
            stagedGitOps: stagedGitOps,
            labels: label_utils.extractLabels(newEntries),
          };
        } else {
          return state;
        }
      } else {
        return state;
      }
    }
    case ActionKind.CreateEntry: {
      let newAllFileMapsEdit = state.allFileMapsEdit.clone();

      let [newFileEntries, newLinkEntries, newEntries, newActiveEntryIdx] = addEntry(
        state.fileEntries,
        state.linkEntries,
        newAllFileMapsEdit,
        action
      );

      return {
        ...state,
        activeEntryIdx: newActiveEntryIdx,
        page: Page.EntryView,
        entries: newEntries,
        fileEntries: newFileEntries,
        linkEntries: newLinkEntries,
        allFileMapsEdit: newAllFileMapsEdit,
        stagedGitOps: git_ops.diffMultiFileMaps(state.allFileMapsOrig, newAllFileMapsEdit),
        labels: label_utils.extractLabels(newEntries),
      };
    }
    case ActionKind.SuccessfulCommit: {
      // Design decision: On a successful commit, we treat the current memory
      // content of the app as the ground truth of the repo content. This assumes
      // that the commit indeed has exactly resulted in what the app state is.
      // Let's see how valid this assumption is...
      // The alternative would be to re-trigger a reload entries after the commit
      // succeeded. The problem with that could be that there might be a delay in
      // the visibility of the changes. I.e., if we refresh too quickly, perhaps
      // the fetch would not pick up the change even if it succeeded, but still
      // requires a some time to propagate (eventual consistency...). Delaying the
      // refresh arbitrarily feels like a hack, and if the assumption is valid, we
      // can safe unnecessary API requests / time.
      return {
        ...state,
        allFileMapsOrig: state.allFileMapsEdit.clone(),
        stagedGitOps: new MultiRepoGitOps(),
      };
    }

    default: {
      fn.assertUnreachable(action);
    }
  }
}

// ----------------------------------------------------------------------------
// App
// ----------------------------------------------------------------------------

function App({ initSettings, session }: { initSettings: Settings; session: StorageSession }) {
  console.log("Rendering: App");

  useEffectOnce(() => {
    reloadEntries(initSettings.repos);
  });

  // *** Settings: Repos state

  const [settings, settingsDispatch] = useReducer(settingsReducer, initSettings);

  // Effect to store repo changes to local storage.
  // Note that it is slightly awkward that we re-store the repos data
  // after the initial loading, because it uses setRepos. But on first
  // glance that shouldn't cause trouble and is better then reloading
  // the repo data as an argument to useState in every re-render.
  useDebouncedEffect(
    () => {
      // console.log("Storing settings:", settings);
      session.storeSettings(settings);
    },
    300,
    [session, settings]
  );

  async function reloadEntries(newRepos: Repos) {
    console.log("Reloading entries");

    dispatch({ kind: ActionKind.StartReloading });

    let newActiveRepos = repo_utils.filterActiveRepos(newRepos);
    let [newFileEntries, allFileMapsOrig, allFileMapsEdit, allErrors] = await octokit.loadEntries(
      newActiveRepos,
      settings.auth
    );

    if (allErrors.length > 0) {
      Modal.error({
        title: "Reload errors",
        content: `There were ${allErrors.length} request errors. Check console log for details.`,
      });
    }

    let newLinkEntriesWithoutRefsResoled = entry_utils.extractLinkEntriesFromLinkDB(
      allFileMapsOrig
    );

    let [newLinkEntries, newEntries] = entry_utils.recomputeEntries(
      newFileEntries,
      newLinkEntriesWithoutRefsResoled
    );

    // Write new link DB
    entry_utils.stageLinkDBUpdate(newLinkEntries, allFileMapsEdit);

    // Diff to determine staged git ops
    let stagedGitOps = git_ops.diffMultiFileMaps(allFileMapsOrig, allFileMapsEdit);

    dispatch({
      kind: ActionKind.ReloadingDone,
      entries: newEntries,
      fileEntries: newFileEntries,
      linkEntries: newLinkEntries,
      labels: label_utils.extractLabels(newEntries),
      allFileMapsOrig: allFileMapsOrig,
      allFileMapsEdit: allFileMapsEdit,
      stagedGitOps: stagedGitOps,
    });
  }

  // *** Main state

  const [state, dispatch] = useReducer(reducer, {
    entries: [],
    fileEntries: [],
    linkEntries: [],
    labels: [],
    isReloading: false,
    activeEntryIdx: undefined,
    page: Page.Main,
    stagedGitOps: new MultiRepoGitOps(),
    allFileMapsOrig: new MultiRepoFileMap(),
    allFileMapsEdit: new MultiRepoFileMap(),
  });

  // *** Derived state

  const getActiveEntry = (): Entry | undefined => {
    if (state.activeEntryIdx != null) {
      return state.entries[state.activeEntryIdx];
    }
  };

  const activeEntryIsNote = (): boolean => {
    let activeEntry = getActiveEntry();
    if (activeEntry == null) {
      return false;
    } else {
      return entry_utils.isNote(activeEntry);
    }
  };

  const anyStagedChange = () => {
    return state.stagedGitOps.map((repo, ops) => ops.length).reduce((a, b) => a + b, 0) > 0;
  };

  // *** Refs

  let editorRef = useRef<NoteEditorRef>(null);
  let searchInputRef = useRef<HTMLInputElement>(null);

  // *** State change helper functions

  const updateEntryContent = () => {
    if (editorRef.current != null) {
      let newText = editorRef.current.getEditorContent();
      if (newText != null) {
        dispatch({ kind: ActionKind.UpdateNoteContent, content: newText });
      }
    }
  };

  const storeNoteViewPosition = () => {
    let activeEntry = getActiveEntry();
    if (activeEntry != null) {
      noteViewPositions[activeEntry.key!] = getScrollPosition();
    }
  };
  const restoreNoteViewPosition = () => {
    let activeEntry = getActiveEntry();
    if (activeEntry != null && activeEntry.key! in noteViewPositions) {
      targetBodyPosition.current = noteViewPositions[activeEntry.key!];
    }
  };
  const storeNoteEditorPosition = () => {
    // console.log("At time of switching editor scroll is:", editorRef.current?.getScrollPosition())
    let activeEntry = getActiveEntry();
    if (activeEntry != null && editorRef.current != null) {
      let editorScrollPos = editorRef.current.getScrollPosition();
      let editorCursorPos = editorRef.current.getCursorPosition();
      noteEditorPositions[activeEntry.key!] = {
        scroll: editorScrollPos,
        cursor: editorCursorPos,
      };
    }
  };
  const restoreNoteEditorPosition = () => {
    // Since the editor isn't mounted yet (editorRef.current == null) at the time
    // of restoring, we need to postpone it. However we cannot use useLayoutEffect
    // like in the case of normal DOM updates, because the editor will no be available
    // immediately. The actual restoring has to be postponed until the onEditorDidMount
    // callback
    let activeEntry = getActiveEntry();
    if (activeEntry != null && activeEntry.key! in noteEditorPositions) {
      targetEditorPosition.current = noteEditorPositions[activeEntry.key!];
    }
  };

  // *** Keyboard handlers

  const prepareSwitchFrom = (pageFrom: Page) => {
    switch (pageFrom) {
      case Page.EntryView:
        storeNoteViewPosition();
        restoreNoteEditorPosition(); // TODO: Shouldn't the restore go into a separate postprocessSwitchTo?
        break;
      case Page.NoteEditor:
        storeNoteEditorPosition();
        restoreNoteViewPosition(); // TODO: Shouldn't the restore go into a separate postprocessSwitchTo?
        updateEntryContent();
        break;
      default: {
        break;
      }
    }
  };

  keyboardHandlers.handleSwitchEdit = () => {
    if (state.page === Page.EntryView && activeEntryIsNote()) {
      prepareSwitchFrom(state.page);
      dispatch({ kind: ActionKind.SwitchToPage, page: Page.NoteEditor });
    } else if (state.page === Page.NoteEditor && activeEntryIsNote()) {
      prepareSwitchFrom(state.page);
      dispatch({ kind: ActionKind.SwitchToPage, page: Page.EntryView });
    } else {
      console.log("Switching not possible");
    }
  };
  keyboardHandlers.handleSearch = () => {
    if (state.page !== Page.Main) {
      // setPage(Page.Main);
      dispatch({ kind: ActionKind.SwitchToPage, page: Page.Main });
    } else if (searchInputRef.current != null) {
      searchInputRef.current.focus();
    }
  };

  // Probably not much sense to useCallback here, because it has too many dependencies?
  const onClickMenu = (menuInfo: MenuInfo) => {
    // Should the prepareSwitchFrom(page) run before anything unconditionally,
    // so that even a reloadEntries gives the editor a chance to save its
    // content?

    let clickedPage = menuInfo.key as Page;
    switch (clickedPage) {
      case Page.Reload: {
        if (!state.isReloading) {
          if (anyStagedChange() === false) {
            reloadEntries(settings.repos);
          } else {
            Modal.confirm({
              title: "Do you want to reload entries?",
              icon: <ExclamationCircleOutlined />,
              content:
                "You have uncommitted changes. Reloading the repository content will discard local changes.",
              onOk() {
                reloadEntries(settings.repos);
              },
            });
          }
        }
        break;
      }
      default: {
        prepareSwitchFrom(state.page);
        dispatch({ kind: ActionKind.SwitchToPage, page: clickedPage });
      }
    }
  };

  // *** Layout effects

  const targetBodyPosition = useRef<number | null>(null);
  const targetEditorPosition = useRef<EditorPosition | null>(null);

  useLayoutEffect(() => {
    // console.log("[layout effect] scrolling to:", targetScrollPosition.current)
    if (targetBodyPosition.current != null) {
      setScrollPosition(targetBodyPosition.current);
      targetBodyPosition.current = null;
    }
  });

  // TODO: requires useCallback?
  const onEditorDidMount = () => {
    if (targetEditorPosition.current != null) {
      if (targetEditorPosition.current.scroll != null) {
        editorRef.current?.setScrollPosition(targetEditorPosition.current.scroll);
      }
      if (targetEditorPosition.current.cursor != null) {
        editorRef.current?.setCursorPosition(targetEditorPosition.current.cursor);
      }
      targetEditorPosition.current = null;
    }
    // https://github.com/suren-atoyan/monaco-react/issues/141
    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  };

  // *** Render helpers
  const renderCenter = () => {
    switch (state.page) {
      case Page.Main: {
        return (
          <List
            ref={searchInputRef}
            entries={state.entries}
            labels={state.labels}
            onEnterEntry={(i) => {
              dispatch({ kind: ActionKind.SwitchToEntryViewOnIdx, idx: i });
            }}
          />
        );
      }
      case Page.EntryView: {
        return (
          <EntryView
            entry={getActiveEntry()}
            onUpdateNoteData={(title, labels) => {
              dispatch({ kind: ActionKind.UpdateEntryMeta, title: title, labels: labels });
            }}
            onUpdateLinkData={(title, ownLabels) => {
              dispatch({
                kind: ActionKind.UpdateLinkEntryMeta,
                title: title,
                ownLabels: ownLabels,
              });
            }}
            onOpenDocument={async (entry: EntryDoc) => {
              let contentBase64 = await octokit.downloadDocument(entry, settings.auth, false);
              if (contentBase64.isOk()) {
                let filename = path_utils.getBasename(entry);
                let extension = entry.content.extension;
                web_utils.downloadFromMemory(filename, extension, contentBase64.value);
              }
            }}
          />
        );
      }
      case Page.NoteEditor: {
        return (
          <NoteEditor
            entry={getActiveEntry()}
            settings={settings.editor}
            ref={editorRef}
            onEditorDidMount={onEditorDidMount}
          />
        );
      }
      case Page.Commit: {
        return (
          <PrepareCommit
            auth={settings.auth}
            ops={state.stagedGitOps}
            onSuccessfulCommit={() => {
              dispatch({ kind: ActionKind.SuccessfulCommit });
            }}
          />
        );
      }
      case Page.Add: {
        return (
          <AddEntry
            repos={repo_utils.filterActiveRepos(settings.repos)}
            onAdded={({ entryKind, repo, title, labels, content, location, extension }) => {
              dispatch({
                kind: ActionKind.CreateEntry,
                entryKind,
                repo,
                title,
                labels,
                content,
                location,
                extension,
              });
            }}
          />
        );
      }
      case Page.Settings: {
        return <SettingsView settings={settings} dispatch={settingsDispatch} />;
      }
    }
  };

  return (
    <Layout style={{ height: "100%" }}>
      {/* According to Antd style guide the menu should be wrapped in <Header> but I prefer the smaller sized menu. */}
      <UiRow
        center={
          <Menu theme="dark" mode="horizontal" selectedKeys={[state.page]} onClick={onClickMenu}>
            <Menu.Item
              key={Page.Main}
              icon={<FileSearchOutlined style={{ fontSize: 16 }} />}
              title="Overview"
            />
            <Menu.Item
              key={Page.EntryView}
              icon={<ReadOutlined style={{ fontSize: 16 }} />}
              title="Entry Viewer"
              disabled={state.activeEntryIdx == null}
            />
            <Menu.Item
              key={Page.NoteEditor}
              icon={<EditOutlined style={{ fontSize: 16 }} />}
              title="Editor"
              disabled={!activeEntryIsNote()}
            />
            <Menu.Item
              key={Page.Add}
              icon={<PlusOutlined style={{ fontSize: 16 }} />}
              title="Add new entry"
            />
            <Menu.Item
              key={Page.Commit}
              icon={<UploadOutlinedWithStatus status={anyStagedChange() === true} />}
              title="Commit staged changes"
            />
            <Menu.Item
              key={Page.Reload}
              icon={
                !state.isReloading ? (
                  <ReloadOutlined style={{ fontSize: 16 }} />
                ) : (
                  <LoadingOutlined style={{ fontSize: 16 }} />
                )
              }
              title="Reload entries"
            />
            <Menu.Item
              key={Page.Settings}
              icon={<SettingOutlined style={{ fontSize: 16 }} />}
              title="Settings"
            />
          </Menu>
        }
        style={{ background: "#001529" }}
      />
      <ContentStyled>{renderCenter()}</ContentStyled>
    </Layout>
  );
}

export default App;
