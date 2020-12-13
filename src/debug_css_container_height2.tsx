import React from "react";
import ReactDOM from "react-dom";

import styled from "@emotion/styled";

import "./index.css";

const Container = styled.div`
  height: 100%;
  margin: 0px;
  padding: 10px;
  border: solid 5px #000;

  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: #d1ffb7;
`;

const Content = styled.div`
  background: #58a4b8;
  flex-grow: 1;

  overflow-y: auto;
`;

const Row = styled.div`
  display: flex;
  // It is crucial to give the row a fixed height of 100%.
  // Otherwise it will become adaptive in its height.
  height: 100%;

  // Probably not needed because the children specify height: 100% anyway.
  // align-items: stretch;
`;

const Col = styled.div`
  flex-grow: 1;
`;

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
`;

const ScrollContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <WrapperOuter>
      <WrapperInner>{children}</WrapperInner>
    </WrapperOuter>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Container>
      <Header>H</Header>
      <Content>
        <Row>
          <Col>
            <ScrollContent>
              {Array.from(Array(20).keys()).map((i) => (
                <div key={i}>{i}</div>
              ))}
            </ScrollContent>
          </Col>
          <Col>
            <ScrollContent>
              {Array.from(Array(100).keys()).map((i) => (
                <div key={i}>{i}</div>
              ))}
            </ScrollContent>
          </Col>
          <Col>
            <ScrollContent>
              {Array.from(Array(10).keys()).map((i) => (
                <div key={i}>{i}</div>
              ))}
            </ScrollContent>
          </Col>
        </Row>
      </Content>
    </Container>
  </React.StrictMode>,
  document.getElementById("root")
);
