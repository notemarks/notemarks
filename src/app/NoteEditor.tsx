import React from 'react';
import { useRef } from 'react';

import Editor from "@monaco-editor/react";
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

import styled from '@emotion/styled'

import { Entry } from "./types";

type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor

/*
// ------------------------------------------------------------------------------.
// Notes:
// ------------------------------------------------------------------------------.

There are several React Monaco Editor wrappers. I went for this one, mainly
because it is the only one compatible with CRA/non-eject:

https://github.com/suren-atoyan/monaco-react#readme

Alternatives are (and in particular the first one is much more popular):
- https://github.com/react-monaco-editor/react-monaco-editor
- https://github.com/jaywcjlove/react-monacoeditor

*/

const DebugBox = styled.div`
  height: 100%;
  /* Work-around for vertical overflow issue: https://github.com/microsoft/monaco-editor/issues/29 */
  overflow: hidden;
  /* background: #050; */
`


type NoteEditorProps = {
  entry?: Entry,
}

function NoteEditor({ entry }: NoteEditorProps) {

  const editorRef = useRef(undefined as IStandaloneCodeEditor | undefined);

  const onEditorDidMount = (_: () => string, editor: IStandaloneCodeEditor) => {
    editorRef.current = editor;
  }

  if (entry == null) {
    return (
      <div>
        Nothing
      </div>
    )
  } else {
    return (
      <DebugBox>
        <Editor
          height="100%"
          theme="dark"
          language="markdown"
          value={entry.content}
          editorDidMount={onEditorDidMount}
        />
      </DebugBox>
    );
  }
}


export default NoteEditor;
