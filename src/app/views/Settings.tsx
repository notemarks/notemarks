import React, { useCallback } from "react";

import { Space, Input, Row, Col, Switch, Card, Button, Divider } from "antd";
import { RowProps } from "antd/lib/row";

import {
  PlusOutlined,
  GithubOutlined,
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
  LoadingOutlined,
} from "@ant-design/icons";

import styled from "@emotion/styled";

import { UiRow } from "../components/UiRow";

import { Repo, Repos, VerificationStatus, createDefaultInitializedRepo } from "../repo";
import * as octokit from "../octokit";

const StyledRepoTitle = styled.span`
  font-size: 16px;
`;

// ----------------------------------------------------------------------------
// Header
// ----------------------------------------------------------------------------

function Header(repo: Repo) {
  return (
    <Space>
      <Row wrap={false} align="middle" gutter={8}>
        <Col flex="auto">
          <GithubOutlined style={{ fontSize: "32px", color: "#666" }} />
        </Col>
        <Col flex="auto">
          <StyledRepoTitle>{repo.name}</StyledRepoTitle>
        </Col>
      </Row>
    </Space>
  );
}

// ----------------------------------------------------------------------------
// RepoForm
// ----------------------------------------------------------------------------

const fromRowProps: RowProps = { justify: "end", align: "middle" as "middle", gutter: [8, 16] };

function FormRow({ text, children }: { text?: string; children: React.ReactNode }) {
  return (
    <Row {...fromRowProps}>
      {text != null ? <Col>{text}</Col> : null}
      <Col span={16}>{children}</Col>
    </Row>
  );
}

function RepoForm({
  repo,
  onDelete,
  onEdited,
  onMakeDefault,
}: {
  repo: Repo;
  onDelete: () => void;
  onEdited: (repo: Repo) => void;
  onMakeDefault: () => void;
}) {
  return (
    <>
      <FormRow text="Name:">
        <Input
          placeholder="Name within Notemarks"
          value={repo.name}
          onChange={(evt) => onEdited({ ...repo, name: evt.target.value })}
        />
      </FormRow>
      <FormRow text="User/Organization:">
        <Input
          placeholder="GitHub repository user/organization"
          value={repo.userName}
          onChange={(evt) => onEdited({ ...repo, userName: evt.target.value })}
        />
      </FormRow>
      <FormRow text="Repository:">
        <Input
          placeholder="GitHub repository name"
          value={repo.repoName}
          onChange={(evt) => onEdited({ ...repo, repoName: evt.target.value })}
        />
      </FormRow>
      <FormRow text="Token:">
        <Input.Password
          placeholder="GitHub access token"
          value={repo.token}
          onChange={(evt) => onEdited({ ...repo, token: evt.target.value })}
        />
      </FormRow>
      <FormRow text="Default:">
        <Switch checked={repo.default} onChange={() => onMakeDefault()} />
      </FormRow>
      <FormRow>
        <Row justify="space-between">
          <Col>
            <Button
              type="primary"
              onClick={async () => {
                onEdited({ ...repo, verified: VerificationStatus.inProgress });
                let verified = await octokit.verifyRepo(repo);
                onEdited({
                  ...repo,
                  verified: verified ? VerificationStatus.success : VerificationStatus.failed,
                });
              }}
            >
              Verify Access
            </Button>
          </Col>
          <Col>
            <Button danger onClick={onDelete}>
              Delete
            </Button>
          </Col>
        </Row>
      </FormRow>
    </>
  );
}

// ----------------------------------------------------------------------------
// MultiRepoForm
// ----------------------------------------------------------------------------

type MultiRepoFormProps = {
  repos: Repos;
  setRepos: (repos: Repos) => void;
};

function MultiRepoForm({ repos, setRepos }: MultiRepoFormProps) {
  const addRepo = useCallback(() => {
    let newRepo = createDefaultInitializedRepo(repos.length === 0 ? true : false);
    setRepos([...repos, newRepo]);
  }, [repos, setRepos]);

  /*
  const toggleEnableRepo = (i: number) => {
    let newRepos = [...repos];
    newRepos[i].enabled = !newRepos[i].enabled;
    setRepos(newRepos);
  };
  */

  const deleteRepo = (i: number) => {
    let newRepos = [...repos];
    newRepos.splice(i, 1);
    setRepos(newRepos);
  };

  const updateRepo = (i: number, updatedRepo: Repo) => {
    let newRepos = [...repos];
    newRepos[i] = updatedRepo;
    setRepos(newRepos);
  };

  const makeRepoDefault = (i: number) => {
    let newRepos = [...repos];
    for (let j = 0; j < newRepos.length; ++j) {
      if (j === i) {
        newRepos[j].default = true;
      } else {
        newRepos[j].default = false;
      }
    }
    setRepos(newRepos);
  };

  return (
    <>
      {repos.map((repo, i) => (
        <Row key={repo.key} gutter={[24, 24]}>
          <Col span={24}>
            <Card
              title={Header(repo)}
              size="small"
              hoverable
              //extra={<Switch checked={repo.enabled} onClick={() => toggleEnableRepo(i)}></Switch>}
              extra={<VerificationStatusIcon status={repo.verified} />}
            >
              <RepoForm
                repo={repo}
                onDelete={() => deleteRepo(i)}
                onEdited={(updatedRepo) => updateRepo(i, updatedRepo)}
                onMakeDefault={() => makeRepoDefault(i)}
              />
            </Card>
          </Col>
        </Row>
      ))}
      <Row justify="center">
        <Col>
          <Button type="dashed" size="large" onClick={addRepo}>
            <PlusOutlined /> Add Repository
          </Button>
        </Col>
      </Row>
    </>
  );
}

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

type SettingsProps = {
  repos: Repos;
  setRepos: (repos: Repos) => void;
};

function Settings({ repos, setRepos }: SettingsProps) {
  return (
    <UiRow
      center={
        <>
          <Divider orientation="left">Repositories</Divider>
          <MultiRepoForm repos={repos} setRepos={setRepos} />

          <Divider orientation="left">Browser cache</Divider>
          <Button danger onClick={octokit.clearBrowserCache}>
            Clear all cache data
          </Button>
        </>
      }
    />
  );
}

// ----------------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------------

function VerificationStatusIcon({ status }: { status: VerificationStatus }) {
  if (status === VerificationStatus.unknown) {
    return <CheckCircleTwoTone twoToneColor="#aaaaaa" style={{ fontSize: "24px" }} />;
  } else if (status === VerificationStatus.failed) {
    return <ExclamationCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: "24px" }} />;
  } else if (status === VerificationStatus.success) {
    return <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: "24px" }} />;
  } else {
    return <LoadingOutlined style={{ fontSize: "24px" }} />;
  }
}

export default Settings;

// First take on RepoForm -- still any relevance?

/*
function RepoForm({
  onDelete,
}: {
  onDelete: () => void,
}) {

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };
  const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
  };
  return (
    <Form
      {...layout}
      name="basic"
      initialValues={{ remember: true }}
    >
      <Form.Item
        label="User"
        name="user"
        rules={[{ required: true, message: 'GitHub user name' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Repository"
        name="repository"
        rules={[{ required: true, message: 'GitHub repository name' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Token"
        name="token"
        rules={[{ required: true, message: 'GitHub token' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Row justify="space-between">
          <Col>
            <Button type="primary" htmlType="submit">
              Verify Access
            </Button>
          </Col>
          <Col>
            <Button danger onClick={onDelete}>
              Delete
            </Button>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  )
}
*/
