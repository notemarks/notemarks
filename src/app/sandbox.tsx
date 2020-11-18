/* eslint-disable @typescript-eslint/no-unused-vars */
import { Octokit } from '@octokit/rest';
import { ok, err, okAsync, errAsync, Result, ResultAsync } from 'neverthrow'

// ----------------------------------------------------------------------------
// Old cached fetch
// ----------------------------------------------------------------------------

/*
async function cachedFetchFile(octokit: Octokit, repo: Repo, path: string, sha: string): Promise<Result<File, FileError>> {
  let fileKind = getFileKind(path)
  if (fileKind === FileKind.Document) {
    return ok({
      kind: fileKind,
      path: path,
      content: undefined,
    })
  } else {
    let result = await cachedFetch(octokit, repo, path, sha);
    if (result.isOk()) {
      return ok({
        kind: fileKind,
        path: path,
        content: result.value,
      })
    } else {
      return err({
        kind: fileKind,
        path: path,
        error: result.error,
      })
    }
  }
}


type File = {
  kind: FileKind,
  //filename: string,
  path: string,
  content: string | undefined,
}

type FileError = {
  kind: FileKind,
  //filename: string,
  path: string,
  error: Error,
}

type FilePromises = Array<Promise<Result<File, FileError>>>

async function recursiveLoad(octokit: Octokit, repo: Repo, path: string, promises: FilePromises) {
  console.log("recursiveLoad", path)

  let result = await expect(octokit.repos.getContent({
    owner: repo.userName,
    repo: repo.repoName,
    path: path,
  }))

  if (result.isOk()) {
    let content = result.value
    // console.log(content)

    for (let entry of content.data as any) {
      // console.log(entry.path)
      if (entry.type === "dir" &&  entry.name !== NOTEMARKS_FOLDER) {
        // It is important to await the recursive load, otherwise the outer logic does not
        // even know what / how many promises there will be scheduled.
        await recursiveLoad(octokit, repo, entry.path, promises)
      } else if (entry.type === "file") {
        promises.push(cachedFetchFile(octokit, repo, entry.path, entry.sha))
        / *
        if (content != null) {
          contents.notes.push({
            repoId: repo.id,
            location: entry.path,
            title: "",
            labels: [],
            timeCreated: new Date(),
            timeUpdated: new Date(),
            content: content,
          })
        }
        * /
      }
    }
  }
}
*/

// ----------------------------------------------------------------------------
// Neverthrow
// ----------------------------------------------------------------------------

//type Result<T> = neverthrow.Result<T, Error>
//type ResultAsync<T> = Promise<Result<T>>
//type ResultAsync<T> = neverthrow.ResultAsync<T, Error>


/*
async function expect<T>(promise: Promise<T>): Promise<[T?, Error?]> {
  return promise
    .then(data => [data, undefined] as [T, undefined])
    .catch(error => Promise.resolve([undefined, error] as [undefined, Error]));
}
*/

function neverthrow_test_1() {
  async function foo(): Promise<number> {
    return 42;
  }

  async function test(): Promise<Result<string, Error>> {
    let result = await ResultAsync.fromPromise(foo(), () => new Error("failed"))
    if (result.isOk()) {
      if (result.value > 0) {
        return okAsync("positive")
      } else {
        return okAsync("negative")
      }
    } else {
      return errAsync(new Error("failed"))
    }
  }
}

function neverthrow_test_2() {
  async function foo(): Promise<number> {
    return 42;
  }

  async function combine(): Promise<Result<number, Error>> {
    let promiseA = foo();
    let promiseB = foo();
    let resultA = await ResultAsync.fromPromise(promiseA, () => new Error("failed"))
    let resultB = await ResultAsync.fromPromise(promiseB, () => new Error("failed"))
    return (
      resultA.isOk() && resultB.isOk() ?
      okAsync(resultA.value + resultB.value) :
      errAsync(new Error("failed"))
    )
  }
}

function neverthrow_test_3() {
  type ResponseType = {
    some: {
      nested: {
        field: number
      }
    },
    other: {
      nested: {
        field: number
      }
    }
  }

  async function exampleRequest(arg?: number): Promise<ResponseType> {
    return Promise.resolve({
      some: {nested: {field: 1}},
      other: {nested: {field: 2}},
    });
  }
  async function exampleRequestBad(): Promise<ResponseType> {
    return Promise.reject(new Error("some error"));
  }

  function wrap<T>(promise: Promise<T>): ResultAsync<T, Error> {
    return ResultAsync.fromPromise(promise, (e) => e as Error);
  }

  async function requestChain(): Promise<Result<number, string>> {

    let aResult = await wrap(exampleRequest())
    if (aResult.isErr()) {
      return err("something went wrong in request A")
    }
    let a = aResult.value.some.nested.field

    let bResult = await wrap(exampleRequest(a))
    if (bResult.isErr()) {
      return err("something went wrong in request B")
    }
    let b = aResult.value.other.nested.field

    let cResult = await wrap(exampleRequest(b))
    if (cResult.isErr()) {
      return err("something went wrong in request C")
    }
    let c = aResult.value.other.nested.field

    return ok(a + b + c)
  }
}

// ----------------------------------------------------------------------------
// Octokit
// ----------------------------------------------------------------------------

/*
const auth = process.env.REACT_APP_AUTH;
console.log(auth)

const octokit = new Octokit({
  auth: auth,
});

// Compare: https://docs.github.com/en/rest/reference/repos/#list-organization-repositories
octokit.repos
  .listForOrg({
    org: "octokit",
    type: "public",
  })
  .then(({ data }) => {
    console.log(data)
  });

  octokit.repos.listForAuthenticatedUser()
  .then(({ data }) => {
    console.log(data)
  });
*/

export async function experiment() {
  const auth = process.env.REACT_APP_AUTH;
  console.log(auth)

  const octokit = new Octokit({
    auth: auth,
  });

  // https://octokit.github.io/rest.js/v18#repos-get-content
  let content = await octokit.repos.getContent({
    owner: "bluenote10",
    repo: "DummyRepo",
    path: "README.md",
  })

  console.log(content)
  console.log(content.data.content)

  let fileContent = atob(content.data.content)
  console.log(fileContent)

  // https://octokit.github.io/rest.js/v18#repos-create-or-update-file-contents
  let commit = await octokit.repos.createOrUpdateFileContents({
    owner: "bluenote10",
    repo: "DummyRepo",
    path: ".autogen_001",
    message: "auto commit",
    content: btoa("another dummy content"),
    "committer.name": "Octokit",
    "committer.email": "Octokit@github.com",
    "author.name": "Octokit",
    "author.email": "Octokit@github.com",
  })
  console.log(commit)

  let files = await octokit.repos.getContent({
    owner: "bluenote10",
    repo: "DummyRepo",
    path: ".",
  })
  console.log(files)
}
