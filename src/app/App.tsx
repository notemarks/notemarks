import React from "react";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import "./App.css";

import { Row, Col, Layout, Menu } from "antd";
import {
  EditOutlined,
  SettingOutlined,
  FileSearchOutlined,
  ReadOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import styled from "@emotion/styled";

import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import mousetrap from "mousetrap";

import { Entry, Entries, LabelCounts } from "./types";
import * as entry_utils from "./entry_utils";
import * as repo_utils from "./repo";
import * as git_ops from "./git_ops";
import type { GitOp } from "./git_ops";
import { loadEntries } from "./octokit";

import Notes from "./Notes";
import NoteView from "./NoteView";
import NoteEditor, { NoteEditorRef } from "./NoteEditor";
import PrepareCommit from "./PrepareCommit";
import Settings from "./Settings";

// const { Header, Content, Footer, Sider } = Layout;
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
  Main = "Main",
  Settings = "Settings",
  NoteView = "NoteView",
  NoteEditor = "NoteEditor",
  Commit = "Commit",
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

function App() {
  // *** Core state

  const [page, setPage] = useState(Page.Main);
  const [activeEntryIdx, setActiveEntryIdx] = useState<number | undefined>(undefined);
  const [activeEntry, setActiveEntry] = useState<Entry | undefined>(undefined);

  // *** Settings: Repos state

  const [repos, setRepos] = useState(repo_utils.getStoredRepos());

  useEffect(() => {
    // console.log("Storing repos:", repos)
    repo_utils.setStoredRepos(repos);
  }, [repos]);

  // Derived state: Active repos
  const [activeRepos, setActiveRepos] = useState([] as repo_utils.Repo[]);

  useEffect(() => {
    let newActiveRepos = [];
    for (let repo of repos) {
      if (repo.enabled && repo.verified) {
        newActiveRepos.push(repo);
      }
    }
    setActiveRepos(newActiveRepos);
  }, [repos]);

  // *** Entries state

  let [entries, setEntries] = useState([] as Entries);
  let [labels, setLabels] = useState([] as LabelCounts);

  let [stagedGitOps, setStagedGitOps] = useState([] as GitOp[]);

  useEffect(() => {
    async function loadContents() {
      let newEntries = await loadEntries(repos);
      entry_utils.sortAndIndexEntries(newEntries);
      // TODO: Decide if these "double updates" are a problem.
      // See: https://stackoverflow.com/q/53574614/1804173
      setEntries(newEntries);
      setLabels(entry_utils.getLabelCounts(newEntries));
    }
    loadContents();
  }, [repos, setLabels]);

  // Derived state: active entry
  useEffect(() => {
    if (activeEntryIdx != null) {
      setActiveEntry(entries[activeEntryIdx]);
    }
  }, [entries, activeEntryIdx, setActiveEntry]);

  // *** Refs

  let editorRef = useRef<NoteEditorRef>(null);
  let searchInputRef = useRef<HTMLInputElement>(null);

  // *** State change helper functions

  const updateEntryContent = () => {
    if (editorRef.current != null && activeEntryIdx != null) {
      let newContent = editorRef.current.getEditorContent();
      if (newContent != null && newContent !== entries[activeEntryIdx].content) {
        let newEntries = entries.slice(0);
        newEntries[activeEntryIdx] = {
          ...newEntries[activeEntryIdx],
          content: newContent,
        };
        setEntries(newEntries);

        setStagedGitOps((gitOps) =>
          git_ops.appendNormalized(
            gitOps,
            git_ops.createGitOpUpdateContent(newEntries[activeEntryIdx])
          )
        );
      }
    }
  };

  const storeNoteViewPosition = () => {
    if (activeEntry != null) {
      noteViewPositions[activeEntry.key] = getScrollPosition();
    }
  };
  const restoreNoteViewPosition = () => {
    if (activeEntry != null && activeEntry.key in noteViewPositions) {
      targetBodyPosition.current = noteViewPositions[activeEntry.key];
    }
  };
  const storeNoteEditorPosition = () => {
    // console.log("At time of switching editor scroll is:", editorRef.current?.getScrollPosition())
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
    if (activeEntry != null && activeEntry.key in noteEditorPositions) {
      targetEditorPosition.current = noteEditorPositions[activeEntry.key];
    }
  };

  // *** Keyboard handlers

  keyboardHandlers.handleSwitchEdit = () => {
    switch (page) {
      case Page.NoteView: {
        storeNoteViewPosition();
        restoreNoteEditorPosition();
        setPage(Page.NoteEditor);
        break;
      }
      case Page.NoteEditor: {
        storeNoteEditorPosition();
        restoreNoteViewPosition();
        updateEntryContent();
        setPage(Page.NoteView);
        break;
      }
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

  const sizeProps = {
    l: { md: 3, xl: 6 },
    c: { md: 18, xl: 12 },
    r: { md: 3, xl: 6 },
  };

  const renderCenter = () => {
    switch (page) {
      case Page.Main:
        return (
          <Notes
            ref={searchInputRef}
            sizeProps={sizeProps}
            repos={activeRepos}
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
        return <NoteView sizeProps={sizeProps} entry={activeEntry} />;
      case Page.NoteEditor:
        return (
          <NoteEditor
            sizeProps={sizeProps}
            entry={activeEntry}
            ref={editorRef}
            onEditorDidMount={onEditorDidMount}
          />
        );
      case Page.Commit:
        return <PrepareCommit sizeProps={sizeProps} ops={stagedGitOps} />;
      case Page.Settings:
        return <Settings sizeProps={sizeProps} repos={repos} setRepos={setRepos} />;
    }
  };

  return (
    <Layout style={{ height: "100%" }}>
      {/* Theoretically the menu should be wrapped in <Header> but I prefer the smaller sized menu */}
      <Row justify="center" style={{ background: "#001529" }}>
        <Col {...sizeProps.c}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[page]}
            defaultSelectedKeys={[page]}
            onClick={(evt) => setPage(evt.key as Page)}
          >
            <Menu.Item key={Page.Main} icon={<FileSearchOutlined style={{ fontSize: 16 }} />} />
            <Menu.Item key={Page.NoteView} icon={<ReadOutlined style={{ fontSize: 16 }} />} />
            <Menu.Item key={Page.NoteEditor} icon={<EditOutlined style={{ fontSize: 16 }} />} />
            <Menu.Item key={Page.Settings} icon={<SettingOutlined style={{ fontSize: 16 }} />} />
            <Menu.Item
              key={Page.Commit}
              icon={<UploadOutlined style={{ fontSize: 16 }} />}
              disabled={stagedGitOps.length === 0}
            />
          </Menu>
        </Col>
      </Row>
      <ContentStyled style={{ height: "100%" }}>{renderCenter()}</ContentStyled>
    </Layout>
  );
}

export default App;
