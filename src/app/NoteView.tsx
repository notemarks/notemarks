import React from 'react';

import showdown from "showdown";
import DOMPurify from 'dompurify';

import { Typography } from 'antd';

import styled from '@emotion/styled'

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
`

const Footer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`

type NoteViewProps = {
  entry?: Entry,
}


function convertMarkdown(markdown: string): string {
  // https://github.com/showdownjs/showdown#valid-options
  const converter = new showdown.Converter({
    ghCodeBlocks: true,
    //extensions: ["highlightjs"],
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
  })

  // Apparently 'github' flavor leads to treating every line break as a visible
  // line break in the output, which is not necessarily desired if line breaks
  // are placed in the markdown source mainly for making the source look nice,
  // but a full paragraph is desired in the output. Disable for now.
  // converter.setFlavor('github');

  let htmlRaw = converter.makeHtml(markdown);
  let htmlSanitized = DOMPurify.sanitize(htmlRaw);

  return htmlSanitized;
}

function NoteView({ entry }: NoteViewProps) {

  if (entry == null) {
    return (
      <div>
        Nothing
      </div>
    )
  } else {
    return (
      <>
        <StyledTitle>{entry.title}</StyledTitle>
        <div dangerouslySetInnerHTML={{
          __html: convertMarkdown(entry.content || "")
        }}/>
        <Footer/>
      </>
    );
  }
}


export default NoteView;
