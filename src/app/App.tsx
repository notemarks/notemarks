import React from 'react';
import { useState, useEffect } from 'react';
import './App.css';

import { Row, Col, Layout, Menu, Tag } from 'antd';
import { EditOutlined, SettingOutlined } from '@ant-design/icons';

import styled from '@emotion/styled'

import * as mousetrap from "mousetrap"

import { Entry, Entries, LabelCounts } from "./types";
import * as entry_utils from "./entry_utils"
import * as repo_utils from "./repo"
import { loadEntries } from "./octokit";

import Settings from "./Settings";
import Notes from "./Notes";
import NoteView from "./NoteView";
import NoteEditor from "./NoteEditor";


// const { Header, Content, Footer, Sider } = Layout;
const { Content } = Layout;


const ContentStyled = styled(Content)`
  background: #FFF;
`

declare const Mousetrap: any;

Mousetrap.prototype.stopCallback = function(e: KeyboardEvent, element: HTMLElement, combo: string) {
  // https://craig.is/killing/mice
  // console.log("stopCallback", e, element, combo);
  if (element.tagName === 'INPUT' && e.key === "Enter") {
    // don't fire mousetrap events for ENTER on input elements
    return true;
  } else {
    // fire in all other cases
    return false;
  }
}

enum Page {
  Main = "Main",
  Settings = "Settings",
  NoteView = "NoteView",
  NoteEditor = "NoteEditor",
}


function App() {

  // *** Settings

  const [page, setPage] = useState(Page.Main)
  const [repos, setRepos] = useState(repo_utils.getStoredRepos());

  const [activeEntry, setActiveEntry] = useState(undefined as Entry | undefined)

  useEffect(() => {
    // console.log("Storing repos:", repos)
    repo_utils.setStoredRepos(repos);
  }, [repos]);

  // Derived state: Active repos
  const [activeRepos, setActiveRepos] = useState([] as repo_utils.Repo[])

  useEffect(() => {
    let newActiveRepos = [];
    for (let repo of repos) {
      if (repo.enabled && repo.verified) {
        newActiveRepos.push(repo);
      }
    }
    setActiveRepos(newActiveRepos);
  }, [repos])

  // *** Entries

  let [entries, setEntries] = useState([] as Entries)
  let [labels, setLabels] = useState([] as LabelCounts)

  useEffect(() => {
    async function loadContents() {
      let newEntries = await loadEntries(repos)
      setEntries(newEntries)
      setLabels(entry_utils.getLabelCounts(newEntries))
    }
    loadContents();
  }, [repos, setLabels])

  // *** Render helper

  const renderCenter = () => {
    switch (page) {
      case Page.Main:
        return (
          <Notes
            repos={activeRepos}
            entries={entries}
            onEnterEntry={i => {
              setPage(Page.NoteView)
              setActiveEntry(entries[i])
            }}
          />
        )
      case Page.NoteView:
        return <NoteView entry={activeEntry}/>
      case Page.NoteEditor:
        return <NoteEditor entry={activeEntry}/>
      case Page.Settings:
        return <Settings repos={repos} setRepos={setRepos}/>
    }
  }

  // *** Keyboard shortcuts

  mousetrap.bind(["command+e", "ctrl+e"], () => {
    switch (page) {
      case Page.NoteView: {
        setPage(Page.NoteEditor);
        break;
      }
      case Page.NoteEditor: {
        setPage(Page.NoteView);
        break;
      }
      default: {
        console.log("switching not possible");
        break;
      }
    }
  });
  /*
  mousetrap.bind(["command+p", "ctrl+p"], () => {
    if (searchInputRef != undefined) {
      searchInputRef!.focus()
    }
  })
  */

  return (
    <Layout>
      {/* Theoretically the menu should be wrapped in <Header> but I prefer the smaller sized menu */}
      <Row justify="center" style={{background: "#001529"}}>
        <Col md={18} xl={12}>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={[page]}
            onClick={evt => setPage(evt.key as Page)}
          >
            <Menu.Item key={Page.Main} icon={<EditOutlined/>}>
              Notes
            </Menu.Item>
            <Menu.Item key={Page.Settings} icon={<SettingOutlined/>}>
              Settings
            </Menu.Item>
          </Menu>
        </Col>
      </Row>
      <ContentStyled>
        <Row justify="center">
          <Col md={3} xl={6}>
            {
              labels.map(label =>
                <div key={label.label}>
                  <Tag >
                    {label.label}
                  </Tag>
                </div>
              )
            }
          </Col>
          <Col md={18} xl={12}>
            {renderCenter()}
          </Col>
          <Col md={3} xl={6}>
          </Col>
        </Row>
      </ContentStyled>
    </Layout>
  );
}

export default App;
