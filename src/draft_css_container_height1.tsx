import React from "react";
import ReactDOM from "react-dom";

import styled from "@emotion/styled";

import "./index.css";

/*
Notes:

It is crucial to adjust the overflow-y behavior. The default 'visible'
does not make sense, because it simply leads to overflowing the content,
i.e., Header + Content are just larger than Container, which introduces
a scrollbar on the html body despite having Container limited to the
viewport height.

In this example overflow-y can be set to either 'scroll' or 'auto',
doesn't seem to make a different (i.e., no scrollbar visible in the
'scroll' case if content is small/non-scrollable).
*/

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

ReactDOM.render(
  <React.StrictMode>
    <Container>
      <Header>H</Header>
      <Content>
        {Array.from(Array(100).keys()).map((i) => (
          <div>{i}</div>
        ))}
      </Content>
    </Container>
  </React.StrictMode>,
  document.getElementById("root")
);
