import React, { useEffect, useRef } from "react";

// The problem with forwardRef in TypeScript is that using a normal React.Ref<T> as
// the second argument makes its RefObject immutable, i.e., ref.current cannot be
// be written to. The correct way is to infer the type directly from the
// ForwardRefRenderFunction type itself (the [1] pulls its second arg type).
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065
// https://stackoverflow.com/questions/51851677/how-to-get-argument-types-from-function-in-typescript
export type MutableRef<T> = Parameters<React.ForwardRefRenderFunction<T, unknown>>[1];

export function useTraceUpdate(props: { [k: string]: any }) {
  const prev = useRef(props);
  useEffect(() => {
    const changes = Object.entries(props).reduce((changes: { [k: string]: [any, any] }, [k, v]) => {
      if (prev.current[k] !== v) {
        changes[k] = [prev.current[k], v];
      }
      return changes;
    }, {});
    if (Object.keys(changes).length > 0) {
      console.log("Changed props:", changes);
    }
    prev.current = props;
  });
}

export function useEffectOnce(func: () => void) {
  // https://stackoverflow.com/a/56767883/1804173
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(func, []);
}
