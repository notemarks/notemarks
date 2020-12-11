import React from "react";

import { Typography, Row, Col, Button, List, Input, Empty } from "antd";

import styled from "@emotion/styled";

import { SizeProps } from "./types_view";

import { GitOpKind, mapMultiRepoGitOps } from "./git_ops";
import type { GitOp, MultiRepoGitOps } from "./git_ops";

function prepareCommitMessage(ops: MultiRepoGitOps): string {
  return mapMultiRepoGitOps(ops, (repoId, op) => {
    switch (op.kind) {
      case GitOpKind.Write:
        return `- written file ${op.path}`;
      case GitOpKind.Remove:
        return `- removed file ${op.path}`;
      case GitOpKind.Move:
        return `- moved file from ${op.pathFrom} to ${op.pathTo}`;
    }
    return "";
  }).join("\n");
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
  ops: MultiRepoGitOps;
};

function PrepareCommit({ sizeProps, ops }: NoteViewProps) {
  const renderOp = (repoId: string, op: GitOp) => {
    switch (op.kind) {
      case GitOpKind.Write:
        return (
          <div>
            Write file <Text code>{op.path}</Text> in repo {repoId}
          </div>
        );
      case GitOpKind.Remove:
        return (
          <div>
            Remove file <Text code>{op.path}</Text> in repo {repoId}
          </div>
        );
      case GitOpKind.Move:
        return (
          <div>
            Move file from <Text code>{op.pathFrom}</Text> to <Text code>{op.pathTo}</Text> in repo{" "}
            {repoId}
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
          dataSource={mapMultiRepoGitOps(ops, (repoId, op) => ({ repoId, op }))}
          renderItem={({ repoId, op }) => <List.Item>{renderOp(repoId, op)}</List.Item>}
        />
        <StyledTitle level={4}>Commit message</StyledTitle>
        <TextArea rows={4} defaultValue={prepareCommitMessage(ops)} />
        <Button type="primary" style={{ marginTop: "20px" }} onClick={onCommit}>
          Commit
        </Button>
        <Footer />
      </>
    );
  };

  const onCommit = () => {
    console.log("Committing");
  };

  return (
    <Row justify="center" style={{ height: "100%" }}>
      <Col {...sizeProps.l} />
      <Col {...sizeProps.c}>
        {Object.keys(ops).length > 0 ? (
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
