// debug_editor_highlighting
// https://github.com/suren-atoyan/monaco-react/issues/155
import React from "react";
import ReactDOM from "react-dom";

import Editor from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
//import * as monacoEditor from "monaco-editor";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dummy() {
  // Commenting out these lines makes syntax highlighting work.
  new monacoEditor.Position(0, 0);
  new monacoEditor.Range(0, 0, 0, 0);
}

ReactDOM.render(
  <React.StrictMode>
    <Editor
      height="400px"
      theme="dark"
      language="javascript"
      value={"console.log('test')\n\nfunction test() {}\n\n// comment"}
    />
  </React.StrictMode>,
  document.getElementById("root")
);
