import React from "react";

import { Typography, Row, Col, Button, List, Input, Empty } from "antd";

import styled from "@emotion/styled";

import { SizeProps } from "./types_view";

import { GitOpKind } from "./git_ops";
import type { GitOp, GitOps } from "./git_ops";

function prepareCommitMessage(ops: GitOps): string {
  return ops
    .map((op) => {
      switch (op.kind) {
        case GitOpKind.Write:
          return `- written file ${op.path}`;
        case GitOpKind.Remove:
          return `- removed file ${op.path}`;
        case GitOpKind.Move:
          return `- moved file from ${op.pathFrom} to ${op.pathTo}`;
      }
      return "";
    })
    .join("\n");
}

/*
// ----------------------------------------------------------------------------
// Notes:
// ----------------------------------------------------------------------------
*/

const { Title, Text } = Typography;
const { TextArea } = Input;

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
          <div>
            Write file <Text code>{op.path}</Text>
          </div>
        );
      case GitOpKind.Remove:
        return (
          <div>
            Remove file <Text code>{op.path}</Text>
          </div>
        );
      case GitOpKind.Move:
        return (
          <div>
            Move file from <Text code>{op.pathFrom}</Text> to <Text code>{op.pathTo}</Text>
          </div>
        );
    }
  };

  const renderOps = () => {
    return (
      <>
        <StyledTitle level={4}>Staged changes</StyledTitle>
        <List
          bordered
          dataSource={ops}
          renderItem={(item: GitOp) => <List.Item>{renderOp(item)}</List.Item>}
        />
        <StyledTitle level={4}>Commit message</StyledTitle>
        <TextArea rows={4} defaultValue={prepareCommitMessage(ops)} />
        <Button type="primary" style={{ marginTop: "20px" }}>
          Commit
        </Button>
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
