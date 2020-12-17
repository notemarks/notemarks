/* eslint-disable jest/no-conditional-expect */
import * as markdown_utils from "./markdown_utils";

const MARKDOWN_1 = `
This is [link 1](http://link-a.com).
This is [link 2](https://link-b.com).
This is [link 3](link-c.com).
`;

test("extractLinks", () => {
  let html = markdown_utils.convertMarkdown(MARKDOWN_1);
  let links = markdown_utils.extractLinks(html);
  expect(links).toEqual(["http://link-a.com", "https://link-b.com", "link-c.com"]);
});
