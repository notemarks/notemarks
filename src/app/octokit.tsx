
import * as localforage from "localforage"

import { Octokit } from '@octokit/rest';
import { OctokitResponse } from '@octokit/types/dist-types/OctokitResponse'
import { GitGetTreeResponseData, GitCreateTreeResponseData } from '@octokit/types/dist-types/generated/Endpoints'

import * as neverthrow from 'neverthrow'
import { ok, err, okAsync, errAsync, Result, ResultAsync } from 'neverthrow'

import * as yaml from "js-yaml"

import { Repo, Repos } from "./repo";
import { Note } from "./types"
import * as date_utils from "./date_utils"
import { CommentOutlined } from "@ant-design/icons";


const NOTEMARKS_FOLDER = ".notemarks"

// ----------------------------------------------------------------------------
// File name / path handling utils
// ----------------------------------------------------------------------------

export enum EntryKind {
  NoteMarkdown = "NoteMarkdown",
  Link = "Link",
  Document = "Document",
}

export function getEntryKind(path: string): EntryKind {
  let extension = path.split('.').pop()?.toLowerCase();
  if (extension === "md") {
    return EntryKind.NoteMarkdown;
  } else if (extension === "desktop") {
    return EntryKind.Link;
  } else {
    return EntryKind.Document;
  }
}

export function getAssociatedMetaPath(path: string): string {
  return `${NOTEMARKS_FOLDER}/${path}.yaml`
}

export function splitLocationAndFilename(path: string): [string, string] {
  let idxLastSlash = path.lastIndexOf('/')
  if (idxLastSlash === -1) {
    return ["", path]
  } else {
    return [
      path.substring(0, idxLastSlash),
      path.substring(idxLastSlash + 1),
    ]
  }
}

export function filenameToTitle(filename: string) {
  // TODO: Unescaping of special chars has to go here...
  let idxLastDot = filename.lastIndexOf('.')
  if (idxLastDot === -1) {
    return filename;
  } else {
    return filename.substring(0, idxLastDot);
  }
}

export function titleToFilename(title: string, extension: string) {
  // TODO: Escaping of special chars has to go here...
  let titleEscaped = title
  if (extension.length > 0) {
    return `${titleEscaped}.${extension}`;
  } else {
    return titleEscaped;
  }
}

// ----------------------------------------------------------------------------
// ResultAsync helper
// ----------------------------------------------------------------------------

function expect<T>(promise: Promise<T>): neverthrow.ResultAsync<T, Error> {
  return neverthrow.ResultAsync.fromPromise(promise, (e) => e as Error);
}

export type WrappedError = {
  msg: string,
  originalError?: Error,
}

function wrapPromise<T>(promise: Promise<T>, msg: string): ResultAsync<T, WrappedError> {
  return ResultAsync.fromPromise(promise, (error) => {
    console.log(msg, error)
    return {
      msg: msg,
      originalError: error as Error,
    }
  });
}

function startChain(): ResultAsync<null, WrappedError> {
  return okAsync(null)
}

// ----------------------------------------------------------------------------
// High level functions
// ----------------------------------------------------------------------------


export async function verifyRepo(repo: Repo) {
  const octokit = new Octokit({
    auth: repo.token,
  });

  let content = await expect(octokit.repos.getContent({
    owner: repo.userName,
    repo: repo.repoName,
    path: ".",
  }))

  if (content.isOk()) {
    console.log("Verification succeeded.")
    return true;
  } else {
    console.log("Verification failed:")
    console.log(content.error);
    return false;
  }
}

// ----------------------------------------------------------------------------
// Internal cached fetching
// ----------------------------------------------------------------------------

async function cachedFetch(octokit: Octokit, repo: Repo, path: string, sha: string): Promise<Result<string, Error>> {
  let key = `${path}_${sha}`
  let cached = await localforage.getItem(key) as string | undefined

  if (cached != null) {
    // console.log(`${key} found in cached`)
    return ok(cached);
  } else {
    let result = await expect(octokit.repos.getContent({
      owner: repo.userName,
      repo: repo.repoName,
      path: path,
    }))

    if (result.isOk()) {
      console.log(`${key} fetched successfully`)
      let content = result.value;
      //console.log(content)
      console.assert(content.data.sha === sha, "SHA mismatch")
      console.assert(content.data.encoding === "base64", "Encoding mismatch")
      let plainContent = atob(content.data.content)
      //console.log(plainContent)
      await localforage.setItem(key, plainContent)
      return ok(plainContent);
    } else {
      console.log(`${key} failed to fetch`, result.error)
      return err(result.error);
    }
  }
}

// ----------------------------------------------------------------------------
// Recursive file listing
// ----------------------------------------------------------------------------

type File = {
  path: string,
  sha: string,
  rawUrl: string,
}

async function listFilesRecursive(octokit: Octokit, repo: Repo, path: string, files: File[]) {
  console.log("recursiveListFiles", path)

  let result = await expect(octokit.repos.getContent({
    owner: repo.userName,
    repo: repo.repoName,
    path: path,
  }))

  if (result.isOk()) {
    let content = result.value
    // console.log(content)
    // Reference for fields:
    // https://developer.github.com/v3/repos/contents/#get-repository-content

    for (let entry of content.data as any) {
      if (entry.type === "dir" &&  entry.name !== NOTEMARKS_FOLDER) {
        // It is important to await the recursive load, otherwise the outer logic does not
        // even know what / how many promises there will be scheduled.
        await listFilesRecursive(octokit, repo, entry.path, files)
      } else if (entry.type === "file") {
        files.push({
          path: entry.path,
          sha: entry.sha,
          rawUrl: entry.download_url,
        })
      }
    }
  }
}

async function listFiles(octokit: Octokit, repo: Repo, path: string): Promise<File[]> {
    // It is important to await the recursive load, otherwise the 'out' variables will
    // just stay empty...
    let files = [] as File[]
    await listFilesRecursive(octokit, repo, path, files);
    return files;
}

// ----------------------------------------------------------------------------
// High level entry loading
// ----------------------------------------------------------------------------

export type Entry = {
  // General fields
  repoId: string,
  rawUrl: string,
  // Fields derived from filename/path
  location: string,
  title: string,
  entryKind: EntryKind,
  // From meta data:
  labels: string[],
  timeCreated: Date,
  timeUpdated: Date,
  // From file content (optional):
  content: string | undefined,
}

// Note: Currently MetaData is only an internal type used during loading, and its
// fields get copied into the Entry type. Perhaps keeping it as internal type is
// beneficial, because it hides which data is actually coming from the meta files.
// However, we might as well embed it directly if that turns out to be more convenient.
type MetaData = {
  labels: string[],
  timeCreated: Date,
  timeUpdated: Date,
}

type StagedChange = {}

// TODO: Possible extension of return value to tuple containing:
// - entries
// - load errors
// - load statistics like "X files downloaded", "Y files from cache"?
// - staged changes
export async function loadEntries(repos: Repos): Promise<Entry[]> {
  console.log(`Loading contents from ${repos.length} repos`)

  let allEntries = [] as Entry[]
  let allErrors = [] as Error[]
  let stagedChanges = [] as StagedChange[]

  for (let repo of repos) {
    const octokit = new Octokit({
      auth: repo.token,
    });

    let files = await listFiles(octokit, repo, ".");
    let metaFiles = await listFiles(octokit, repo, NOTEMARKS_FOLDER);

    let entriesPromises = loadEntriesForRepoFromFilesList(octokit, repo, files, metaFiles, stagedChanges)
    let entries = await Promise.all(entriesPromises)
    /*
    // In theory we should use Promise.allSettled to account for failures of the promises,
    // but since we use ResultAsync that should be practically impossible, right?
    let entries: Result<Entry, Error>[] = (await Promise.allSettled(entriesPromises)).map(settleStatus => {
      if (settleStatus.status === "fulfilled") {
        return settleStatus.value;
      } else {
        return err(settleStatus.reason);
      }
    });
    */
    // console.log(entries)

    for (let entry of entries) {
      if (entry.isOk()) {
        allEntries.push(entry.value);
      } else {
        allErrors.push(entry.error);
      }
    }
  }

  console.log(allEntries)
  console.log(allErrors)

  return allEntries;
}


function loadEntriesForRepoFromFilesList(
  octokit: Octokit,
  repo: Repo,
  files: File[],
  metaFiles: File[],
  stagedChanges: StagedChange[],
): Array<Promise<Result<Entry, Error>>> {

  // Build meta lookup map
  let metaFilesMap: {[key: string]: File} = {}
  for (let metaFile of metaFiles) {
    metaFilesMap[metaFile.path] = metaFile;
  }

  type FileAndMeta = {
    file: File,
    meta?: File,
  }
  let filesAndMeta = [] as FileAndMeta[]

  // Iterate over files and find associated meta
  for (let file of files) {
    let metaPath = getAssociatedMetaPath(file.path)
    filesAndMeta.push({
      file: file,
      meta: metaFilesMap[metaPath],
    })
  }

  let entryPromises = []
  for (let { file, meta } of filesAndMeta) {
    entryPromises.push(loadEntry(octokit, repo, file, meta, stagedChanges))
  }

  return entryPromises;
}


async function loadEntry(
  octokit: Octokit,
  repo: Repo,
  file: File,
  meta: File | undefined,
  stagedChanges: StagedChange[],
): Promise<Result<Entry, Error>> {

  // Determine entry kind
  let entryKind = getEntryKind(file.path)

  // Optionally fetch entry content
  let entryContent: Result<string, Error> | undefined = undefined
  if (entryKind !== EntryKind.Document) {
    entryContent = await cachedFetch(octokit, repo, file.path, file.sha);
  }

  if ((entryContent == null || entryContent.isOk())) {

    // For meta data there are three cases:
    // - No meta file exists => okay, create/stage new
    // - Meta file exists, but fetch fails => create/stage not good, report as error
    // - Meta file exists, fetch is okay, but parse fails => probably better report as error?
    let metaData: MetaData
    if (meta == null) {
      metaData = createNewMetaData()
      // TODO: Add to staged changes here.
    } else {
      let metaContent = await cachedFetch(octokit, repo, meta.path, meta.sha);
      if (metaContent.isErr()) {
        return err(new Error(`Failed to fetch content of meta data ${meta.path}`))
      } else {
        let metaDataResult = parseMetaData(metaContent.value)
        if (metaDataResult.isErr()) {
          return err(new Error(`Could not parse meta data file ${meta.path}`))
        } else {
          metaData = metaDataResult.value
        }
      }
    }

    let [location, filename] = splitLocationAndFilename(file.path)
    let title = filenameToTitle(filename)

    return ok({
      repoId: repo.id,
      rawUrl: file.rawUrl,
      location: location,
      title: title,
      entryKind: entryKind,
      labels: metaData.labels as string[],
      timeCreated: metaData.timeCreated as Date,
      timeUpdated: metaData.timeUpdated as Date,
      content: entryContent?.value,
    })
  } else {
    return err(new Error(`Failed to fetch content of ${file.path}`))
  }
}

// ----------------------------------------------------------------------------
// Meta data utils
// ----------------------------------------------------------------------------

function createNewMetaData(): MetaData {
  let date = new Date();
  date.setMilliseconds(0);
  return {
    labels: [],
    timeCreated: date,
    timeUpdated: date,
  }
}

function parseMetaData(content: string): Result<MetaData, Error> {
  let metaData = yaml.safeLoad(content) as MetaData

  if (metaData == null) {
    return err(new Error("Meta data parsing returned null"));
  } else {

    let labels = Array.isArray(metaData["labels"])
      ? metaData["labels"] as string[]
      : undefined
    let timeCreated = typeof metaData["timeCreated"] === "string"
      ? date_utils.stringToDate(metaData["timeCreated"])
      : undefined;
    let timeUpdated = typeof metaData["timeUpdated"] === "string"
      ? date_utils.stringToDate(metaData["timeUpdated"])
      : undefined;

    if (labels == null) {
      return err(new Error("Meta data field 'labels' isn't an array."));
    } else if (timeCreated == null) {
      return err(new Error("Meta data field 'timeCreated' cannot be parsed."));
    } else if (timeUpdated == null) {
      return err(new Error("Meta data field 'timeUpdated' cannot be parsed."));
    } else {
      return ok({
        labels: labels,
        timeCreated: timeCreated,
        timeUpdated: timeUpdated,
      })
    }
  }
}

// ----------------------------------------------------------------------------
// Commit experiments
// ----------------------------------------------------------------------------

// http://www.levibotelho.com/development/commit-a-file-with-the-github-api/


export type GitOpWriteFile = {
  kind: "write",
  path: string,
  content: string
}
export type GitOpRemoveFile = {
  kind: "remove",
  path: string,
}
export type GitOpMoveFile = {
  kind: "move",
  pathFrom: string,
  pathTo: string,
}

export type GitOp = GitOpWriteFile | GitOpRemoveFile | GitOpMoveFile

type GitCreateTreeParamsTree = {
  path?: string;
  mode?: "100644" | "100755" | "040000" | "160000" | "120000";
  type?: "blob" | "tree" | "commit";
  sha?: string | null;
  content?: string;
};

export async function commit(repo: Repo, ops: GitOp[], commitMsg: string): Promise<Result<string, WrappedError>> {
  const octokit = new Octokit({
    auth: repo.token,
  });

  let oldCommitSHA: string
  let newCommitSHA: string

  return startChain().andThen(() => {
    return octokitGetRef(
      octokit, repo, "heads/main" // TODO repo must contain branch or infer default branch...
    )
  }).andThen(response => {
    oldCommitSHA = response.data.object.sha
    return octokitGetCommit(
      octokit, repo, oldCommitSHA,
    )
  }).andThen(response => {
    let oldTreeSHA = response.data.tree.sha
    return octokitGetTree(
      octokit, repo, oldTreeSHA,
    )
  }).andThen(response => {
    if (response.data.truncated) {
      return errAsync({
        msg: "Tree has been truncated -- handling that many files is not supported yet.",
        error: null,
      }) as ResultAsync<OctokitResponse<GitCreateTreeResponseData>, WrappedError>
    }
    let oldTree: GitGetTreeResponseData = response.data
    let newTree: GitCreateTreeParamsTree[] = applyOps(ops, oldTree)

    console.log(oldTree)
    console.log(newTree)

    return octokitCreateTree(
      octokit, repo, newTree,
    )
  }).andThen(response => {
    let newTreeSHA = response.data.sha
    return octokitCreateCommit(
      octokit, repo, commitMsg, oldCommitSHA, newTreeSHA,
    )
  }).andThen(response => {
    newCommitSHA = response.data.sha
    return octokitUpdateRef(
      octokit, repo, "heads/main", newCommitSHA,
    )
  }).map(() => (
    newCommitSHA
  ))
}

function octokitGetRef(octokit: Octokit, repo: Repo, ref: string) {
  return wrapPromise(
    octokit.git.getRef({
      owner: repo.userName,
      repo: repo.repoName,
      ref: "heads/main", // TODO repo must contain branch or infer default branch...
    }),
    "Failed to get head ref.",
  )
}

function octokitGetCommit(octokit: Octokit, repo: Repo, commitSHA: string) {
  return wrapPromise(
    octokit.git.getCommit({
      owner: repo.userName,
      repo: repo.repoName,
      commit_sha: commitSHA,
    }),
    "Failed to get head commit.",
  )
}

function octokitGetTree(octokit: Octokit, repo: Repo, treeSHA: string) {
  // TODO: getTree seems to fail if a repo is completely empty.
  // How to recover from that?
  return wrapPromise(
    octokit.git.getTree({
      owner: repo.userName,
      repo: repo.repoName,
      tree_sha: treeSHA,
      recursive: "true",
    }),
    `Failed to get tree with sha ${treeSHA}.`,
  )
}

function octokitCreateTree(octokit: Octokit, repo: Repo, tree: GitCreateTreeParamsTree[]) {
  return wrapPromise(
    octokit.git.createTree({
      owner: repo.userName,
      repo: repo.repoName,
      tree: tree,
    }),
    "Failed to create tree.",
  )
}

function octokitCreateCommit(octokit: Octokit, repo: Repo, commitMsg: string, oldCommitSHA: string, newTreeSHA: string) {
  return wrapPromise(
    octokit.git.createCommit({
      owner: repo.userName,
      repo: repo.repoName,
      message: commitMsg,
      parents: [oldCommitSHA],
      tree: newTreeSHA,
    }),
    "Failed to create commit.",
  )
}

function octokitUpdateRef(octokit: Octokit, repo: Repo, ref: string, commitSHA: string) {
  return wrapPromise(
    octokit.git.updateRef({
      owner: repo.userName,
      repo: repo.repoName,
      ref: ref,
      sha: commitSHA,
      force: true,
    }),
    "Failed to update ref.",
  )
}

function applyOps(ops: GitOp[], oldTree: GitGetTreeResponseData): GitCreateTreeParamsTree[] {
  // https://developer.github.com/v3/git/trees/#create-a-tree

  let newTree: GitCreateTreeParamsTree[] = []

  // Merge-in existing tree content
  for (let entry of oldTree.tree) {
    let keep = true;
    let destinationPath = entry.path;
    for (let op of ops) {
      // In both write/remove cases we don't keep the existing SHA
      // In theory we could check whether in the write case the existing
      // file actually has the expected content already. However, overwriting
      // does not seem to be forbidden, and typically the content is expected
      // to be modified anyway.
      if (op.kind !== "move" && op.path === entry.path) {
        keep = false;
        break;
      } else if (op.kind === "move" && op.pathFrom === entry.path) {
        destinationPath = op.pathTo
      }
    }

    // As mentioned in the blob post, it seems necessary to omit "tree" elements from
    // the new tree. In contrast to what is mentioned in the blob post however, this
    // did not error with a 500. Even worse, it succeeded, but it did had any "delete"
    // behavior. Files omitted in the new tree were still there, perhaps because their
    // parent tree elements were in the new tree as well. To get the desired behavior
    // removing tree elements seems still necessary.
    if (entry.type === "tree") {
      keep = false;
    }

    if (keep) {
      newTree.push({
        path: destinationPath,
        mode: entry.mode as any,
        type: entry.type as any,
        sha: entry.sha,
      })
    }
  }

  // Merge-in new writes
  for (let op of ops) {
    if (op.kind === "write") {
      newTree.push({
        path: op.path,
        mode: "100644", // blob non-executable
        type: "blob",
        content: op.content,
      })
    }
  }

  return newTree
}
