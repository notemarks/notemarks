import React, { useState } from "react";

import { Typography, Button, Table, Modal } from "antd";

import styled from "@emotion/styled";

import { UiRow } from "../components/UiRow";

import { GitOpKind } from "../git_ops";
import type { GitOps, MultiRepoGitOps } from "../git_ops";
import * as octokit from "../octokit";
import * as fn from "../utils/fn_utils";
import { getRepoCommitPage } from "../repo";

function prepareCommitMessage(ops: GitOps): string {
  return ops
    .map((op) => {
      switch (op.kind) {
        case GitOpKind.Write:
          return `updating ${op.path}`;
        case GitOpKind.Remove:
          return `removing ${op.path}`;
        case GitOpKind.Move:
          return `moving ${op.pathSrc} to ${op.pathDst}`;
        default:
          fn.assertUnreachable(op);
          return "";
      }
    })
    .join("\n");
}

const columns = [
  {
    title: <b>Repository</b>,
    dataIndex: "repo",
    key: "repo",
  },
  {
    title: <b>Operation</b>,
    dataIndex: "op",
    key: "op",
  },
  {
    title: <b>File</b>,
    dataIndex: "file",
    key: "file",
  },
];

type TableRow = {
  key: number; // Only used by Antd internally
  repo: string;
  op: string;
  file: React.ReactNode;
};

function buildTableDataSource(ops: MultiRepoGitOps): TableRow[] {
  var key = 0;
  return ops.flatMap((repo, ops) =>
    ops.map((op) => ({
      key: ++key,
      repo: repo.name,
      op: op.kind,
      file:
        op.kind !== GitOpKind.Move ? (
          <Text code>{op.path}</Text>
        ) : (
          <>
            <Text code>{op.pathSrc}</Text> to <Text code>{op.pathDst}</Text>
          </>
        ),
    }))
  );
}

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

type PrepareCommitProps = {
  ops: MultiRepoGitOps;
  onSuccessfulCommit: () => void;
};

function PrepareCommit({ ops, onSuccessfulCommit }: PrepareCommitProps) {
  // refs
  // let textAreaRef = useRef<TextAreaRef>(null);

  let [isCommitting, setIsCommitting] = useState(false);

  const anyStagedChange = () => {
    return Object.keys(ops).length > 0;
  };

  const renderOps = () => {
    return (
      <>
        <StyledTitle level={4}>Staged changes</StyledTitle>
        <Table
          bordered
          columns={columns}
          dataSource={buildTableDataSource(ops)}
          pagination={false}
          size="small"
        />
        {/*
        <StyledTitle level={4}>Commit message</StyledTitle>
        <TextArea ref={textAreaRef} rows={4} defaultValue={prepareCommitMessage(ops)} />
        */}
        <Button
          type="primary"
          style={{ marginTop: "20px" }}
          loading={isCommitting}
          disabled={!anyStagedChange()}
          onClick={onCommit}
        >
          Commit
        </Button>
        <Footer />
      </>
    );
  };

  const onCommit = async () => {
    setIsCommitting(true);

    let allResultPromises = ops.flatMap((repo, singleRepoOps) => {
      if (singleRepoOps.length > 0) {
        let perRepoCommitMessage = prepareCommitMessage(singleRepoOps);
        return [
          octokit
            .commit(repo, singleRepoOps, perRepoCommitMessage)
            .map((commitHash) => ({ repo: repo, commitHash: commitHash })),
        ];
      } else {
        return [];
      }
    });
    let allResults = await Promise.all(allResultPromises);

    setIsCommitting(false);

    let successfulResults = allResults
      .filter((result) => result.isOk())
      .map((result) => result._unsafeUnwrap());
    let allSuccessful = allResults.length === successfulResults.length;
    if (allSuccessful) {
      // https://github.com/bluenote10/DummyRepo/commit/b7c9388eda40d273692466ee51e9bc19f0b50add
      Modal.success({
        title: "Success",
        content: (
          <>
            Changes committed successfully:{" "}
            {successfulResults
              .map<React.ReactNode>(({ repo, commitHash }) => (
                <a
                  href={getRepoCommitPage(repo, commitHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {commitHash.slice(0, 7)}
                </a>
              ))
              .reduce((prev, curr) => [prev, ", ", curr])}
          </>
        ),
      });
      onSuccessfulCommit();
    } else {
      Modal.error({
        title: "Failure",
        content: "Failed to commit some changes. Do you have access to the repository?",
      });
    }
  };

  return <UiRow center={renderOps()} />;
}

export default PrepareCommit;

/*
This old implementation was offering a customizable commit message, but this
logically flawed, because a commit message should not be the same for multiple
repositories. Each repository needs its own commit message to reflect the
actual changes in that repo. From a UX perspective this is a bit more challenging
to offer multiple text areas for each repo. Since the feature is not super
crucial, let's go for auto generated commit messages for now.

Keeping this as a reference, because it contains the ugly hack around Antd's
text area ref issue.

import { TextAreaRef } from "antd/lib/input/TextArea";

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
      // In fact, the question is whether we should rather trigger a refresh to properly
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
*/
