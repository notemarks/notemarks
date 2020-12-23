import React, { useState, useReducer, useEffect, useRef, useLayoutEffect } from "react";
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

import { useEffectOnce } from "./utils/react_utils";
import { UiRow } from "./components/UiRow";
import { UploadOutlinedWithStatus } from "./components/HelperComponents";

import { Entry, Entries, EntryFile, EntryLink, Labels } from "./types";
import * as fn from "./utils/fn_utils";
import * as entry_utils from "./utils/entry_utils";
import * as label_utils from "./utils/label_utils";
import * as markdown_utils from "./utils/markdown_utils";

import { Repos } from "./repo";
import * as repo_utils from "./repo";

import { MultiRepoGitOps } from "./git_ops";
import * as git_ops from "./git_ops";

import { MultiRepoFileMap } from "./filemap";

import { loadEntries } from "./octokit";

import * as io from "./io";
import * as path_utils from "./utils/path_utils";
import * as date_utils from "./utils/date_utils";

import List from "./views/List";
import NoteView from "./views/NoteView";
import NoteEditor, { NoteEditorRef } from "./views/NoteEditor";
import PrepareCommit from "./views/PrepareCommit";
import Settings from "./views/Settings";

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
  NoteView = "NoteView",
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
type ActionSuccessfulCommit = {
  kind: ActionKind.SuccessfulCommit;
};

type Action =
  | ActionSwitchToPage
  | ActionSwitchToEntryViewOnIdx
  | ActionStartReloading
  | ActionReloadingDone
  | ActionUpdateNoteContent
  | ActionSuccessfulCommit;

// ----------------------------------------------------------------------------
// App
// ----------------------------------------------------------------------------

function App() {
  console.log("Rendering: App");

  useEffectOnce(() => {
    let initRepos = repo_utils.getStoredRepos();
    console.log("Initially loaded repos:", initRepos);
    setRepos(initRepos);
    reloadEntries(initRepos);
  });

  // *** Settings: Repos state

  const [repos, setRepos] = useState([] as Repos);

  // Effect to store repo changes to local storage.
  // Note that it is slightly awkward that we re-store the repos data
  // after the initial loading, because it uses setRepos. But on first
  // glance that shouldn't cause trouble and is better then reloading
  // the repo data as an argument to useState in every re-render.
  useEffect(() => {
    // console.log("Storing repos:", repos)
    repo_utils.setStoredRepos(repos);
  }, [repos]);

  async function reloadEntries(newRepos: Repos) {
    console.log("Reloading entries");

    dispatch({ kind: ActionKind.StartReloading });

    let newActiveRepos = repo_utils.filterActiveRepos(newRepos);
    let [newFileEntries, allFileMapsOrig, allFileMapsEdit, allErrors] = await loadEntries(
      newActiveRepos
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

  function reducer(state: State, action: Action): State {
    switch (action.kind) {
      case ActionKind.SwitchToPage: {
        return { ...state, page: action.page };
      }
      case ActionKind.SwitchToEntryViewOnIdx: {
        return { ...state, page: Page.NoteView, activeEntryIdx: action.idx };
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

          /*
          Tricky: Since the active entry may have received new links or links were removed, the
          length of the combined entries can change. This also means that the activeEntryIdx
          may longer be valid, and needs to be reset accordingly. Note that it isn't safe to assume
          that the activeEntryIdx doesn't change because notes are always sorted before links.
          In general the activeEntryIdx can point to links as well, not only notes, so it does
          not necessarily "point to a stable area".
          */

          // Identify active entry within file entries
          let fileEntryIdx = state.fileEntries.findIndex((entry) => entry.key === activeEntry.key);
          if (fileEntryIdx === -1) {
            // Should be unreachable because we have verified that the active entry is a note.
            console.log(
              "Illegal update: Could not find a file entry for index " + state.activeEntryIdx
            );
            return state;
          }

          // Modify the file entries
          let newFileEntries = state.fileEntries.slice(0);
          newFileEntries[fileEntryIdx] = {
            ...activeEntry,
            content: {
              ...activeEntry.content,
              text: action.content,
              html: html,
              links: links,
            },
          };

          // Recompute links and all entries
          let [newLinkEntries, newEntries] = entry_utils.recomputeEntries(
            newFileEntries,
            state.linkEntries
          );

          // Recompute active entry idx
          let newActiveEntryIdx = newEntries.findIndex((entry) => entry.key === activeEntry.key);
          if (newActiveEntryIdx === -1) {
            // Should be unreachable, the active entry shouldn't disappear.
            console.log("Logic error: Active entry has disappeared.");
            return state;
          }

          // Stage git ops
          let newAllFileMapsEdit = state.allFileMapsEdit.clone();

          // Write entry content
          let repo = activeEntry.content.repo;
          let path = path_utils.getPath(activeEntry);
          newAllFileMapsEdit.get(repo)?.data.setContent(path, action.content);

          // Write meta data
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
          activeEntry.content.timeUpdated = date_utils.getDateNow();
          let metaData = entry_utils.extractMetaData(activeEntry);
          let metaDataPath = path_utils.getAssociatedMetaPath(path);
          let metaDataContent = io.serializeMetaData(metaData);
          newAllFileMapsEdit.get(repo)?.data.setContent(metaDataPath, metaDataContent);

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
      noteViewPositions[activeEntry.key] = getScrollPosition();
    }
  };
  const restoreNoteViewPosition = () => {
    let activeEntry = getActiveEntry();
    if (activeEntry != null && activeEntry.key in noteViewPositions) {
      targetBodyPosition.current = noteViewPositions[activeEntry.key];
    }
  };
  const storeNoteEditorPosition = () => {
    // console.log("At time of switching editor scroll is:", editorRef.current?.getScrollPosition())
    let activeEntry = getActiveEntry();
    if (activeEntry != null && editorRef.current != null) {
      let editorScrollPos = editorRef.current.getScrollPosition();
      let editorCursorPos = editorRef.current.getCursorPosition();
      noteEditorPositions[activeEntry.key] = {
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
    if (activeEntry != null && activeEntry.key in noteEditorPositions) {
      targetEditorPosition.current = noteEditorPositions[activeEntry.key];
    }
  };

  // *** Keyboard handlers

  const prepareSwitchFrom = (pageFrom: Page) => {
    switch (pageFrom) {
      case Page.NoteView:
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
    switch (state.page) {
      case Page.NoteView:
        prepareSwitchFrom(state.page);
        dispatch({ kind: ActionKind.SwitchToPage, page: Page.NoteEditor });
        break;
      case Page.NoteEditor:
        prepareSwitchFrom(state.page);
        dispatch({ kind: ActionKind.SwitchToPage, page: Page.NoteView });
        break;
      default: {
        console.log("Switching not possible");
        break;
      }
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
      case Page.Reload:
        if (!state.isReloading) {
          if (anyStagedChange() === false) {
            reloadEntries(repos);
          } else {
            Modal.confirm({
              title: "Do you want to reload entries?",
              icon: <ExclamationCircleOutlined />,
              content:
                "You have uncommitted changes. Reloading the repository content will discard local changes.",
              onOk() {
                reloadEntries(repos);
              },
            });
          }
        }
        break;
      default:
        prepareSwitchFrom(state.page);
        dispatch({ kind: ActionKind.SwitchToPage, page: clickedPage });
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
      case Page.Main:
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
      case Page.NoteView:
        return <NoteView entry={getActiveEntry()} />;
      case Page.NoteEditor:
        return (
          <NoteEditor
            entry={getActiveEntry()}
            ref={editorRef}
            onEditorDidMount={onEditorDidMount}
          />
        );
      case Page.Commit:
        return (
          <PrepareCommit
            ops={state.stagedGitOps}
            onSuccessfulCommit={() => {
              dispatch({ kind: ActionKind.SuccessfulCommit });
            }}
          />
        );
      case Page.Settings:
        return <Settings repos={repos} setRepos={setRepos} />;
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
              key={Page.NoteView}
              icon={<ReadOutlined style={{ fontSize: 16 }} />}
              title="Entry Viewer"
            />
            <Menu.Item
              key={Page.NoteEditor}
              icon={<EditOutlined style={{ fontSize: 16 }} />}
              title="Editor"
            />
            <Menu.Item
              key={Page.Settings}
              icon={<SettingOutlined style={{ fontSize: 16 }} />}
              title="Settings"
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
              key={Page.Add}
              icon={<PlusOutlined style={{ fontSize: 16 }} />}
              title="Add new entry"
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
