import React from "react";

import { Tree } from "antd";
import { DataNode } from "rc-tree/lib/interface";

import styled from "@emotion/styled";

import { DefaultTag } from "./ColorTag";

import { LabelCount, LabelCounts } from "./types";

/*
// ----------------------------------------------------------------------------
// Notes:
// ----------------------------------------------------------------------------
*/

const ResponsiveTree = styled(Tree)`
  // This follows the breakpoint that ensures the left sidebar is at least 200px
  @media not all and (min-width: 768px) {
    display: none;
  }
`;

const FilterStatusWrapper = styled.span`
  position: relative;
`;

const FilterStatus = styled.span`
  position: absolute;
  bottom: 0;
  right: 0.1rem;
  width: 4px;
  height: 1rem;
  border-radius: 4px;

  background-color: #e2ebf5;
  transition: all 1s linear;
`;

const LabelCountEl = styled.span`
  position: relative;
  bottom: -0.25em;
  margin-left: 0.3rem;
  font-size: 0.5rem;
  font-weight: bold;

  /* Pretend height is zero to avoid adding to height of tag */
  display: inline-block;
  height: 0;
  overflow: visible;
`;

function renderLabel(labelCount: LabelCount): DataNode {
  let children =
    labelCount.label !== "foo" && labelCount.label !== "bar" && labelCount.label[0] === "g"
      ? [renderLabel({ label: "foo", count: 10 }), renderLabel({ label: "bar", count: 20 })]
      : [];

  return {
    title: (
      <>
        <FilterStatusWrapper>
          <FilterStatus />
        </FilterStatusWrapper>
        <DefaultTag>
          {labelCount.label}
          <LabelCountEl>{labelCount.count}</LabelCountEl>
        </DefaultTag>
      </>
    ),
    key: labelCount.label,
    selectable: false,
    children: children,
  };
}

type LabelTreeProps = {
  labels: LabelCounts;
};

export const LabelTree = React.memo(({ labels }: LabelTreeProps) => {
  // *** Label tree data

  const treeData = labels.map((labelCount) => renderLabel(labelCount));

  return <ResponsiveTree treeData={treeData} selectable={false} />;
});

export default LabelTree;
