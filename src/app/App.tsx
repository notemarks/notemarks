import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import "./App.css";

import { Layout, Menu } from "antd";
import {
  EditOutlined,
  SettingOutlined,
  FileSearchOutlined,
  ReadOutlined,
  UploadOutlined,
  ReloadOutlined,
  PlusOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { MenuInfo } from "rc-menu/lib/interface";

import styled from "@emotion/styled";

import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import mousetrap from "mousetrap";

import { useEffectOnce } from "./utils/react_utils";
import { UiRow } from "./components/UiRow";

import { Entry, Entries, Labels, EntryFile } from "./types";
import * as entry_utils from "./utils/entry_utils";
import * as label_utils from "./utils/label_utils";
import * as markdown_utils from "./utils/markdown_utils";
import * as repo_utils from "./repo";
import type { Repos } from "./repo";
import * as git_ops from "./git_ops";
import type { MultiRepoGitOps } from "./git_ops";
import { loadEntries } from "./octokit";

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

  async function reloadEntries(newRepos: Repos) {
    console.log("Reloading entries");
    setIsReloading(true);
    let newActiveRepos = repo_utils.filterActiveRepos(newRepos);

    // Either loadEntries returns the FileEntries seperated from LinkEntries
    // here, or it merges it internally. One possibility:
    /*
    let [newFileEntries, newLinkEntries] = await loadEntries(newActiveRepos);

    let newEntries = entry_utils.mergeEntriesAndLinks(newFileEntries, newLinkEntries);
    entry_utils.sortAndIndexEntries(newEntries);

    setEntries({
      fileEntries: newFileEntries,
      linkEntries: newLinkEntries,
      allEntries: newEntries,
    })
    */
    let newFileEntries = await loadEntries(newActiveRepos);

    let newLinkEntries = entry_utils.recomputeLinkEntries(newFileEntries as EntryFile[], []);
    let newEntries = [...newFileEntries, ...newLinkEntries];

    entry_utils.sortAndIndexEntries(newEntries);

    // TODO: If the loading actually leads to a different link DB than what has been
    // stored (i.e., if newLinkEntries is different from what will go in as existingLinks
    // then we should stage a git op for updating the link DB file).

    // Should the recomputeLinkEntries function actually return a boolean to express
    // "the link DB should be updated, there have been changes in inferring the links"?
    // Perhaps this would also be useful in the content update case?

    // TODO: Decide if these "double updates" are a problem.
    // See: https://stackoverflow.com/q/53574614/1804173
    setEntries(newEntries);
    setLabels(label_utils.extractLabels(newEntries));
    setIsReloading(false);
  }

  // *** Settings: Repos state

  const [repos, setRepos] = useState([] as Repos);
  const [isReloading, setIsReloading] = useState(false);

  // Effect to store repo changes to local storage.
  // Note that it is slightly awkward that we re-store the repos data
  // after the initial loading, because it uses setRepos. But on first
  // glance that shouldn't cause trouble and is better then reloading
  // the repo data as an argument to useState in every re-render.
  useEffect(() => {
    // console.log("Storing repos:", repos)
    repo_utils.setStoredRepos(repos);
  }, [repos]);

  // *** Main state

  const [page, setPage] = useState(Page.Main);
  const [activeEntryIdx, setActiveEntryIdx] = useState<number | undefined>(undefined);

  // *** Entries state

  let [entries, setEntries] = useState([] as Entries);
  let [labels, setLabels] = useState([] as Labels);

  let [stagedGitOps, setStagedGitOps] = useState({} as MultiRepoGitOps);

  // Derived state: active entry
  const getActiveEntry = (): Entry | undefined => {
    if (activeEntryIdx != null) {
      return entries[activeEntryIdx];
    }
  };

  // *** Refs

  let editorRef = useRef<NoteEditorRef>(null);
  let searchInputRef = useRef<HTMLInputElement>(null);

  // *** State change helper functions

  const updateEntryContent = () => {
    if (editorRef.current != null && activeEntryIdx != null) {
      let activeEntry = getActiveEntry()!;
      let newText = editorRef.current.getEditorContent();
      if (
        newText != null &&
        entry_utils.isNote(activeEntry) &&
        newText !== activeEntry.content.text
      ) {
        let [html, links] = markdown_utils.processMarkdownText(newText);

        /*
        To be solved: How to rerun entry_utils.mergeEntriesAndLinks(newFileEntries, newLinkEntries);

        Tricky: Since the active entry may have received new links or links were removed, the
        length of the combined entries can change. This also means that the activeEntryIdx
        may longer be valid, and needs to be reset accordingly. Note that it isn't safe to assume
        that the activeEntryIdx doesn't change because notes are always sorted before links.
        In general the activeEntryIdx can point to links as well, not only notes, so it does
        not necessarily "point to a stable area".

        Brute force solution:
        - Either store file vs link entries separately or divide them here into two groups.
        - Identify the activeEntryIdx within the file entries, if it has no match the active
          entry is a link, which actually should be impossible if the editor is up, hm...
        - Modify the file entry.
        - Merged them back together
        - setEntries
        */

        let newEntries = entries.slice(0);
        newEntries[activeEntryIdx] = {
          ...activeEntry,
          content: {
            ...activeEntry.content,
            text: newText,
            html: html,
            links: links,
          },
        };
        setEntries(newEntries);

        setStagedGitOps((gitOps) => git_ops.appendUpdateEntry(gitOps, newEntries[activeEntryIdx]));
        // TODO: We need to stage updates to meta data as well
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
        restoreNoteEditorPosition();
        break;
      case Page.NoteEditor:
        storeNoteEditorPosition();
        restoreNoteViewPosition();
        updateEntryContent();
        break;
      default: {
        break;
      }
    }
  };

  keyboardHandlers.handleSwitchEdit = () => {
    switch (page) {
      case Page.NoteView:
        prepareSwitchFrom(page);
        setPage(Page.NoteEditor);
        break;
      case Page.NoteEditor:
        prepareSwitchFrom(page);
        setPage(Page.NoteView);
        break;
      default: {
        console.log("Switching not possible");
        break;
      }
    }
  };
  keyboardHandlers.handleSearch = () => {
    if (page !== Page.Main) {
      setPage(Page.Main);
    } else if (searchInputRef.current != null) {
      searchInputRef.current.focus();
    }
  };

  // Probably not much sense to useCallback here, because it has too many dependencies?
  const onClickMenu = (menuInfo: MenuInfo) => {
    let clickedPage = menuInfo.key as Page;
    switch (clickedPage) {
      case Page.Reload:
        if (!isReloading) {
          reloadEntries(repos);
        }
        break;
      default:
        prepareSwitchFrom(page);
        setPage(clickedPage);
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
    switch (page) {
      case Page.Main:
        return (
          <List
            ref={searchInputRef}
            entries={entries}
            labels={labels}
            onEnterEntry={(i) => {
              // TODO: requires useCallback?
              setPage(Page.NoteView);
              setActiveEntryIdx(i);
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
            ops={stagedGitOps}
            onSuccessfulCommit={() => {
              setPage(Page.Main);
              setStagedGitOps({});
            }}
          />
        );
      case Page.Settings:
        return <Settings repos={repos} setRepos={setRepos} />;
    }
  };

  return (
    <Layout style={{ height: "100%" }}>
      {/* Theoretically the menu should be wrapped in <Header> but I prefer the smaller sized menu */}
      <UiRow
        center={
          <Menu theme="dark" mode="horizontal" selectedKeys={[page]} onClick={onClickMenu}>
            <Menu.Item key={Page.Main} icon={<FileSearchOutlined style={{ fontSize: 16 }} />} />
            <Menu.Item key={Page.NoteView} icon={<ReadOutlined style={{ fontSize: 16 }} />} />
            <Menu.Item key={Page.NoteEditor} icon={<EditOutlined style={{ fontSize: 16 }} />} />
            <Menu.Item key={Page.Settings} icon={<SettingOutlined style={{ fontSize: 16 }} />} />
            <Menu.Item
              key={Page.Commit}
              icon={<UploadOutlined style={{ fontSize: 16 }} />}
              disabled={Object.keys(stagedGitOps).length === 0}
            />
            <Menu.Item
              key={Page.Reload}
              icon={
                !isReloading ? (
                  <ReloadOutlined style={{ fontSize: 16 }} />
                ) : (
                  <LoadingOutlined style={{ fontSize: 16 }} />
                )
              }
            />
            <Menu.Item key={Page.Add} icon={<PlusOutlined style={{ fontSize: 16 }} />} />
          </Menu>
        }
        style={{ background: "#001529" }}
      />
      <ContentStyled>{renderCenter()}</ContentStyled>
    </Layout>
  );
}

export default App;
