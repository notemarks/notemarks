import React from "react";

import { Empty } from "antd";
import { UploadOutlined } from "@ant-design/icons";

import styled from "@emotion/styled";

export const NoEntrySelected = () => (
  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No entry selected" />
);

const WrapperOuter = styled.div`
  position: relative;
  overflow: auto;
  // This height specification is crucial as well, otherwise the box height
  // collapses completely.
  height: 100%;
`;

const WrapperInner = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  // It looks like it is equivalent to specify width/height or bottom/right
  width: 100%;
  height: 100%;
  // bottom: 0;
  // right: 0;

  padding: 1px;
`;

export function ScrollContent({ children }: { children: React.ReactNode }) {
  return (
    <WrapperOuter>
      <WrapperInner>{children}</WrapperInner>
    </WrapperOuter>
  );
}

export function UploadOutlinedWithStatus({ status }: { status: boolean }) {
  return (
    <>
      <UploadOutlined style={{ fontSize: 16 }} />
      <span
        style={{
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "0px",
            top: "-6px",
            display: "inline-block",
            height: "7px",
            width: "7px",
            backgroundColor: "#f33756",
            borderRadius: "50%",
            transition: "all 0.2 linear",
            opacity: status ? 1 : 0,
          }}
        />
      </span>
    </>
  );
}
