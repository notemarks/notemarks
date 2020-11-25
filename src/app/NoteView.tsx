import React from 'react';

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
        {entry.content}
        <Footer/>
      </>
    );
  }
}


export default NoteView;
