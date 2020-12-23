import React from "react";

import { Typography, Collapse, Button, Form, Input } from "antd";
import { EditOutlined } from "@ant-design/icons";

import styled from "@emotion/styled";

import { NoEntrySelected } from "../components/HelperComponents";
import { UiRow } from "../components/UiRow";
import { DefaultTag } from "../components/ColorTag";

import { Entry, EntryNote } from "../types";

import * as entry_utils from "../utils/entry_utils";
import * as date_utils from "../utils/date_utils";
import * as label_utils from "../utils/label_utils";

const { Title } = Typography;
const { Panel } = Collapse;

const Footer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`;

// TODO: Move to central place, same as in List?
function renderLabels(labels: string[]) {
  return labels.map((label, i) => <DefaultTag key={label}>{label}</DefaultTag>);
}

// ----------------------------------------------------------------------------
// EntryView
// ----------------------------------------------------------------------------

type EntryViewProps = {
  entry?: Entry;
  onUpdateNoteData: (title: string, labels: string[]) => void;
};

function EntryView({ entry, onUpdateNoteData }: EntryViewProps) {
  if (entry == null) {
    return <NoEntrySelected />;
  } else if (entry_utils.isNote(entry)) {
    return <NoteView entry={entry} onUpdateNoteData={onUpdateNoteData} />;
  } else {
    return <NoEntrySelected />;
  }
}

// ----------------------------------------------------------------------------
// NoteView
// ----------------------------------------------------------------------------

type NoteViewProps = {
  entry: EntryNote;
  onUpdateNoteData: (title: string, labels: string[]) => void;
};

function NoteView({ entry, onUpdateNoteData }: NoteViewProps) {
  return (
    <UiRow
      center={
        <>
          <div
            style={{
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <Collapse
              defaultActiveKey={[]}
              expandIconPosition="right"
              expandIcon={() => <Button shape="circle" icon={<EditOutlined />} />}
              style={{
                background: "#f6fbfe",
                //borderColor: "#209cee",
                borderRadius: "4px",
              }}
            >
              <Panel
                header={
                  <>
                    <Title level={3}>{entry.title}</Title>
                    <div>{renderLabels(entry.labels)}</div>
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "9px",
                      }}
                    >
                      created on {date_utils.formatDateHuman(entry.content.timeCreated)}, updated on{" "}
                      {date_utils.formatDateHuman(entry.content.timeUpdated)}
                    </div>
                  </>
                }
                key={0}
              >
                <NoteEditForm
                  initialTitle={entry.title}
                  initialLabels={entry.labels}
                  onUpdateNoteData={onUpdateNoteData}
                />
              </Panel>
            </Collapse>
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: entry_utils.isNote(entry) ? entry.content.html : "",
            }}
          />
          <Footer />
        </>
      }
      style={{ height: "100%" }}
    />
  );
}

// ----------------------------------------------------------------------------
// NoteEditForm
// ----------------------------------------------------------------------------

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};
const tailLayout = {
  wrapperCol: { offset: 4, span: 20 },
};

type NoteEditFormProps = {
  initialTitle: string;
  initialLabels: string[];
  onUpdateNoteData: (title: string, labels: string[]) => void;
};

const NoteEditForm = ({ initialTitle, initialLabels, onUpdateNoteData }: NoteEditFormProps) => {
  const onFinish = (values: { title: string; labels: string }) => {
    onUpdateNoteData(values.title, label_utils.extractLabelsFromString(values.labels));
  };

  return (
    <Form
      {...layout}
      name="basic"
      initialValues={{ title: initialTitle, labels: initialLabels.join(" ") }}
      onFinish={onFinish}
    >
      <Form.Item
        label="Title"
        name="title"
        rules={[{ required: true, message: "Note requires a title" }]}
        style={{ marginBottom: "16px" }}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Labels" name="labels" style={{ marginBottom: "16px" }}>
        <Input />
      </Form.Item>

      <Form.Item {...tailLayout} style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default EntryView;
