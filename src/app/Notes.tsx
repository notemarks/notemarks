import React from 'react';

import { Typography } from 'antd';
import { Table, Tag, Input } from 'antd';

import styled from '@emotion/styled'

import { Entry, Entries } from "./types";
import { Repos } from "./repo";

/*
// ----------------------------------------------------------------------------
// Notes:
// ----------------------------------------------------------------------------

Creating "onClick" callbacks from the table contents directly seems to be a bit
tricky, because it would require to have the callback available in the `render`
function. This (probably?) would mean that we have to attach the callback to each
data entry directly, which is ugly because we are mixing data with behavior.
Perhaps it would mean that instead of operating the table on the original entires,
we have to map `Entry` to some `TableEntry` object that combines the data with the
table specific callbacks.

For now the easiest solution was to "hoist" the callback to the onClick of the
entire row.

See also Q/A here:
https://stackoverflow.com/questions/48494045/how-to-add-dynamic-link-to-table-data
*/

const StyledInput = styled(Input)`
  margin-top: 20px;
  margin-bottom: 20px;
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
      // TODO: Should we make this a button?
      // https://stackoverflow.com/a/60775925/1804173
      // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/anchor-is-valid.md
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
      <StyledInput/>
      <StyledTable
        bordered
        dataSource={entries}
        columns={columns}
        pagination={false}
        showHeader={false}
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
