import React, { useEffect, useState } from 'react';

import { Table, Tag, Input, Row, Col } from 'antd';
import { EditOutlined, GlobalOutlined, LinkOutlined } from '@ant-design/icons';

import styled from '@emotion/styled'

import { SizeProps } from "./types_view";
import { Entry, Entries, EntryKind, LabelCounts } from "./types";
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
    title: "Kind",
    dataIndex: "entryKind",
    key: "entryKind",
    render: (entryKind: EntryKind) => {
      switch (entryKind) {
        case EntryKind.Link:
          return <GlobalOutlined style={{fontSize: 14}}/>
        case EntryKind.NoteMarkdown:
          return <EditOutlined style={{fontSize: 14}}/>
        case EntryKind.Document:
          return <LinkOutlined style={{fontSize: 14}}/>
      }
    }
  },
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
  sizeProps: SizeProps,
  repos: Repos,
  entries: Entries,
  labels: LabelCounts,
  onEnterEntry: (i: number) => void,
}

function Notes({ sizeProps, repos, entries, labels, onEnterEntry }: NotesProps) {

  const [filteredEntries, setFilteredEntries] = useState(entries);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  useEffect(() => {
    let newFilteredEntries = [];
    for (let entry of entries) {
      if (searchTerms.length === 0) {
        newFilteredEntries.push(entry);
      } else {
        // Currently we match on any search term -- later could be ranked by match quality?
        for (let searchTerm of searchTerms) {
          if (entry.title.toLowerCase().includes(searchTerm.toLowerCase())) {
            newFilteredEntries.push(entry);
          }
        }
      }
    }
    setFilteredEntries(newFilteredEntries);
  }, [entries, searchTerms])

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Improve performance
    // https://stackoverflow.com/a/50820219/1804173
    // https://stackoverflow.com/a/28046731/1804173
    window.requestAnimationFrame(() => {
      setSearchTerms([event.target.value]);
    })
  }

  return (
    <>
      <Row justify="center">
        <Col {...sizeProps.l}/>
        <Col {...sizeProps.c}>
          <StyledInput onChange={onChange}/>
        </Col>
        <Col {...sizeProps.r}/>
      </Row>
      <Row justify="center" style={{height: "100%"}}>
        <Col {...sizeProps.l} style={{paddingLeft: 20}}>
          {
            labels.map(label =>
              <div key={label.label}>
                <Tag >
                  {label.label}
                </Tag>
              </div>
            )
          }
        </Col>
        <Col {...sizeProps.c} style={{height: "100%"}}>
          <StyledTable
            bordered
            dataSource={filteredEntries}
            columns={columns}
            pagination={false}
            showHeader={false}
            //rowClassName={(record: any, index) => isHighlightRow(record.name) ? 'highlight-row' :  ''}
            onRow={(entry, entryIndex) => {
              return {
                onClick: event => {
                  // TODO: Apparently the onRow callback isn't fully typed?
                  // console.log(entry)
                  onEnterEntry((entry as Entry).idx!)
                  /*
                  if (entryIndex != null) {
                    onEnterEntry(entryIndex);
                  }
                  */
                },
                // onDoubleClick: event => {}, // double click row
                // onContextMenu: event => {}, // right button click row
                // onMouseEnter: event => {}, // mouse enter row
                // onMouseLeave: event => {}, // mouse leave row
              };
            }}
          />
          <Footer/>
        </Col>
        <Col {...sizeProps.r}/>
      </Row>
    </>
  );
}


export default Notes;
