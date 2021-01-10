import React from "react";
import ReactDOM from "react-dom";

import { Tag, Tree } from "antd";

import "./index.css";

const TreeComponent = () => {
  const treeData = [
    {
      title: "foo",
      key: "foo",
    },
    {
      title: "bar",
      key: "bar",
    },
    {
      title: "baz",
      key: "baz",
      children: [
        {
          title: "nested-foo",
          key: "nested-foo",
        },
        {
          title: "nested-bar",
          key: "nested-bar",
        },
      ],
    },
  ];
  return (
    <Tree treeData={treeData} selectable={false} titleRender={(data) => <Tag>{data.title}</Tag>} />
  );
};

ReactDOM.render(
  <React.StrictMode>
    <TreeComponent />
  </React.StrictMode>,
  document.getElementById("root")
);
