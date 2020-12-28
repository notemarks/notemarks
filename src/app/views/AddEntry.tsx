import React, { useState } from "react";

import { Card, Input, Button, Form, Tabs } from "antd";

// import styled from "@emotion/styled";

import { UiRow } from "../components/UiRow";

const { TabPane } = Tabs;

type AddEntryProps = {
  onAdded: () => void;
};

const formLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};
const fromTailLayout = {
  wrapperCol: { offset: 4, span: 20 },
};

function AddEntry({ onAdded }: AddEntryProps) {
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
              {CreateNoteForm()}
            </TabPane>
            <TabPane tab="Document" key="doc">
              {CreateDocumentForm()}
            </TabPane>
            <TabPane tab="Bookmark" key="link">
              {CreateLinkForm()}
            </TabPane>
          </Tabs>
        </Card>
      }
    />
  );
}

function CreateNoteForm() {
  const [form] = Form.useForm();

  return (
    <Form {...formLayout} name="basic" form={form}>
      <Form.Item label="Title" name="title">
        <Input placeholder="Note title" />
      </Form.Item>

      <Form.Item label="Labels" name="label">
        <Input placeholder="Labels" />
      </Form.Item>

      <Form.Item {...fromTailLayout} style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit">
          Create
        </Button>
      </Form.Item>
    </Form>
  );
}

function CreateLinkForm() {
  const [form] = Form.useForm();

  return (
    <Form {...formLayout} name="basic" form={form}>
      <Form.Item label="Title" name="title">
        <Input placeholder="Bookmark title" />
      </Form.Item>

      <Form.Item label="Labels" name="label">
        <Input placeholder="Labels" />
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

function CreateDocumentForm() {
  const [form] = Form.useForm();

  return (
    <Form {...formLayout} name="basic" form={form}>
      <Form.Item label="Title" name="title">
        <Input placeholder="Document title" />
      </Form.Item>

      <Form.Item label="Labels" name="label">
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
