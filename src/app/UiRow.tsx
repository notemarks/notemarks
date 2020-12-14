import React from "react";

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
  className?: string;
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
  style?: React.CSSProperties;
};

export function UiRow({ className, left, center, right, style }: UiRowProps) {
  return (
    <RowContainer className={className} style={style}>
      <ColL>{left}</ColL>
      <ColC>{center}</ColC>
      <ColR>{right}</ColR>
    </RowContainer>
  );
}
