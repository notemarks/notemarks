import { GitOpKind, GitOps } from "./git_ops";
import * as git_ops from "./git_ops";

import { FileMap } from "./filemap";

describe("diffFileMaps", () => {
  const diffFileMaps = git_ops.diffFileMaps;

  it("should handle empty maps", () => {
    let fm1 = new FileMap();
    let fm2 = new FileMap();
    let expected: GitOps = [];
    expect(diffFileMaps(fm1, fm2)).toEqual(expected);
  });

  it("should create a file", () => {
    let fm1 = new FileMap();
    let fm2 = new FileMap();
    fm2.setContent("foo/bar", "foobar");
    let expected: GitOps = [
      {
        kind: GitOpKind.Write,
        path: "foo/bar",
        content: "foobar",
      },
    ];
    expect(diffFileMaps(fm1, fm2)).toEqual(expected);
  });

  it("should delete a file", () => {
    let fm1 = new FileMap();
    let fm2 = new FileMap();
    fm1.setContent("foo/bar", "foobar");
    let expected: GitOps = [
      {
        kind: GitOpKind.Remove,
        path: "foo/bar",
      },
    ];
    expect(diffFileMaps(fm1, fm2)).toEqual(expected);
  });

  it("should move a file", () => {
    let fm1 = new FileMap();
    let fm2 = new FileMap();
    fm1.setContent("foo/bar", "foobar");
    fm2.setContent("foo/baz", "foobar");
    let expected: GitOps = [
      {
        kind: GitOpKind.Move,
        pathSrc: "foo/bar",
        pathDst: "foo/baz",
      },
    ];
    expect(diffFileMaps(fm1, fm2)).toEqual(expected);
  });

  it("should handle multiple ops", () => {
    let fm1 = new FileMap();
    let fm2 = new FileMap();
    fm1.setContent("some/file", "same_content");
    fm1.setContent("some/fileToBeDeleted", "toBeDeleted");
    fm2.setContent("other/file", "same_content");
    fm2.setContent("some/fileToBeCreated", "toBeCreated");
    let expected: GitOps = [
      {
        kind: GitOpKind.Move,
        pathSrc: "some/file",
        pathDst: "other/file",
      },
      {
        kind: GitOpKind.Write,
        path: "some/fileToBeCreated",
        content: "toBeCreated",
      },
      {
        kind: GitOpKind.Remove,
        path: "some/fileToBeDeleted",
      },
    ];
    expect(diffFileMaps(fm1, fm2)).toIncludeSameMembers(expected);
  });
});
