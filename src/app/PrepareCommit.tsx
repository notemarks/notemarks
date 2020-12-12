import React, { useRef } from "react";

import { Typography, Row, Col, Button, List, Input, Empty } from "antd";
import { TextAreaRef } from "antd/lib/input/TextArea";

import styled from "@emotion/styled";

import { SizeProps } from "./types_view";

import { Repo } from "./repo";
import { GitOpKind, mapMultiRepoGitOpsFlat, mapMultiRepoGitOpsGrouped } from "./git_ops";
import type { GitOp, MultiRepoGitOps } from "./git_ops";
import * as octokit from "./octokit";

function prepareCommitMessage(ops: MultiRepoGitOps): string {
  return mapMultiRepoGitOpsFlat(ops, (repoId, op) => {
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
  // refs
  let textAreaRef = useRef<TextAreaRef>(null);

  const renderOp = (repo: Repo, op: GitOp) => {
    switch (op.kind) {
      case GitOpKind.Write:
        return (
          <div>
            Write file <Text code>{op.path}</Text> in repo {repo.name}
          </div>
        );
      case GitOpKind.Remove:
        return (
          <div>
            Remove file <Text code>{op.path}</Text> in repo {repo.name}
          </div>
        );
      case GitOpKind.Move:
        return (
          <div>
            Move file from <Text code>{op.pathFrom}</Text> to <Text code>{op.pathTo}</Text> in repo{" "}
            {repo.name}
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
          dataSource={mapMultiRepoGitOpsFlat(ops, (repo, op) => ({ repo, op }))}
          renderItem={({ repo, op }) => <List.Item>{renderOp(repo, op)}</List.Item>}
        />
        <StyledTitle level={4}>Commit message</StyledTitle>
        <TextArea ref={textAreaRef} rows={4} defaultValue={prepareCommitMessage(ops)} />
        <Button type="primary" style={{ marginTop: "20px" }} onClick={onCommit}>
          Commit
        </Button>
        <Footer />
      </>
    );
  };

  const onCommit = () => {
    let commitMsg = "";
    if (textAreaRef.current != null && textAreaRef.current.value != null) {
      //console.log(textAreaRef.current);
      commitMsg = textAreaRef.current.value;
    }
    console.log(commitMsg);
    mapMultiRepoGitOpsGrouped(ops, (repo, ops) => {
      octokit.commit(repo, ops, commitMsg);
    });
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
