import React from "react";

import { Typography, Collapse, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

import styled from "@emotion/styled";

import { NoEntrySelected } from "../components/HelperComponents";
import { UiRow } from "../components/UiRow";
import { DefaultTag } from "../components/ColorTag";

import { Entry, EntryNote } from "../types";

import * as entry_utils from "../utils/entry_utils";
import * as date_utils from "../utils/date_utils";

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
};

function EntryView({ entry }: EntryViewProps) {
  if (entry == null) {
    return <NoEntrySelected />;
  } else if (entry_utils.isNote(entry)) {
    return <NoteView entry={entry} />;
  } else {
    return <NoEntrySelected />;
  }
}

// ----------------------------------------------------------------------------
// NoteView
// ----------------------------------------------------------------------------

type NoteViewProps = {
  entry: EntryNote;
};

function NoteView({ entry }: NoteViewProps) {
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
              ></Panel>
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

export default EntryView;
