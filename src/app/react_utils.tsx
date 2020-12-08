// The problem with forwardRef in TypeScript is that using a normal React.Ref<T> as
// the second argument makes its RefObject immutable, i.e., ref.current cannot be
// be written to. The correct way is to infer the type directly from the
// ForwardRefRenderFunction type itself (the [1] pulls its second arg type).
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065
// https://stackoverflow.com/questions/51851677/how-to-get-argument-types-from-function-in-typescript
export type MutableRef<T> = Parameters<React.ForwardRefRenderFunction<T, unknown>>[1];
