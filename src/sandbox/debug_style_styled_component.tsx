// debug_style_styled_component
import React from "react";
import ReactDOM from "react-dom";

import "./index.css";

import styled from "@emotion/styled";

const Base = styled.div`
  height: 100px;
  width: 100px;
  background: #ade;
`;

const BaseModified = styled(Base)`
  width: 200px;
`;

// The trick is to foward `className` to the underlying element!
// https://emotion.sh/docs/styled#styling-any-component
const ComponentBasedOnBase = ({ className }: { className?: string }) => {
  return <Base className={className}>I'm a component</Base>;
};

const ComponentBasedOnBaseModified = styled(ComponentBasedOnBase)`
  width: 200px;
`;

ReactDOM.render(
  <React.StrictMode>
    <Base>Base</Base>
    <BaseModified>BaseModified</BaseModified>
    <ComponentBasedOnBase />
    <ComponentBasedOnBaseModified />
  </React.StrictMode>,
  document.getElementById("root")
);
