import React from 'react';
import { useCallback } from "react";

import { Button } from 'antd';
import { Typography } from 'antd';
import { Space, Input, Row, Col, Switch, Card } from 'antd';
import { RowProps } from 'antd/lib/row';

import { PlusOutlined, GithubOutlined, CheckCircleTwoTone, ExclamationCircleTwoTone, LoadingOutlined } from '@ant-design/icons';

import styled from '@emotion/styled'

import { SizeProps } from "./types_view";
import { Repo, Repos, VerificationStatus, createDefaultInitializedRepo } from "./repo"
import * as octokit from "./octokit"


const { Title } = Typography;

const StyledTitle = styled(Title)`
  margin-top: 20px;
`

const StyledRepoTitle = styled.span`
  font-size: 16px;
`

// ----------------------------------------------------------------------------
// Header
// ----------------------------------------------------------------------------

function Header(repo: Repo) {
  return (
    <Space>
      <Row wrap={false} align="middle" gutter={8}>
        <Col flex="auto">
          <GithubOutlined style={{ fontSize: '32px', color: '#666' }}/>
        </Col>
        <Col flex="auto">
          <StyledRepoTitle>{repo.name}</StyledRepoTitle>
        </Col>
      </Row>
    </Space>
  )
}

// ----------------------------------------------------------------------------
// Repo form
// ----------------------------------------------------------------------------

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
function RepoForm({
  repo,
  onDelete,
  onEdited,
  onMakeDefault,
}: {
  repo: Repo,
  onDelete: () => void,
  onEdited: (repo: Repo) => void,
  onMakeDefault: () => void,
}) {

  const rowProps: RowProps = {justify: "end", align: "middle" as "middle", gutter: [8, 16]}

  return (
    <>
      <Row {...rowProps}>
        <Col>Name:</Col>
        <Col span={16}>
          <Input
            placeholder="Name within Notemarks"
            value={repo.name}
            onChange={evt => onEdited({...repo, name: evt.target.value})}
          />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col>User:</Col>
        <Col span={16}>
          <Input
            placeholder="GitHub user name"
            value={repo.userName}
            onChange={evt => onEdited({...repo, userName: evt.target.value})}
          />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col>Repository:</Col>
        <Col span={16}>
          <Input
            placeholder="GitHub repository name"
            value={repo.repoName}
            onChange={evt => onEdited({...repo, repoName: evt.target.value})}
          />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col>Token:</Col>
        <Col span={16}>
          <Input.Password
            placeholder="GitHub access token"
            value={repo.token}
            onChange={evt => onEdited({...repo, token: evt.target.value})}
          />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col>Default:</Col>
        <Col span={16}>
          <Switch
            checked={repo.default}
            onChange={() => onMakeDefault()}
          />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col span={16}>
          <Row justify="space-between">
            <Col>
              <Button
                type="primary"
                onClick={async () => {
                  onEdited({...repo, verified: VerificationStatus.inProgress});
                  let verified = await octokit.verifyRepo(repo);
                  onEdited({...repo, verified: (verified ? VerificationStatus.success : VerificationStatus.failed)});
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
        </Col>
      </Row>
    </>
  )
}


// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

type SettingsProps = {
  sizeProps: SizeProps,
  repos: Repos,
  setRepos: (repos: Repos) => void,
}

function Settings({ sizeProps, repos, setRepos }: SettingsProps) {

  const addRepo = useCallback(() => {
    let newRepo = createDefaultInitializedRepo(repos.length === 0 ? true : false)
    setRepos([...repos, newRepo])
  }, [repos, setRepos]);

  const toggleEnableRepo = (i: number) => {
    let newRepos = [...repos];
    newRepos[i].enabled = !newRepos[i].enabled;
    setRepos(newRepos);
  }

  const deleteRepo = (i: number) => {
    let newRepos = [...repos];
    newRepos.splice(i, 1);
    setRepos(newRepos);
  }

  const updateRepo = (i: number, updatedRepo: Repo) => {
    let newRepos = [...repos];
    newRepos[i] = updatedRepo;
    setRepos(newRepos);
  }

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
  }

  const onClearBrowserCache = () => {
    octokit.clearBrowserCache();
  }

  return (
    <Row justify="center" style={{height: "100%"}}>
      <Col {...sizeProps.l}/>
      <Col {...sizeProps.c}>
        <StyledTitle level={4}>Repositories</StyledTitle>
        {/*<Collapse defaultActiveKey={[0]} onChange={callback} bordered={true}>*/}
        {repos.map((repo, i) =>
          <Row key={repo.id} gutter={[24, 24]}>
            <Col span={24}>
              <Card
                title={Header(repo)}
                size="small"
                hoverable
                //extra={<Switch checked={repo.enabled} onClick={() => toggleEnableRepo(i)}></Switch>}
                extra={<VerificationStatusIcon status={repo.verified}/>}
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
        )}
        {/*
        <SpacedRow>
          <Button type="primary" shape="circle" size="large" icon={<PlusOutlined />} onClick={this.addRepo}/>
        </SpacedRow>
        */}
        <Row justify="center">
          <Col>
            <Button type="dashed" size="large" onClick={addRepo}>
              <PlusOutlined /> Add Repository
            </Button>
          </Col>
        </Row>
        <StyledTitle level={4}>Browser cache</StyledTitle>
        <Button danger onClick={onClearBrowserCache}>
          Clear all cache data
        </Button>
      </Col>
      <Col {...sizeProps.r}/>
    </Row>
  );
}

// ----------------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------------

function VerificationStatusIcon({
  status
}: {
  status: VerificationStatus
}) {
  if (status === VerificationStatus.unknown) {
    return <CheckCircleTwoTone twoToneColor="#aaaaaa" style={{ fontSize: '24px'}}/>
  } else if (status === VerificationStatus.failed) {
    return <ExclamationCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: '24px'}}/>
  } else if (status === VerificationStatus.success) {
    return <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '24px'}}/>
  } else {
    return <LoadingOutlined style={{ fontSize: '24px'}}/>
  }
}

export default Settings;

