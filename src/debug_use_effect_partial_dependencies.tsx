import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const Component = () => {
  const [state, setState] = useState({
    foo: 0,
    bar: 0,
  });

  useEffect(() => {
    console.log(`foo has changed to ${state.foo}`);
  }, [state.foo]);

  useEffect(() => {
    console.log(`bar has changed to ${state.bar}`);
  }, [state.bar]);

  useEffect(() => {
    console.log(`Effect both: foo or bar changed ${state.foo} / ${state.bar}`);
  }, [state]);

  return (
    <div>
      <button onClick={() => setState((state) => ({ ...state, foo: state.foo + 1 }))}>foo</button>
      <button onClick={() => setState((state) => ({ ...state, bar: state.bar + 1 }))}>bar</button>
      <div>{state.foo}</div>
      <div>{state.bar}</div>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
  document.getElementById("root")
);
