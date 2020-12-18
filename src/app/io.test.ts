import * as io from "./io";

test("parseStoredLinks", () => {
  expect(io.parseStoredLinks("[").isErr()).toEqual(true);
  expect(io.parseStoredLinks("[")._unsafeUnwrapErr()).toEqual(
    expect.objectContaining({
      name: "YAMLException",
    })
  );

  expect(io.parseStoredLinks("").isOk()).toEqual(true);
  expect(io.parseStoredLinks("")._unsafeUnwrap()).toEqual([]);

  expect(io.parseStoredLinks("foo").isErr()).toEqual(true);
  expect(io.parseStoredLinks("[]").isErr()).toEqual(true);
  expect(io.parseStoredLinks("{}").isErr()).toEqual(true); // due to missing links field

  expect(io.parseStoredLinks("{links: []}").isOk()).toEqual(true);
  expect(io.parseStoredLinks("{links: []}")._unsafeUnwrap()).toEqual([]);
});
