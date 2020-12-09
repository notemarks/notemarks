/* eslint-disable @typescript-eslint/no-unused-vars */
// debug_fast_table_row_select
import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";

import { Tag, Input, Row, Col, Tree, Button } from "antd";

import styled from "@emotion/styled";

const Styled = styled.div`
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

const StyledRow = styled.div`
  padding-top: 4px;
  padding-bottom: 4px;
  display: flex;
  vertical-align: baseline;

  > div {
    flex-grow: 1;
  }
`;

// ----------------------------------------------------------------------------
// Idiomatic / slow impl
// ----------------------------------------------------------------------------

const ComponentSlow = () => {
  let entries = Array.from(Array(200).keys()).map((x) => "" + x);

  let [highlighted, setHighlighted] = useState(0);

  function onKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        setHighlighted((i) => (i + entries.length - 1) % entries.length);
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlighted((i) => (i + entries.length + 1) % entries.length);
        break;
    }
  }

  return (
    <>
      <Input onKeyDown={onKeydown} autoFocus />
      <CustomTableSlow entries={entries} highlighted={highlighted} />
    </>
  );
};

type CustomTableSlowProps = {
  entries: string[];
  highlighted: number;
};

const CustomTableSlow = React.memo(({ entries, highlighted }: CustomTableSlowProps) => {
  return (
    <Styled>
      {entries.map((entry, i) => (
        <StyledRow key={entry} className={i === highlighted ? "highlight-row" : ""}>
          <div>foo</div>
          <div>{entry}</div>
          <div>bar</div>
        </StyledRow>
      ))}
    </Styled>
  );
});

// ----------------------------------------------------------------------------
// Fast impl
// ----------------------------------------------------------------------------

export type MutableRef<T> = Parameters<React.ForwardRefRenderFunction<T, unknown>>[1];
export type RowsRef = Array<HTMLDivElement | null>;

const usePrevious = <T extends unknown>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const ComponentFast = () => {
  let [entries, setEntries] = useState(Array.from(Array(200).keys()).map((x) => "" + x));

  let [highlighted, setHighlighted] = useState(0);

  let rowsRef = useRef<Array<HTMLDivElement | null>>(entries.map((_) => null));

  let prevHighlighted = useRef(-1);
  useEffect(() => {
    // console.log("Highlighting:", prevHighlighted.current, highlighted);
    if (prevHighlighted.current !== -1) {
      rowsRef.current[prevHighlighted.current]?.classList.remove("highlight-row");
    }
    rowsRef.current[highlighted]?.classList.add("highlight-row");
    prevHighlighted.current = highlighted;
  }, [highlighted]);

  function onKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
    //console.log(rowsRef);
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        setHighlighted((i) => (i + entries.length - 1) % entries.length);
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlighted((i) => (i + entries.length + 1) % entries.length);
        break;
    }
  }

  return (
    <>
      <Input onKeyDown={onKeydown} autoFocus />
      <CustomTableFast entries={entries} ref={rowsRef} />
    </>
  );
};

type CustomTableFastProps = {
  entries: string[];
};

const CustomTableFast = React.memo(
  React.forwardRef(({ entries }: CustomTableFastProps, rowsRef: MutableRef<RowsRef>) => {
    console.log("re-render");
    //let rowRefs = useRef<Array<HTMLDivElement | null>>(entries.map((_) => null));

    return (
      <Styled>
        {entries.map((entry, i) => (
          <StyledRow
            key={entry}
            ref={(ref) => {
              //console.log(rowsRef, ref);
              if (rowsRef != null && ref != null) {
                (rowsRef as React.MutableRefObject<RowsRef>).current[i] = ref;
              }
            }}
          >
            <div>foo</div>
            <div>{entry}</div>
            <div>bar</div>
          </StyledRow>
        ))}
      </Styled>
    );
  })
);

ReactDOM.render(
  <React.StrictMode>
    FooBar
    <ComponentFast />
  </React.StrictMode>,
  document.getElementById("root")
);
