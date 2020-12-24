import React from "react";

import { Typography, Collapse, Button, Form, Input } from "antd";
import { EditOutlined } from "@ant-design/icons";

import styled from "@emotion/styled";

import { NoEntrySelected, ScrollContent } from "../components/HelperComponents";
import { VerticalContainer, UiRow, StretchedUiRow } from "../components/UiRow";
import { DefaultTag } from "../components/ColorTag";

import { Entry, EntryNote, EntryLink } from "../types";

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
// EntryHeader
// ----------------------------------------------------------------------------

type EntryHeaderProps = {
  entry: Entry;
  editForm: React.ReactNode;
};

function EntryHeader({ entry, editForm }: EntryHeaderProps) {
  const noteEntrySpecific = (entry: EntryNote) => (
    <span>
      created on {date_utils.formatDateHuman(entry.content.timeCreated)}, updated on{" "}
      {date_utils.formatDateHuman(entry.content.timeUpdated)}
    </span>
  );

  const linkEntrySpecific = (entry: EntryLink) => {
    if (entry.content.referencedBy.length > 0) {
      return (
        <div>
          Referenced by:
          <ul style={{ paddingLeft: "20px" }}>
            {entry.content.referencedBy.map((entry) => (
              <li>{entry.title}</li>
            ))}
          </ul>
        </div>
      );
    }
  };

  return (
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
                {entry_utils.isNote(entry)
                  ? noteEntrySpecific(entry)
                  : entry_utils.isLink(entry)
                  ? linkEntrySpecific(entry)
                  : null}
              </div>
            </>
          }
          key={0}
        >
          {editForm}
        </Panel>
      </Collapse>
    </div>
  );
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
  } else if (entry_utils.isLink(entry)) {
    return <LinkView entry={entry} onUpdateLinkData={(a, b) => {}} />;
  } else {
    return <NoEntrySelected />;
  }
}

// ----------------------------------------------------------------------------
// NoteView
// ----------------------------------------------------------------------------

const NoteContent = styled.div`
  // width: 100%;

  pre {
    font-family: "Ubuntu mono, monospace";
    padding: 0.5rem 0.7rem;
    font-size: 0.75rem; // 12 px
    margin: 0.4rem 0;
    width: 100%;
  }
  pre > code {
    // width: 100%;
    display: inline-block;
  }

  & :not(pre) > code {
    background-color: whitesmoke;
    color: #ff3860;
    font-size: 0.875em;
    font-weight: normal;
    padding: 0.15em 0.4em 0.15em;
    border: 1px solid #e0e0e0;
  }
`;

type NoteViewProps = {
  entry: EntryNote;
  onUpdateNoteData: (title: string, labels: string[]) => void;
};

function NoteView({ entry, onUpdateNoteData }: NoteViewProps) {
  return (
    <VerticalContainer>
      <UiRow
        center={
          <>
            <EntryHeader
              entry={entry}
              editForm={
                <NoteEditForm
                  initialTitle={entry.title}
                  initialLabels={entry.labels}
                  onUpdateNoteData={onUpdateNoteData}
                />
              }
            />
          </>
        }
      />
      <StretchedUiRow
        center={
          <ScrollContent>
            <NoteContent
              dangerouslySetInnerHTML={{
                __html: entry_utils.isNote(entry) ? entry.content.html : "",
              }}
            />
            <Footer />
          </ScrollContent>
        }
      />
    </VerticalContainer>
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

// ----------------------------------------------------------------------------
// LinkView
// ----------------------------------------------------------------------------

type LinkViewProps = {
  entry: EntryLink;
  onUpdateLinkData: (title: string, labels: string[]) => void;
};

function LinkView({ entry, onUpdateLinkData }: LinkViewProps) {
  return (
    <UiRow
      center={
        <>
          <EntryHeader entry={entry} editForm={null} />
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <Button
              href={entry.content.target}
              target="_blank"
              rel="noreferrer noopener"
              autoFocus
              type="primary"
              size="large"
              style={{
                marginTop: "40px",
                display: "inline-block",
              }}
            >
              <div style={{ marginLeft: "20px", marginRight: "20px" }}>open</div>
            </Button>
          </div>
          <Footer />
        </>
      }
      style={{ height: "100%" }}
    />
  );
}

export default EntryView;
