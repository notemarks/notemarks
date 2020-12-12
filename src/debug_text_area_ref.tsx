import React, { useRef } from "react";
import ReactDOM from "react-dom";

import { Input } from "antd";
import { TextAreaRef } from "antd/lib/input/TextArea";
const { TextArea } = Input;

const Component = () => {
  const textAreaRef1 = useRef<HTMLTextAreaElement>(null);
  const textAreaRef2 = useRef<TextAreaRef>(null);

  const onClick = () => {
    console.log(textAreaRef1.current);
    console.log(textAreaRef1.current?.value);
    console.log(textAreaRef2.current);
    console.log(textAreaRef2.current?.value);
  };

  return (
    <div>
      <div>
        <textarea ref={textAreaRef1} />
      </div>
      <div>
        <TextArea ref={textAreaRef2} defaultValue="defaultValue" />
      </div>
      <div>
        <button onClick={onClick}>Click me</button>
      </div>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
  document.getElementById("root")
);
