// debug_use_state_update_behavior
import React, { useState } from "react";
import ReactDOM from "react-dom";

const Component = () => {
  const [foo, setFoo] = useState(0);
  const [bar, setBar] = useState(0);

  console.log(`Rerender with foo = ${foo} bar = ${bar}`);

  return (
    <div>
      <button
        onClick={() => {
          console.log("foo:", foo);
          setFoo(foo + 1);
          console.log("foo:", foo);
          console.log("bar:", bar);
          setBar(bar + 1);
          console.log("bar:", bar);
        }}
      >
        sync
      </button>
      <button
        onClick={() => {
          setTimeout(() => {
            console.log("foo:", foo);
            setFoo(foo + 1);
            console.log("foo:", foo);
            console.log("bar:", bar);
            setBar(bar + 1);
            console.log("bar:", bar);
          }, 0);
        }}
      >
        async
      </button>
      <div>{foo}</div>
      <div>{bar}</div>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
  document.getElementById("root")
);
