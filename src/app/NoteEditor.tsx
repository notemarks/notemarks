import React from 'react';

import Editor from '@monaco-editor/react';

import { Typography } from 'antd';
import { Table, Tag } from 'antd';

import styled from '@emotion/styled'

import { Entry, Entries } from "./types";
import { Repos } from "./repo";


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
      <Editor
        height="90vh"
        theme="dark"
        language="markdown"
        value={entry.content}
      />
    );
  }
}


export default NoteEditor;
