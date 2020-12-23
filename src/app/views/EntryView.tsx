import React from "react";

import { Typography } from "antd";

import styled from "@emotion/styled";

import { NoEntrySelected } from "../components/HelperComponents";
import { UiRow } from "../components/UiRow";

import { Entry, EntryNote } from "../types";

import * as entry_utils from "../utils/entry_utils";

const { Title } = Typography;

const StyledTitle = styled(Title)`
  margin-top: 20px;
`;

const Footer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`;

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
          <StyledTitle>{entry.title}</StyledTitle>
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
