import React, { useRef } from "react";

import { Typography, Button, List, Input, Empty, Modal } from "antd";
import { TextAreaRef } from "antd/lib/input/TextArea";

import styled from "@emotion/styled";

import { UiRow } from "../components/UiRow";

import { Repo } from "../repo";
import { GitOpKind, mapMultiRepoGitOpsFlat, mapMultiRepoGitOpsGrouped } from "../git_ops";
import type { GitOp, MultiRepoGitOps } from "../git_ops";
import * as octokit from "../octokit";

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

type PrepareCommitProps = {
  ops: MultiRepoGitOps;
  onSuccessfulCommit: () => void;
};

function PrepareCommit({ ops, onSuccessfulCommit }: PrepareCommitProps) {
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

  const onCommit = async () => {
    let commitMsg = "";
    if (textAreaRef.current != null && textAreaRef.current.value != null) {
      // console.log(textAreaRef.current);
      commitMsg = textAreaRef.current.value;
    }
    // Temporary workaround for https://github.com/ant-design/ant-design/issues/28332
    if (textAreaRef.current != null && (textAreaRef.current as any)?.state?.value != null) {
      console.log(textAreaRef.current);
      let value = (textAreaRef.current as any)?.state?.value;
      if (typeof value === "string") {
        commitMsg = value;
      }
    }
    if (commitMsg.trim().length === 0) {
      Modal.error({
        title: "Illegal commit message",
        content: "Commit message must not be empty",
      });
    } else {
      let allResultPromises = mapMultiRepoGitOpsGrouped(ops, (repo, ops) => {
        return octokit.commit(repo, ops, commitMsg);
      });
      let allResults = await Promise.all(allResultPromises);
      let allSuccessful = allResults.length === allResults.filter((result) => result.isOk()).length;
      if (allSuccessful) {
        Modal.success({
          title: "Success",
          content: "Changes committed successfully",
        });
        // We need a callback into the main App to mark changes as committed.
        // In fact, the question is whether we shoudl rather trigger a refresh to properly
        // update the git hashes of all files. However, what if the changes don't appear
        // immediately in a refresh? Delay the refresh? Perhaps it is even better to consider
        // the local state as ground truth for the repo state.
        onSuccessfulCommit();
      } else {
        Modal.error({
          title: "Failure",
          content: "Failed to commit some changes. Do you have access to the repository?",
        });
      }
    }
  };

  return (
    <UiRow
      center={
        Object.keys(ops).length > 0 ? (
          renderOps()
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing to commit" />
        )
      }
    />
  );
}

export default PrepareCommit;
