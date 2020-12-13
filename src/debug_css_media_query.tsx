import React from "react";
import ReactDOM from "react-dom";

import "./index.css";

import styled from "@emotion/styled";

const Responsive = styled.div`
  font-size: 30px;
  @media (min-width: 800px) {
    font-size: 50px;
  }
`;

const breakpoints: { [index: string]: number } = {
  sm: 500,
  md: 768,
  lg: 992,
  xl: 1200,
};

const mq = Object.keys(breakpoints)
  .map((key) => [key, breakpoints[key]] as [string, number])
  .reduce((prev, [key, breakpoint]) => {
    prev[key] = `@media (min-width: ${breakpoint}px)`;
    return prev;
  }, {} as { [index: string]: string });

const Container = styled.div`
  ${mq["sm"]} {
    max-width: 750px;
  }
  ${mq["md"]} {
    max-width: 970px;
  }
  ${mq["lg"]} {
    max-width: 1170px;
  }
`;

const Component = () => {
  return <Responsive>Hello World</Responsive>;
};

ReactDOM.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
  document.getElementById("root")
);
