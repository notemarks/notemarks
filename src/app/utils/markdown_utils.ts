import showdown from "showdown";
import DOMPurify from "dompurify";

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

export function convertMarkdown(markdown: string): string {
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

export function extractLinks(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const htmlLinks = doc.querySelectorAll("a");

  const links = [] as string[];

  htmlLinks.forEach((htmlLink) => {
    let href = htmlLink.getAttribute("href");
    if (href != null) {
      links.push(href);
    }
  });

  return links;
}

export function processMarkdownText(text: string): [string, string[]] {
  let html = convertMarkdown(text);
  let links = extractLinks(html);
  return [html, links];
}
