import { FileMap, MultiRepoFileMap } from "./filemap";

import { createDefaultInitializedRepo } from "./repo";

describe("FileMap", () => {
  it("Properly clones", () => {
    let fileMap1 = new FileMap();
    fileMap1.setContent("foo", "fooContent");
    fileMap1.setContent("bar", "barContent");
    let fileMap2 = fileMap1.clone();

    expect(fileMap1.get("foo")?.content).toEqual("fooContent");
    expect(fileMap1.get("bar")?.content).toEqual("barContent");
    expect(fileMap2.get("foo")?.content).toEqual("fooContent");
    expect(fileMap2.get("bar")?.content).toEqual("barContent");

    fileMap2.setContent("baz", "bazContent");
    expect(fileMap2.get("baz")?.content).toEqual("bazContent");
    expect(fileMap1.get("baz")?.content).toBeUndefined();

    fileMap2.setContent("foo", "fooContentModified");
    expect(fileMap1.get("foo")?.content).toEqual("fooContent");
    expect(fileMap2.get("foo")?.content).toEqual("fooContentModified");
  });
});

describe("MultiRepoFileMap", () => {
  it("Properly clones", () => {
    let repo = createDefaultInitializedRepo(true);

    let multiRepoFileMap1 = new MultiRepoFileMap();
    multiRepoFileMap1.set(repo, new FileMap());
    multiRepoFileMap1.get(repo)?.data.setContent("foo", "fooContent");
    multiRepoFileMap1.get(repo)?.data.setContent("bar", "barContent");

    let multiRepoFileMap2 = multiRepoFileMap1.clone();

    expect(multiRepoFileMap1.get(repo)?.data.get("foo")?.content).toEqual("fooContent");
    expect(multiRepoFileMap1.get(repo)?.data.get("bar")?.content).toEqual("barContent");
    expect(multiRepoFileMap2.get(repo)?.data.get("foo")?.content).toEqual("fooContent");
    expect(multiRepoFileMap2.get(repo)?.data.get("bar")?.content).toEqual("barContent");

    multiRepoFileMap2.get(repo)?.data.setContent("baz", "bazContent");
    expect(multiRepoFileMap2.get(repo)?.data.get("baz")?.content).toEqual("bazContent");
    expect(multiRepoFileMap1.get(repo)?.data.get("baz")?.content).toBeUndefined();

    multiRepoFileMap2.get(repo)?.data.setContent("foo", "fooContentModified");
    expect(multiRepoFileMap1.get(repo)?.data.get("foo")?.content).toEqual("fooContent");
    expect(multiRepoFileMap2.get(repo)?.data.get("foo")?.content).toEqual("fooContentModified");
  });
});
