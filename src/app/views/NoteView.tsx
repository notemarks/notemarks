import React from "react";

import { Typography } from "antd";

import styled from "@emotion/styled";

import { NoEntrySelected } from "../components/HelperComponents";
import { UiRow } from "../components/UiRow";

import * as markdown_utils from "../utils/markdown_utils";

import { Entry } from "../types";

/*
// ----------------------------------------------------------------------------
// Notes:
// ----------------------------------------------------------------------------

Setting the innerHTML from the converted markdown is an XSS vulnerability.
There are two possibilities:
1. Convert the HTML to pure React VDOM nodes. This is what
   https://github.com/aknuds1/html-to-react does.
   This may have downsides in terms of performance due to overhead?
2. Use a sanitizer on the HTML before setting.
   DOMPurify seems to be a popular solution.

References:
- https://stackoverflow.com/a/56394170/1804173
- https://github.com/cure53/DOMPurify
*/

const { Title } = Typography;

const StyledTitle = styled(Title)`
  margin-top: 20px;
`;

const Footer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`;

type NoteViewProps = {
  entry?: Entry;
};

function NoteView({ entry }: NoteViewProps) {
  const renderEntry = (entry: Entry) => {
    return (
      <>
        <StyledTitle>{entry.title}</StyledTitle>
        <div
          dangerouslySetInnerHTML={{
            __html: markdown_utils.convertMarkdown(entry.content || ""),
          }}
        />
        <Footer />
      </>
    );
  };

  return (
    <UiRow
      center={entry != null ? renderEntry(entry) : <NoEntrySelected />}
      style={{ height: "100%" }}
    />
  );
}

export default NoteView;
