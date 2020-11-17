
import * as localforage from "localforage"
import { Octokit } from '@octokit/rest';

import * as neverthrow from 'neverthrow'
import { ok, err, okAsync, errAsync, Result, ResultAsync } from 'neverthrow'

import * as yaml from "js-yaml"

import { Repo, Repos } from "./repo";
import { Note } from "./types"
import * as date_utils from "./date_utils"


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
