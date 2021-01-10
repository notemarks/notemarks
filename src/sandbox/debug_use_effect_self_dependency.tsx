import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const Component = () => {
  const [a, setA] = useState(0);

  // This is an infinte update loop:
  /*
  useEffect(() => {
    console.log(`Incrementing a from ${a}`);
    setA(a + 1);
  }, [a]);
  */

  useEffect(() => {
    setA((oldA) => {
      console.log(`Incrementing a from ${oldA}`);
      return oldA + 1;
    });
  }, []);

  return <div>{a}</div>;
};

ReactDOM.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
  document.getElementById("root")
);
