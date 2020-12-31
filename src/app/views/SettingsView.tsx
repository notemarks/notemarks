import React, { useCallback } from "react";

import { Button, Input, InputNumber, Select, Switch, Row, Col, Card, Divider, Space } from "antd";
import { RowProps } from "antd/lib/row";

import {
  PlusOutlined,
  GithubOutlined,
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
  QuestionCircleTwoTone,
  LoadingOutlined,
} from "@ant-design/icons";

import styled from "@emotion/styled";

import { UiRow } from "../components/UiRow";

import {
  Settings,
  SettingsAction,
  clearAllStorage,
  AuthSettings,
  EditorSettings,
} from "../settings";

import { Repo, Repos, VerificationStatus, createDefaultInitializedRepo } from "../repo";
import * as octokit from "../octokit";

const { Option } = Select;

// ----------------------------------------------------------------------------
// Repo Card Header
// ----------------------------------------------------------------------------

const StyledRepoTitle = styled.span`
  font-size: 16px;
`;

function Header(repo: Repo) {
  return (
    <Space>
      <Row wrap={false} align="middle" gutter={8}>
        <Col flex="auto">
          <GithubOutlined style={{ fontSize: "24px", color: "#666" }} />
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

function FormRow({ text, children }: { text?: string; children?: React.ReactNode }) {
  return (
    <Row {...fromRowProps}>
      {text != null ? <Col>{text}</Col> : null}
      <Col span={20}>{children}</Col>
    </Row>
  );
}

function RepoForm({
  repo,
  auth,
  onDelete,
  onEdited,
  onMakeDefault,
}: {
  repo: Repo;
  auth: AuthSettings;
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
          value={repo.userOrOrgName}
          onChange={(evt) => onEdited({ ...repo, userOrOrgName: evt.target.value })}
        />
      </FormRow>
      <FormRow text="Repository:">
        <Input
          placeholder="GitHub repository name"
          value={repo.repoName}
          onChange={(evt) => onEdited({ ...repo, repoName: evt.target.value })}
        />
      </FormRow>
      <FormRow text="Enabled:">
        <Switch
          checked={repo.enabled}
          onChange={(value) => onEdited({ ...repo, enabled: value })}
        />
      </FormRow>
      <FormRow text="Default:">
        <Switch checked={repo.default} onChange={onMakeDefault} />
      </FormRow>
      <FormRow>
        <Row justify="space-between">
          <Col>
            <Button
              type="primary"
              onClick={async () => {
                onEdited({ ...repo, verified: VerificationStatus.inProgress });
                let verified = await octokit.verifyRepo(repo, auth);
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
  auth: AuthSettings;
  repos: Repos;
  setRepos: (repos: Repos) => void;
};

function MultiRepoForm({ auth, repos, setRepos }: MultiRepoFormProps) {
  const addRepo = useCallback(() => {
    let newRepo = createDefaultInitializedRepo(repos.length === 0 ? true : false);
    setRepos([...repos, newRepo]);
  }, [repos, setRepos]);

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
    // Note that we deliberately only handle "make repo default" case,
    // and don't care about the negation "make repo not the default".
    // This makes sense, because we don't want to end up with no default
    // anyway. The only allowed change is to make another repo the default.
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
              extra={<VerificationStatusIcon status={repo.verified} />}
            >
              <RepoForm
                repo={repo}
                auth={auth}
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
// AuthSettings
// ----------------------------------------------------------------------------

function AuthForm({
  settings,
  setSettings,
}: {
  settings: AuthSettings;
  setSettings: (settings: AuthSettings) => void;
}) {
  return (
    <>
      <FormRow text="GitHub access token:">
        <Input.Password
          placeholder="GitHub access token"
          defaultValue={settings.tokenGitHub}
          onChange={(evt) => setSettings({ ...settings, tokenGitHub: evt.target.value })}
        />
      </FormRow>
    </>
  );
}

// ----------------------------------------------------------------------------
// EditorSettings
// ----------------------------------------------------------------------------

function EditorForm({
  settings,
  setSettings,
}: {
  settings: EditorSettings;
  setSettings: (settings: EditorSettings) => void;
}) {
  return (
    <>
      <FormRow text="Font size:">
        <InputNumber
          placeholder="Font size"
          defaultValue={settings.fontSize}
          onChange={(value) => {
            if (typeof value === "number") {
              setSettings({ ...settings, fontSize: value });
            }
          }}
          style={{ width: "100%" }}
        />
      </FormRow>
      <FormRow text="Theme:">
        <Select
          defaultValue={settings.theme}
          onChange={(value) => setSettings({ ...settings, theme: value })}
          style={{ width: "100%" }}
        >
          <Option value="dark">dark</Option>
          <Option value="light">light</Option>
        </Select>
      </FormRow>
      <FormRow text="Word wrap">
        <Select
          defaultValue={settings.wordWrap}
          onChange={(value) => setSettings({ ...settings, wordWrap: value })}
          style={{ width: "100%" }}
        >
          <Option value="bounded">on (wrap on both viewport and word wrap column)</Option>
          <Option value="wordWrapColumn">on (wrap on word wrap column)</Option>
          <Option value="on">on (wrap on viewport)</Option>
          <Option value="off">off</Option>
        </Select>
      </FormRow>
      <FormRow text="Word wrap column:">
        <InputNumber
          placeholder="Word wrap column"
          defaultValue={settings.wordWrapColumn}
          onChange={(value) => {
            if (typeof value === "number") {
              setSettings({ ...settings, wordWrapColumn: value });
            }
          }}
          style={{ width: "100%" }}
        />
      </FormRow>
    </>
  );
}

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

type SettingsProps = {
  settings: Settings;
  dispatch: (action: SettingsAction) => void;
};

function SettingsView({ settings, dispatch }: SettingsProps) {
  return (
    <UiRow
      center={
        <>
          <Divider orientation="left">Repositories</Divider>
          <MultiRepoForm
            auth={settings.auth}
            repos={settings.repos}
            setRepos={(repos) => dispatch({ repos: repos })}
          />

          <Divider orientation="left">Authentication</Divider>
          <AuthForm
            settings={settings.auth}
            setSettings={(authSettings) => dispatch({ auth: authSettings })}
          />

          <Divider orientation="left">Editor Settings</Divider>
          <EditorForm
            settings={settings.editor}
            setSettings={(editorSettings) => dispatch({ editor: editorSettings })}
          />

          <Divider orientation="left">Browser cache</Divider>
          <FormRow>
            <Button danger onClick={clearAllStorage}>
              Clear all cache data
            </Button>
          </FormRow>
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
    return <QuestionCircleTwoTone twoToneColor="#e6e6e6" style={{ fontSize: "24px" }} />;
  } else if (status === VerificationStatus.failed) {
    return <ExclamationCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: "24px" }} />;
  } else if (status === VerificationStatus.success) {
    return <CheckCircleTwoTone twoToneColor="#2be262" style={{ fontSize: "24px" }} />;
  } else {
    return <LoadingOutlined style={{ fontSize: "24px" }} />;
  }
}

export default SettingsView;

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
