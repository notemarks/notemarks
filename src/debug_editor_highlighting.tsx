// debug_editor_highlighting
import React from "react";
import ReactDOM from "react-dom";

import { Menu } from "antd";
import { FileSearchOutlined } from "@ant-design/icons";

import Editor from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";

import styled from "@emotion/styled";

import "./index.css";

type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor;

const EditorWrapper = () => {
  const onEditorDidMount = (_: () => string, editor: IStandaloneCodeEditor) => {};

  return (
    <>
      <Menu theme="dark" mode="horizontal">
        <Menu.Item
          key="1"
          icon={<FileSearchOutlined style={{ fontSize: 16 }} />}
          title="Overview"
        />
        <Menu.Item
          key="2"
          icon={<FileSearchOutlined style={{ fontSize: 16 }} />}
          title="Overview"
        />
      </Menu>
      <div style={{ display: "flex", flexDirection: "column", height: "100px" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", flexGrow: 1 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, right: 0 }}>
            <Editor
              height="100%"
              theme="dark"
              language="javascript"
              value={"console.log('test')\n\nfunction test() {}\n\n// comment"}
              editorDidMount={onEditorDidMount}
            />
          </div>
        </div>
      </div>
    </>
  );
};

let element = document.getElementById("root")!;
//element.setAttribute("style", "height: 100%");

//document.body.style.height = "100%";

ReactDOM.render(
  <React.StrictMode>
    <EditorWrapper />
  </React.StrictMode>,
  element
);
