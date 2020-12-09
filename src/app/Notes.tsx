import React, { useEffect, useState } from "react";

import { Tag, Input, Row, Col, Tree, Button } from "antd";
import { EditOutlined, GlobalOutlined, LinkOutlined, DownOutlined } from "@ant-design/icons";

import styled from "@emotion/styled";

import { SizeProps } from "./types_view";
import { Entries, EntryKind, Label, LabelCounts } from "./types";
import * as fn from "./fn_utils";
import { MutableRef } from "./react_utils";
import { Repos } from "./repo";

export function splitSearchTerms(s: string): string[] {
  return s
    .split(/(\s+)/)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 0);
}

export function filterEntries(entries: Entries, searchTerms: string[]): Entries {
  let filteredEntries = [];
  for (let entry of entries) {
    if (searchTerms.length === 0) {
      filteredEntries.push(entry);
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
        filteredEntries.push(entry);
      }
    }
  }
  return filteredEntries;
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

const ExpandButton = styled(Button)`
  margin-top: 20px;
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

const Notes = React.forwardRef(
  (
    { sizeProps, repos, entries, labels, onEnterEntry }: NotesProps,
    ref: MutableRef<HTMLInputElement>
  ) => {
    // *** Entry filtering

    const [filteredEntries, setFilteredEntries] = useState(entries);
    const [searchStats, setSearchStats] = useState({ totalMatchingEntries: entries.length });
    const [numVisibleEntries, setNumVisibleEntries] = useState(20);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [searchTerms, setSearchTerms] = useState<string[]>([]);

    useEffect(() => {
      let newFilteredEntries = filterEntries(entries, searchTerms);
      setSearchStats({ totalMatchingEntries: newFilteredEntries.length });
      setFilteredEntries(newFilteredEntries.slice(0, numVisibleEntries));
    }, [entries, numVisibleEntries, searchTerms]);

    // Note that it is probably necessary to keep this separate from the entry filtering effect above.
    // Issues with merging the two:
    // - We don't want to make selectedIndex a dependency. Otherwise key up/down would
    //   mean to refilter the entries which is unnecessary/slow.
    // - This suggest to use the setSelectedIndex(oldIndex => ...) update form, which
    //   seems to work on first glance. However this is a weird case where we need
    //   both the oldEntries and the oldSelectedIndex at once, and I don't see how
    //   we can actually read them **both**.
    // HOWEVER: We also don't have access to the old entries is this way either!
    useEffect(() => {
      if (entries.length > 0) {
        setSelectedIndex(0);
      } else {
        setSelectedIndex(-1);
      }
    }, [entries, searchTerms]);

    /*
    // Note: For now the filteredEntries are computed asynchronously.
    // This leads to the double rendering of the component when the
    // search terms change. See e.g.:
    // https://stackoverflow.com/questions/56028913/usememo-vs-useeffect-usestate
    // In theory we could simplify it to:
    const filteredEntries = React.useMemo(() => filterEntries(entries, searchTerms), [
      entries,
      searchTerms,
    ]);
    // However, using `useEffect` could be beneficial because:
    // 1. If we want to do full text search, we probably need an async approach anyway,
    //    due to the overhead. When using `useMemo` would could keep the computation
    //    of "title filtered" synchronous, but we would have to merge the results of
    //    the synchrnously filtered with the results of the asynchronously filtered
    //    somehow, which would lead to a double rendering anyway.
    // 2. Using `React.memo` on the JSX components that don't change (actually nothing
    //    in the VDOM changes when the searchTerms change) should make the first
    //    re-rendering fast.
    */

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      // TODO: Improve performance
      // https://stackoverflow.com/a/50820219/1804173
      // https://stackoverflow.com/a/28046731/1804173
      window.requestAnimationFrame(() => {
        setSearchTerms(splitSearchTerms(event.target.value));
      });
    };

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
          break;
      }
    }

    // *** render help
    const renderExpandButton = () => {
      if (searchStats.totalMatchingEntries > filteredEntries.length) {
        return (
          <Row justify="center">
            <ExpandButton
              type="dashed"
              shape="circle"
              onClick={(event) => {
                setNumVisibleEntries((n) =>
                  n + 10 <= searchStats.totalMatchingEntries
                    ? n + 10
                    : searchStats.totalMatchingEntries
                );
              }}
            >
              <DownOutlined />
            </ExpandButton>
          </Row>
        );
      } else {
        return null;
      }
    };

    return (
      <>
        <Row justify="center">
          <Col {...sizeProps.l} />
          <Col {...sizeProps.c}>
            <StyledInput
              ref={(antdInputRef) => {
                // Since we don't want to expose the ref as an Antd Input, but rather HTMLInputElement
                // we need this callback to unwrap the underlying DOM element.
                if (ref != null) {
                  if (typeof ref === "function") {
                    ref(fn.mapUndefinedToNull(antdInputRef?.input));
                  } else {
                    ref.current = fn.mapUndefinedToNull(antdInputRef?.input);
                  }
                }
              }}
              onChange={onChange}
              onKeyDown={onKeydown}
              autoFocus
            />
          </Col>
          <Col {...sizeProps.r} />
        </Row>
        <Row justify="center" style={{ height: "100%" }}>
          <Col {...sizeProps.l} style={{ paddingLeft: 20 }}>
            <LabelTree labels={labels} />
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
            {renderExpandButton()}
            <Footer />
          </Col>
          <Col {...sizeProps.r} />
        </Row>
      </>
    );
  }
);

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

const CustomTable = React.memo(({ entries, highlighted }: CustomTableProps) => {
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
});

// ----------------------------------------------------------------------------
// Label tree
// ----------------------------------------------------------------------------

type LabelTreeProps = {
  labels: LabelCounts;
};

const LabelTree = React.memo(({ labels }: LabelTreeProps) => {
  // *** Label tree data

  const treeData = labels.map((labelCount) => {
    return {
      title: labelCount.label + " (" + labelCount.count + ")",
      key: labelCount.label,
    };
  });

  return (
    <Tree treeData={treeData} selectable={false} titleRender={(data) => <Tag>{data.title}</Tag>} />
    /*
    {labels.map((label) => (
      <div key={label.label}>
        <Tag>{label.label}</Tag>
      </div>
    ))}
    */
  );
});

export default Notes;
