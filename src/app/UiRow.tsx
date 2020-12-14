import React from "react";

import styled from "@emotion/styled";

// In general recommended breakpoints from Bootstrap are
// 576px, 768px, 992px, 1200px
// https://getbootstrap.com/docs/4.0/layout/overview/#responsive-breakpoints

// Also see my alternative impl at: https://stackoverflow.com/a/65281378/1804173
const mq = {
  xs: "@media (max-width: 576px)",
  sm: "@media (min-width: 576px)",
  md: "@media (min-width: 768px)",
  lg: "@media (min-width: 992px)",
  xl: "@media (min-width: 1200px)",
};

const RowContainer = styled.div`
  display: flex;
`;

const ColL = styled.div`
  ${mq["xs"]} {
    flex: 0 0 16px;
    min-width: 16px;
  }
  ${mq["sm"]} {
    flex: 0 0 16px;
    min-width: 16px;
  }
  ${mq["lg"]} {
    flex: 1 0 200px;
    min-width: 200px;
  }
  ${mq["md"]} {
    flex: 1 0 200px;
    min-width: 200px;
  }
`;
const ColC = styled.div`
  ${mq["xs"]} {
    flex: 1 1 576px;
  }
  ${mq["sm"]} {
    flex: 1 1 576px;
  }
  ${mq["md"]} {
    flex: 1 1 768px;
  }
  ${mq["lg"]} {
    flex: 1 1 992px;
  }
  ${mq["xl"]} {
    flex: 0 1 1200px;
  }
`;
const ColR = styled.div`
  ${mq["xs"]} {
    flex: 0 0 16px;
    min-width: 16px;
  }
  ${mq["sm"]} {
    flex: 0 0 16px;
    min-width: 16px;
  }
  ${mq["xl"]} {
    flex: 2 0 200px;
    min-width: 200px;
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
