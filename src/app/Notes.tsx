import React, { useEffect, useState } from "react";

import { Tag, Input, Row, Col, Tree } from "antd";
import { EditOutlined, GlobalOutlined, LinkOutlined } from "@ant-design/icons";

import styled from "@emotion/styled";

import { SizeProps } from "./types_view";
import { Entries, EntryKind, Label, LabelCounts } from "./types";
import * as fn from "./fn_utils";
import { Repos } from "./repo";

export function splitSearchTerms(s: string): string[] {
  return s
    .split(/(\s+)/)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 0);
}

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
`;

const Footer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`;

/*
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
*/

// ----------------------------------------------------------------------------
// Notes
// ----------------------------------------------------------------------------

type NotesProps = {
  sizeProps: SizeProps;
  repos: Repos;
  entries: Entries;
  labels: LabelCounts;
  onEnterEntry: (i: number) => void;
};

function Notes({ sizeProps, repos, entries, labels, onEnterEntry }: NotesProps) {
  // *** Entry filtering

  const [filteredEntries, setFilteredEntries] = useState(entries);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  useEffect(() => {
    let newFilteredEntries = [];
    for (let entry of entries) {
      if (searchTerms.length === 0) {
        newFilteredEntries.push(entry);
      } else {
        // Currently we require all terms to match. Is there a use case for an `OR` mode?
        let matchesAll = true;
        for (let searchTerm of searchTerms) {
          // Note: search terms are normalized, i.e. don't need toLowerCase().
          // Possible performance optimization: Cache entry.title.toLowerCase()?
          if (!entry.title.toLowerCase().includes(searchTerm)) {
            matchesAll = false;
          }
        }
        if (matchesAll) {
          newFilteredEntries.push(entry);
        }
      }
    }
    setFilteredEntries(newFilteredEntries);
  }, [entries, searchTerms]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Improve performance
    // https://stackoverflow.com/a/50820219/1804173
    // https://stackoverflow.com/a/28046731/1804173
    window.requestAnimationFrame(() => {
      setSearchTerms(splitSearchTerms(event.target.value));
    });
  };

  useEffect(() => {
    if (entries.length > 0) {
      setSelectedIndex(0);
    } else {
      setSelectedIndex(-1);
    }
  }, [entries, searchTerms]);

  function onKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex(fn.computeSelectedIndex(filteredEntries.length, selectedIndex, -1));
        break;
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex(fn.computeSelectedIndex(filteredEntries.length, selectedIndex, +1));
        break;
      case "Escape":
        /*
        setState({
          active: false,
          selectedIndex: -1,
          value: "",
        })
        */
        //refInput.blur()
        break;
      case "Enter":
        if (selectedIndex !== -1) {
          onEnterEntry(filteredEntries[selectedIndex].idx!);
        }
        /*
        if (state.selectedIndex != -1) {
          selectIndex(state.selectedIndex);
        }
        */
        break;
    }
  }

  // *** Label tree data

  const treeData = labels.map((labelCount) => {
    return {
      title: labelCount.label + " (" + labelCount.count + ")",
      key: labelCount.label,
    };
  });

  return (
    <>
      <Row justify="center">
        <Col {...sizeProps.l} />
        <Col {...sizeProps.c}>
          <StyledInput onChange={onChange} onKeyDown={onKeydown} autoFocus />
        </Col>
        <Col {...sizeProps.r} />
      </Row>
      <Row justify="center" style={{ height: "100%" }}>
        <Col {...sizeProps.l} style={{ paddingLeft: 20 }}>
          <Tree
            treeData={treeData}
            selectable={false}
            titleRender={(data) => <Tag>{data.title}</Tag>}
          />
          {labels.map((label) => (
            <div key={label.label}>
              <Tag>{label.label}</Tag>
            </div>
          ))}
        </Col>
        <Col {...sizeProps.c} style={{ height: "100%" }}>
          <CustomTable entries={filteredEntries} highlighted={selectedIndex} />
          {/*
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
                },
                // onDoubleClick: event => {}, // double click row
                // onContextMenu: event => {}, // right button click row
                // onMouseEnter: event => {}, // mouse enter row
                // onMouseLeave: event => {}, // mouse leave row
              };
            }}
          />
          */}
          <Footer />
        </Col>
        <Col {...sizeProps.r} />
      </Row>
    </>
  );
}

// ----------------------------------------------------------------------------
// Custom table
// ----------------------------------------------------------------------------

const PseudoTable = styled.div`
  font-size: 11px;

  .highlight-row {
    background: #e8f6fe; /* Antd's select color used e.g. in AutoComplete */
    border: 1px solid #b0e0fc;
    border-radius: 3px;

    /* Since we are using box-sizing: border-box, we need to counter the border with negative margins */
    margin-top: -1px;
    margin-bottom: -1px;
    margin-left: -1px;
    margin-right: -1px;
  }
`;

const PseudoTableRow = styled.div`
  padding-top: 4px;
  padding-bottom: 4px;
  display: flex;
  vertical-align: baseline;
`;

const TitleWrapper = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 22px;
  line-height: 22px;
  vertical-align: bottom;
  padding-left: 8px;
`;

const SymbolWrapper = styled.span`
  padding-left: 8px;
  padding-right: 8px;
  height: 22px;
  line-height: 22px;
`;

const LabelsWrapper = styled.span`
  vertical-align: baseline;
  flex: 0 0 50%;
`;

type CustomTableProps = {
  entries: Entries;
  highlighted: number;
};

function renderEntryKindSymbol(entryKind: EntryKind) {
  switch (entryKind) {
    case EntryKind.Link:
      return <GlobalOutlined style={{ fontSize: 14 }} />;
    case EntryKind.NoteMarkdown:
      return <EditOutlined style={{ fontSize: 14 }} />;
    case EntryKind.Document:
      return <LinkOutlined style={{ fontSize: 14 }} />;
  }
}

function renderLabels(labels: Label[]) {
  return labels.map((label, i) => (
    <Tag key={label} color="green">
      {label}
    </Tag>
  ));
}

function CustomTable({ entries, highlighted }: CustomTableProps) {
  return (
    <PseudoTable>
      {entries.map((entry, i) => (
        <PseudoTableRow key={entry.key} className={i === highlighted ? "highlight-row" : ""}>
          <TitleWrapper>{entry.title}</TitleWrapper>
          <SymbolWrapper>{renderEntryKindSymbol(entry.entryKind)}</SymbolWrapper>
          <LabelsWrapper>{renderLabels(entry.labels)}</LabelsWrapper>
        </PseudoTableRow>
      ))}
    </PseudoTable>
  );
}

export default Notes;
