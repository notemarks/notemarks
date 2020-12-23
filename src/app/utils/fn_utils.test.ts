import * as fn_utils from "./fn_utils";

test("mapEntries", () => {
  expect(
    fn_utils.mapEntries(
      {
        foo: 1,
        bar: 2,
      },
      (k, v) => k + v
    )
  ).toEqual(["foo1", "bar2"]);
});

describe("clone", () => {
  const naiveClone = fn_utils.clone;

  it("should copy scalars", () => {
    expect(naiveClone(42)).toBe(42);
    expect(naiveClone(true)).toBe(true);
    expect(naiveClone("foo")).toBe("foo");
  });

  it("should clone arrays", () => {
    let x = [1, 2, 3];
    expect(naiveClone(x)).toEqual(x);
    expect(naiveClone(x)).not.toBe(x);
  });

  it("should clone objects", () => {
    let x = { foo: 1, bar: 2 };
    expect(naiveClone(x)).toEqual(x);
    expect(naiveClone(x)).not.toBe(x);
  });

  it("should clone empty things", () => {
    {
      let x = {};
      expect(naiveClone(x)).toEqual(x);
      expect(naiveClone(x)).not.toBe(x);
    }
    {
      let x = [] as number[];
      expect(naiveClone(x)).toEqual(x);
      expect(naiveClone(x)).not.toBe(x);
    }
  });

  it("should clone common classes", () => {
    let x = new Date(2020, 0, 1, 12, 0, 0, 0);
    expect(naiveClone(x)).toEqual(x);
    expect(naiveClone(x)).not.toBe(x);
    expect(naiveClone(x) instanceof Date).toBe(true);
  });

  it("should deep clone", () => {
    {
      let x = { foo: [1], bar: [2] };
      let y = naiveClone(x);
      expect(y).toEqual(x);
      expect(y).not.toBe(x);
      expect(y.foo).not.toBe(x.foo);
      y.foo.push(2);
      expect(y).not.toEqual(x);
    }
    {
      let x = [{ foo: 1, bar: 2 }];
      let y = naiveClone(x);
      expect(y).toEqual(x);
      expect(y).not.toBe(x);
      expect(y[0]).not.toBe(x[0]);
      y[0].foo = 2;
      expect(y).not.toEqual(x);
    }
  });
});
