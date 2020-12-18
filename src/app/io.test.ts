import * as io from "./io";

test("parseStoredLink", () => {
  expect(io.parseStoredLink("[").isErr()).toEqual(true);
  expect(io.parseStoredLink("[")._unsafeUnwrapErr()).toEqual(
    expect.objectContaining({
      name: "YAMLException",
    })
  );

  expect(io.parseStoredLink("").isOk()).toEqual(true);
  expect(io.parseStoredLink("")._unsafeUnwrap()).toEqual([]);

  expect(io.parseStoredLink("foo").isErr()).toEqual(true);
  expect(io.parseStoredLink("[]").isErr()).toEqual(true);
  expect(io.parseStoredLink("{}").isErr()).toEqual(true); // due to missing links field

  expect(io.parseStoredLink("{links: []}").isOk()).toEqual(true);
  expect(io.parseStoredLink("{links: []}")._unsafeUnwrap()).toEqual([]);
});
