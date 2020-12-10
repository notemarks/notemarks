import React from "react";

import { Typography, Row, Col, Button, Empty } from "antd";

import styled from "@emotion/styled";

import { SizeProps } from "./types_view";

import { GitOpKind } from "./git_ops";
import type { GitOp, GitOps } from "./git_ops";

/*
// ----------------------------------------------------------------------------
// Notes:
// ----------------------------------------------------------------------------
*/

const { Title, Text } = Typography;

const StyledTitle = styled(Title)`
  margin-top: 20px;
`;

const Footer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`;

type NoteViewProps = {
  sizeProps: SizeProps;
  ops: GitOps;
};

function PrepareCommit({ sizeProps, ops }: NoteViewProps) {
  const renderOp = (op: GitOp) => {
    switch (op.kind) {
      case GitOpKind.Write:
        return (
          <li>
            Write file <Text code>{op.path}</Text>
          </li>
        );
      case GitOpKind.Remove:
        return (
          <li>
            Remove file <Text code>{op.path}</Text>
          </li>
        );
      case GitOpKind.Move:
        return (
          <li>
            Move file from <Text code>{op.pathFrom}</Text> to <Text code>{op.pathTo}</Text>
          </li>
        );
    }
  };

  const renderOps = () => {
    return (
      <>
        <StyledTitle level={3}>Staged changes</StyledTitle>
        <ul>{ops.map((op) => renderOp(op))}</ul>
        <Button type="primary">Commit</Button>
        <Footer />
      </>
    );
  };

  return (
    <Row justify="center" style={{ height: "100%" }}>
      <Col {...sizeProps.l} />
      <Col {...sizeProps.c}>
        {ops.length > 0 ? (
          renderOps()
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing to commit" />
        )}
      </Col>
      <Col {...sizeProps.r} />
    </Row>
  );
}

export default PrepareCommit;
