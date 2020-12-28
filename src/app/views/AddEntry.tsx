import React, { useState } from "react";

import { Card, Input, Button, Form, Tabs } from "antd";

// import styled from "@emotion/styled";

import { UiRow } from "../components/UiRow";
import { RepoSelect } from "../components/RepoSelect";

import { EntryKind } from "../types";
import { Repo } from "../repo";

import * as label_utils from "../utils/label_utils";
import * as web_utils from "../utils/web_utils";

const { TabPane } = Tabs;

const formLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};
const fromTailLayout = {
  wrapperCol: { offset: 4, span: 20 },
};

type OnAddedCallBack = (args: {
  entryKind: EntryKind;
  repo: Repo;
  title: string;
  labels: string[];
  content: string;
  location?: string;
  extension?: string;
}) => void;

type AddEntryProps = {
  onAdded: OnAddedCallBack;
  repos: Repo[];
};

function AddEntry({ onAdded, repos }: AddEntryProps) {
  return (
    <UiRow
      center={
        <Card
          // TODO: Sync with style used in EntryHeader?
          style={{
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          <Tabs defaultActiveKey="1">
            <TabPane tab="Note" key="note">
              <CreateNoteForm onAdded={onAdded} repos={repos} />
            </TabPane>
            <TabPane tab="Document" key="doc">
              <CreateDocumentForm onAdded={onAdded} repos={repos} />
            </TabPane>
            <TabPane tab="Bookmark" key="link">
              <CreateLinkForm onAdded={onAdded} repos={repos} />
            </TabPane>
          </Tabs>
        </Card>
      }
    />
  );
}

function CreateNoteForm({ repos, onAdded }: AddEntryProps) {
  const [form] = Form.useForm();

  const onFinish = ({
    title,
    labels,
    repo,
    location,
  }: {
    title: string;
    labels: string;
    repo: Repo;
    location: string;
  }) => {
    onAdded({
      entryKind: EntryKind.NoteMarkdown,
      repo: repo,
      title: title,
      labels: label_utils.extractLabelsFromString(labels),
      location: location,
      content: "",
    });
  };

  return (
    <Form {...formLayout} name="basic" form={form} onFinish={onFinish}>
      <Form.Item label="Repository" name="repo">
        <RepoSelect repos={repos} onChange={(repo) => form.setFieldsValue({ repo: repo })} />
      </Form.Item>

      <Form.Item label="Title" name="title">
        <Input placeholder="Note title" />
      </Form.Item>

      <Form.Item label="Labels" name="labels">
        <Input placeholder="Labels" />
      </Form.Item>

      <Form.Item label="Folder path" name="location">
        <Input placeholder="Folder path" />
      </Form.Item>

      <Form.Item {...fromTailLayout} style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit">
          Create
        </Button>
      </Form.Item>
    </Form>
  );
}

function CreateLinkForm({ repos, onAdded }: AddEntryProps) {
  const [form] = Form.useForm();

  const onFinish = ({
    title,
    labels,
    url,
    repo,
  }: {
    title: string;
    labels: string;
    url: string;
    repo: Repo;
  }) => {
    onAdded({
      entryKind: EntryKind.Link,
      repo: repo,
      title: title,
      labels: label_utils.extractLabelsFromString(labels),
      content: url,
    });
  };

  return (
    <Form {...formLayout} name="basic" form={form} onFinish={onFinish}>
      <Form.Item label="Repository" name="repo">
        <RepoSelect repos={repos} onChange={(repo) => form.setFieldsValue({ repo: repo })} />
      </Form.Item>

      <Form.Item label="Title" name="title">
        <Input placeholder="Bookmark title" />
      </Form.Item>

      <Form.Item label="Labels" name="labels">
        <Input placeholder="Labels" />
      </Form.Item>

      <Form.Item label="Folder path" name="location">
        <Input placeholder="Folder path" />
      </Form.Item>

      <Form.Item label="Bookmark URL" name="url">
        <Input placeholder="Bookmark target URL" />
      </Form.Item>

      <Form.Item {...fromTailLayout} style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit">
          Create
        </Button>
      </Form.Item>
    </Form>
  );
}

function CreateDocumentForm({ repos, onAdded }: AddEntryProps) {
  const [form] = Form.useForm();

  const onFinish = async ({
    title,
    labels,
    url,
    repo,
    location,
  }: {
    title: string;
    labels: string;
    url: string;
    repo: Repo;
    location: string;
  }) => {
    // TODO implement download statefully...
    let content = await web_utils.fetchBodyProxied(url);
    onAdded({
      entryKind: EntryKind.NoteMarkdown,
      repo: repo,
      title: title,
      labels: label_utils.extractLabelsFromString(labels),
      content: content,
      location: location,
    });
  };

  return (
    <Form {...formLayout} name="basic" form={form} onFinish={onFinish}>
      <Form.Item label="Repository" name="repo">
        <RepoSelect repos={repos} onChange={(repo) => form.setFieldsValue({ repo: repo })} />
      </Form.Item>

      <Form.Item label="Title" name="title">
        <Input placeholder="Document title" />
      </Form.Item>

      <Form.Item label="Labels" name="labels">
        <Input placeholder="Labels" />
      </Form.Item>

      <Form.Item label="Data URL" name="url">
        <Input placeholder="URL from which to download document" />
      </Form.Item>

      <Form.Item {...fromTailLayout} style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit">
          Download & Create
        </Button>
      </Form.Item>
    </Form>
  );
}

// Variant with single form and radio button. Is this better?
/*
function AddEntry({ onAdded }: AddEntryProps) {
  const [form] = Form.useForm();
  const [entryKind, setEntryKind] = useState("note");

  const handleFormValuesChange = (changedValues: any) => {
    const fieldName = Object.keys(changedValues)[0];

    if (fieldName === "entryKind") {
      const value = changedValues[fieldName];
      setEntryKind(value);
    }
  };

  return (
    <UiRow
      center={
        <Card
          // TODO: Sync with style used in EntryHeader?
          style={{
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          <Form {...formLayout} name="basic" form={form} onValuesChange={handleFormValuesChange}>
            <Form.Item label="Entry type" name="entryKind" initialValue={entryKind}>
              <Radio.Group>
                <Radio value="note">Note</Radio>
                <Radio value="docu">Document</Radio>
                <Radio value="link">Link</Radio>
              </Radio.Group>
            </Form.Item>

            {entryKind === "note" && (
              <Form.Item label="Title" name="title">
                <Input />
              </Form.Item>
            )}

            <Form.Item {...fromTailLayout} style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
            </Form.Item>
          </Form>
        </Card>
      }
    />
  );
}
*/

export default AddEntry;
