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
    render: (text: string, entry: Entry) => {
      // eslint-disable-next-line
      return <a>{text}</a>
    },
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
  entries: Entries,
  onEnterEntry: (i: number) => void,
}

function Notes({ repos, entries, onEnterEntry }: NotesProps) {

  return (
    <>
      <StyledTitle level={4}>Notes</StyledTitle>
      <StyledTable
        bordered
        dataSource={entries}
        columns={columns}
        pagination={false}
        //rowClassName={(record: any, index) => isHighlightRow(record.name) ? 'highlight-row' :  ''}
        onRow={(entry, entryIndex) => {
          return {
            onClick: event => {
              console.log(entry);
              if (entryIndex != null) {
                onEnterEntry(entryIndex);
              }
            },
            // onDoubleClick: event => {}, // double click row
            // onContextMenu: event => {}, // right button click row
            // onMouseEnter: event => {}, // mouse enter row
            // onMouseLeave: event => {}, // mouse leave row
          };
        }}
      />
      <Footer/>
    </>
  );
}


export default Notes;
