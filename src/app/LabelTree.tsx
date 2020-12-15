import React, { useRef } from "react";

import { Tree } from "antd";
import { DataNode } from "rc-tree/lib/interface";

import styled from "@emotion/styled";

import { DefaultTag } from "./ColorTag";

import { Label, Labels } from "./types";

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

  .included {
    background: hsl(141, 53%, 53%);
  }

  .excluded {
    background: hsl(348, 86%, 61%);
  }
`;

const FilterStatus = styled.span`
  position: absolute;
  bottom: 0;
  right: 0.1rem;
  width: 4px;
  height: 1rem;
  border-radius: 4px;

  background: #e2ebf5;
  transition: all 0.2s linear;
`;

const LabelCount = styled.span`
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

type RefMap = { [fullName: string]: { element: HTMLElement | null; state: number } };

function renderLabel(
  label: Label,
  refMap: RefMap,
  onClick: (label: Label, selected: boolean) => void
): DataNode {
  return {
    title: (
      <>
        <FilterStatusWrapper>
          <FilterStatus
            ref={(ref) => {
              // Note that if there is already an existing ref with state, we have to
              // take over its state so that the initialized state here matches the DOM.
              refMap[label.fullName] = { element: ref, state: refMap[label.fullName]?.state || 0 };
            }}
          />
        </FilterStatusWrapper>
        <DefaultTag
          onClick={(event) => {
            onClick(label, true);
            event.preventDefault();
          }}
          onContextMenu={(event) => {
            onClick(label, false);
            event.preventDefault();
          }}
        >
          {label.baseName}
          <LabelCount>{label.count}</LabelCount>
        </DefaultTag>
      </>
    ),
    key: label.fullName,
    children: label.children.map((subLabel) => renderLabel(subLabel, refMap, onClick)),
  };
}

type LabelTreeProps = {
  labels: Labels;
  onSetLabelFilter: (label: Label, state: number) => void;
};

export const LabelTree = React.memo(({ labels, onSetLabelFilter }: LabelTreeProps) => {
  // console.log("Rendering: LabelTree");

  let labelTagRefs = useRef({} as RefMap);

  function onClick(label: Label, selected: boolean) {
    let ref = labelTagRefs.current[label.fullName];
    // console.log(ref);
    if (ref != null && ref.element != null) {
      if (selected) {
        if (ref.state < 0) {
          ref.element.classList.remove("excluded");
          ref.element.classList.add("included");
          ref.state = 1;
          onSetLabelFilter(label, 1);
        } else if (ref.state === 0) {
          ref.element.classList.add("included");
          ref.state = 1;
          onSetLabelFilter(label, 1);
        } else {
          ref.element.classList.remove("included");
          ref.state = 0;
          onSetLabelFilter(label, 0);
        }
      } else {
        if (ref.state > 0) {
          ref.element.classList.remove("included");
          ref.element.classList.add("excluded");
          ref.state = -1;
          onSetLabelFilter(label, -1);
        } else if (ref.state === 0) {
          ref.element.classList.add("excluded");
          ref.state = -1;
          onSetLabelFilter(label, -1);
        } else {
          ref.element.classList.remove("excluded");
          ref.state = 0;
          onSetLabelFilter(label, 0);
        }
      }
    }
  }

  const treeData = labels.map((labelCount) =>
    renderLabel(labelCount, labelTagRefs.current, onClick)
  );

  return <ResponsiveTree treeData={treeData} selectable={false} checkable={false} />;
});

export default LabelTree;
