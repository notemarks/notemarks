import React from "react";
import ReactDOM from "react-dom";

import Editor from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";

type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor;

const EditorWrapper = () => {
  const onEditorDidMount = (_: () => string, editor: IStandaloneCodeEditor) => {
    editor.setPosition({ lineNumber: 1, column: 6 });
    window.requestAnimationFrame(() => {
      editor.focus();
    });
  };

  return (
    <Editor
      height="90vh"
      theme="dark"
      language="markdown"
      value={"Hello world"}
      editorDidMount={onEditorDidMount}
    />
  );
};

ReactDOM.render(
  <React.StrictMode>
    <EditorWrapper />
  </React.StrictMode>,
  document.getElementById("root")
);
