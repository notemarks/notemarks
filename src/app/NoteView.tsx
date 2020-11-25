import React from 'react';

import * as showdown from "showdown"

import { Typography } from 'antd';
import { Table, Tag } from 'antd';

import styled from '@emotion/styled'

import { Entry, Entries } from "./types";
import { Repos } from "./repo";

const { Title } = Typography;

const StyledTitle = styled(Title)`
  margin-top: 20px;
`

const Footer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`

type NoteViewProps = {
  entry?: Entry,
}


function convertMarkdown(markdown: string): string {
  // https://github.com/showdownjs/showdown#valid-options
  const converter = new showdown.Converter({
    ghCodeBlocks: true,
    //extensions: ["highlightjs"],
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
  })

  // Apparently 'github' flavor leads to treating every line break as a visible
  // line break in the output, which is not necessarily desired if line breaks
  // are placed in the markdown source mainly for making the source look nice,
  // but a full paragraph is desired in the output. Disable for now.
  // converter.setFlavor('github');

  return converter.makeHtml(markdown);
}

function NoteView({ entry }: NoteViewProps) {

  if (entry == null) {
    return (
      <div>
        Nothing
      </div>
    )
  } else {
    return (
      <>
        <StyledTitle>{entry.title}</StyledTitle>
        <div dangerouslySetInnerHTML={{ __html: convertMarkdown(entry.content!)}}/>
        <Footer/>
      </>
    );
  }
}


export default NoteView;
