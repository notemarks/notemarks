import React from "react";

import showdown from "showdown";
import DOMPurify from "dompurify";

import { Typography, Row, Col } from "antd";

import styled from "@emotion/styled";

import { SizeProps } from "./types_view";
import { NoEntrySelected } from "./HelperComponents";

import { Entry } from "./types";

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
  sizeProps: SizeProps;
  entry?: Entry;
};

function convertMarkdown(markdown: string): string {
  // https://github.com/showdownjs/showdown#valid-options
  const converter = new showdown.Converter({
    ghCodeBlocks: true,
    //extensions: ["highlightjs"],
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    openLinksInNewWindow: true,
  });

  // Apparently 'github' flavor leads to treating every line break as a visible
  // line break in the output, which is not necessarily desired if line breaks
  // are placed in the markdown source mainly for making the source look nice,
  // but a full paragraph is desired in the output. Disable for now.
  // converter.setFlavor('github');

  let htmlRaw = converter.makeHtml(markdown);
  let htmlSanitized = DOMPurify.sanitize(htmlRaw, {
    // To allow opening links in new window: https://github.com/cure53/DOMPurify/issues/317
    ADD_ATTR: ["target"],
  });

  return htmlSanitized;
}

function NoteView({ sizeProps, entry }: NoteViewProps) {
  const renderEntry = (entry: Entry) => {
    return (
      <>
        <StyledTitle>{entry.title}</StyledTitle>
        <div
          dangerouslySetInnerHTML={{
            __html: convertMarkdown(entry.content || ""),
          }}
        />
        <Footer />
      </>
    );
  };

  return (
    <Row justify="center" style={{ height: "100%" }}>
      <Col {...sizeProps.l} />
      <Col {...sizeProps.c}>{entry != null ? renderEntry(entry) : <NoEntrySelected />}</Col>
      <Col {...sizeProps.r} />
    </Row>
  );
}

export default NoteView;
