// draft_css_responsive_row
import React from "react";
import ReactDOM from "react-dom";

import "./index.css";

import styled from "@emotion/styled";

const breakpoints: { [index: string]: number } = {
  sm: 0,
  md: 1000,
  xl: 1400,
};

const mq = Object.keys(breakpoints)
  .map((key) => [key, breakpoints[key]] as [string, number])
  .reduce((prev, [key, breakpoint]) => {
    prev[key] = `@media (min-width: ${breakpoint}px)`;
    return prev;
  }, {} as { [index: string]: string });

const RowContainer = styled.div`
  display: flex;
`;

const ColL = styled.div`
  ${mq["sm"]} {
    display: none;
  }
  ${mq["md"]} {
    flex: 1 0 200px;
    display: block;
  }
`;
const ColC = styled.div`
  ${mq["sm"]} {
    flex: 1 0 800px;
  }
  ${mq["xl"]} {
    flex: 0 0 1000px;
  }
`;
const ColR = styled.div`
  ${mq["sm"]} {
    display: none;
  }
  ${mq["xl"]} {
    flex: 2 0 200px;
    display: block;
  }
`;

export type UiRowProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
};

export function UiRow({ left, center, right }: UiRowProps) {
  return (
    <RowContainer>
      <ColL>{left}</ColL>
      <ColC>{center}</ColC>
      <ColR>{right}</ColR>
    </RowContainer>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <UiRow
      left={<div style={{ background: "#efff95" }}>Left</div>}
      center={<div style={{ background: "#18e4ff" }}>Center</div>}
      right={<div style={{ background: "#ffc4fa" }}>Right</div>}
    />
  </React.StrictMode>,
  document.getElementById("root")
);
