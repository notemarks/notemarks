import React from 'react';
import { useEffect, useState } from "react";

import { Typography } from 'antd';
import { Table, Tag } from 'antd';

import styled from '@emotion/styled'

import { Repos } from "./repo";
import { Entry, loadEntries} from "./octokit";

const { Title } = Typography;

const StyledTitle = styled(Title)`
  margin-top: 20px;
`

const Footer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`

const StyledTable = styled(Table)`
table {
  font-size: 11px;
}

table > thead > tr > th {
  padding: 4px;
  font-weight: bold;
}

table > tbody > tr > td {
  padding: 4px;
}

.highlight-row {
  background-color: #fafbfF;
  font-weight: bold;
}
`

const columns: any[] = [
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: "Labels",
    dataIndex: "labels",
    key: "labels",
    render: (labels: string[]) => (
      labels.map((label, i) => (
        <Tag key={label} color="green">{label}</Tag>
      ))
    )
  },
]

// ----------------------------------------------------------------------------
// Notes
// ----------------------------------------------------------------------------

type NotesProps = {
  repos: Repos,
}

function Notes({ repos }: NotesProps) {

  let [entries, setEntries] = useState([] as Entry[])

  useEffect(() => {
    async function loadContents() {
      let newEntries = await loadEntries(repos)
      setEntries(newEntries)
    }
    loadContents();
  }, [repos])

  return (
    <>
      <StyledTitle level={4}>Notes</StyledTitle>
      <StyledTable
        bordered
        dataSource={entries}
        columns={columns}
        pagination={false}
        //rowClassName={(record: any, index) => isHighlightRow(record.name) ? 'highlight-row' :  ''}
      />
      <Footer/>
    </>
  );
}


export default Notes;

