import React from 'react';

import Editor from '@monaco-editor/react';

import { Typography } from 'antd';
import { Table, Tag } from 'antd';

import styled from '@emotion/styled'

import { Entry, Entries } from "./types";
import { Repos } from "./repo";


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
        />
      </DebugBox>
    );
  }
}


export default NoteEditor;
