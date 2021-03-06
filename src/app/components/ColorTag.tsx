import React from "react";

import { Tag } from "antd";

import styled from "@emotion/styled";

export type ColorTagProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function ColorTag({ className, style, children }: ColorTagProps) {
  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}

export const DefaultTag = styled(Tag)`
  color: whitesmoke;
  background: #464648;
  border-color: #111;

  // To prevent double click selection: https://stackoverflow.com/a/7018415/1804173
  user-select: none;
`;
