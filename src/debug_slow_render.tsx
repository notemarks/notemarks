// debug_style_styled_component
import React, { useState } from "react";
import ReactDOM from "react-dom";

import "./index.css";

import { Tag } from "antd";

import styled from "@emotion/styled";

type Entry = {
  key: string;
  title: string;
  kind: string;
  labels: string[];
};

const PseudoTable = styled.div`
  font-size: 11px;
  cursor: pointer;

  .highlight-row {
    background: #e8f6fe; /* Antd's select color used e.g. in AutoComplete */

    /* Implement highlight border via box shadow to avoid messing with box sizes (see alternative below) */
    border-radius: 3px;
    box-shadow: 0px 0px 0px 1px #b0e0fc;

    /* Since we are using box-sizing: border-box, we need to counter the border with negative margins */
    //border: 1px solid #b0e0fc;
    //margin-top: -1px;
    //margin-bottom: -1px;
    //margin-left: -1px;
    //margin-right: -1px;
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
  entries: Entry[];
  highlighted: number;
};

const DefaultTag = styled(Tag)`
  color: whitesmoke;
  background: #464648;
  border-color: #111;

  // To prevent double click selection: https://stackoverflow.com/a/7018415/1804173
  user-select: none;
`;

function renderEntryKindSymbol(entry: Entry) {
  return <span>{entry.kind}</span>;
}

function renderLabels(labels: string[]) {
  return labels.map((label, i) => <DefaultTag key={label}>{label}</DefaultTag>);
}

const CustomTable = React.memo(({ entries, highlighted }: CustomTableProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <button onClick={() => setVisible((visible) => !visible)}>toggle</button>
      {visible ? (
        <PseudoTable>
          {entries.map((entry, i) => (
            <PseudoTableRow key={entry.key} className={i === highlighted ? "highlight-row" : ""}>
              <TitleWrapper>{entry.title}</TitleWrapper>
              <SymbolWrapper>{renderEntryKindSymbol(entry)}</SymbolWrapper>
              <LabelsWrapper>{renderLabels(entry.labels)}</LabelsWrapper>
            </PseudoTableRow>
          ))}
        </PseudoTable>
      ) : null}
    </>
  );
});

ReactDOM.render(
  <React.StrictMode>
    <CustomTable
      highlighted={0}
      entries={Array.from(Array(30).keys()).map((i) => ({
        key: "" + i,
        title: "asfd " + i,
        kind: "A",
        labels: ["foo", "bar"],
      }))}
    ></CustomTable>
  </React.StrictMode>,
  document.getElementById("root")
);
