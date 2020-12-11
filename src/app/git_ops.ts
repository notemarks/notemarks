import { Entry } from "./types";
import { Repo } from "./repo";
import * as path_utils from "./path_utils";

export enum GitOpKind {
  Write = "write",
  Remove = "remove",
  Move = "move",
}

export type GitOpWriteFile = {
  kind: GitOpKind.Write;
  path: string;
  content: string;
};
export type GitOpRemoveFile = {
  kind: GitOpKind.Remove;
  path: string;
};
export type GitOpMoveFile = {
  kind: GitOpKind.Move;
  pathFrom: string;
  pathTo: string;
};

export type GitOp = GitOpWriteFile | GitOpRemoveFile | GitOpMoveFile;

export type GitOps = GitOp[];

export type MultiRepoGitOps = { [id: string]: GitOps };

/*
TODO: What a headache... There must be a more elegant way to model this?!

Some thoughts:

The most tricky part here is that Moves are somewhat special.

First, they are the only operations that really rely on repo state.
A `Move A -> B` can either be valid or invalid depending on whether
A exists. Accordingly the final state of the operation cannot really
be determined, B may or may not exist after applying the operations
later. This makes it tricky to chain operations on an abstract level,
because the ambiguous state propagtes into subsequent operations operating
on B. In contrast Writes and Deletes have well defined result status
irrespective of repo state (a write ensures the file exists, a delete
ensures the file is gone -- obviously with the typical minor question
if a delete on a non-existing file is an error or if idempotency is
preferred).

Second, in terms of git semantics, Moves are only needed to model
moves that operate on the original input and don't modify the content.
As soon as they are chained with an update operation they need to
be converted into Delete + Write anyway, because Moves can only refer
to SHAs that are originally in the git repo (for intermediate states
we don't have SHAs to refer to), i.e.:
- Write A, Move A -> B must be converted into Delete A, Write B with new content A.
- Move A -> B, Write B must be converted into Delete A, Write B with new content B.

The main reason why we need to model Moves explicitly instead of simply
expressing them as Delete+Write is because in terms of the Octokit API
we would not (at least easily) be able to "rename" existing blobs in
git. If we would simply re-create the same content under a new destination
the behavior would (afaict) be that the blob gets re-committed as a new
blob with a new SHA (because the SHA contains commit timestamps etc.)
but with the same content. In terms of git diffing, git clients would
probably see a 100% similarity index and still show the file as a rename,
but it would still bloat the git history if we don't directly refer
to the existing/old SHA.

What about modeling it with only Delete + Write, but make the `content`
field a type union of either a new string content, or a reference
to an existing path? Looks like a lot of the case handling would
go into handling the two cases of the type union?

Alternatively: We could model it purely with Delete + Write (content
based) as an intermediate model to build up the operation chain.
This would then require a finalization step that converts the
intermediate representation into the actualy Delete + Write + Moves
git ops. This step would require the `originalEntries` as an input,
and within these original entries, we could identify if any of the
Writes actually writes exactly the same content. In this case
the Write can be transformed into a Move w.r.t. the original
entry path. Perhaps we could even store the original SHA directly
in the entries.

The only downside of that would be:
- The app would need to store all original entires in memory, i.e.,
  memory duplication with resepect to the total contents size.
- If given wrong `originalEntries` there could be a chance of data
  corruption/loss. For instance, if we pass in the current entries
  instead of the original entires, the algorithm would basically
  convert a normal update into a `Move A => A` because the content
  seems to match. We would thus not commit the new content, because
  the git commit would just reference the old content. Of course
  we could detect that a `Move A => A` indicates that something
  is fishy, but perhaps there are more subtle issues.
*/
export function appendNormalized(ops: GitOps, newOp: GitOp): GitOps {
  let newOps = [] as GitOps;

  let discardNew = false;

  for (let oldOp of ops) {
    if (oldOp.kind !== GitOpKind.Move && newOp.kind !== GitOpKind.Move) {
      // For writes or removes we can simply discard the old op if the new op
      // conflicts.
      if (oldOp.path !== newOp.path) {
        newOps.push(oldOp);
      }
    } else if (oldOp.kind === GitOpKind.Move && newOp.kind !== GitOpKind.Move) {
      // Old is a move, new isn't
      if (newOp.kind === GitOpKind.Remove && newOp.path === oldOp.pathFrom) {
        // Old: A -> B, New: del A    => illegal, keep old, discard new
        newOps.push(oldOp);
        discardNew = true;
      } else if (newOp.kind === GitOpKind.Remove && newOp.path === oldOp.pathTo) {
        // Old: A -> B, New: del B    => convert old into del A, discard new
        newOps.push({
          kind: GitOpKind.Remove,
          path: newOp.path,
        });
        discardNew = true;
      } else if (newOp.kind === GitOpKind.Write && newOp.path === oldOp.pathFrom) {
        // Old: A -> B, New: write A    => keep old, keep new; should be okay?
        newOps.push(oldOp);
      } else if (newOp.kind === GitOpKind.Write && newOp.path === oldOp.pathTo) {
        // Old: A -> B, New: write B    => convert old to del A, keep new
        newOps.push({
          kind: GitOpKind.Remove,
          path: oldOp.pathFrom,
        });
      }
    } else if (oldOp.kind !== GitOpKind.Move && newOp.kind === GitOpKind.Move) {
      // New is a move, old isn't
      if (oldOp.kind === GitOpKind.Remove && oldOp.path === newOp.pathFrom) {
        // Old: del A, New: A -> B    => illegal, keep old, discard new
        newOps.push(oldOp);
        discardNew = true;
      } else if (oldOp.kind === GitOpKind.Remove && oldOp.path === newOp.pathTo) {
        // Old: del B, New: A -> B    => discard old, keep new
      } else if (oldOp.kind === GitOpKind.Write && oldOp.path === newOp.pathFrom) {
        // Old: write A, New: A -> B    => convert into del + write with updated vales, discard both
        newOps.push({
          kind: GitOpKind.Remove,
          path: newOp.pathFrom,
        });
        newOps.push({
          kind: GitOpKind.Write,
          path: newOp.pathTo,
          content: oldOp.content,
        });
        discardNew = true;
      } else if (oldOp.kind === GitOpKind.Write && oldOp.path === newOp.pathTo) {
        // Old: write B, New: A -> B    => discard old, keep new, dangerous?
      }
    } else if (oldOp.kind === GitOpKind.Move && newOp.kind === GitOpKind.Move) {
      // Both are moves
      let sameSrc = newOp.pathFrom === oldOp.pathFrom;
      let sameTgt = newOp.pathFrom === oldOp.pathFrom;
      if (sameSrc) {
        // illegal, keep old, discard new
        newOps.push(oldOp);
        discardNew = true;
      } else if (sameTgt) {
        // convert old into del, keep new
        newOps.push({
          kind: GitOpKind.Remove,
          path: oldOp.pathFrom,
        });
      } else {
        if (oldOp.pathTo === newOp.pathFrom) {
          newOps.push({
            kind: GitOpKind.Move,
            pathFrom: oldOp.pathFrom,
            pathTo: newOp.pathTo,
          });
          // Fuse into one move
          discardNew = true;
        } else {
          // Non-overlapping case, keep both
          newOps.push(oldOp);
        }
      }
    }
  }

  if (!discardNew) {
    newOps.push(newOp);
  }

  return newOps;
}

export function createGitOpUpdateContent(entry: Entry): GitOpWriteFile {
  return {
    kind: GitOpKind.Write,
    path: path_utils.getPath(entry),
    content: entry.content!,
  };
}

export function appendUpdateEntry(ops: MultiRepoGitOps, entry: Entry): MultiRepoGitOps {
  let newOps = { ...ops };

  let newOp = createGitOpUpdateContent(entry);

  if (newOps.hasOwnProperty(entry.repoId)) {
    newOps[entry.repoId] = appendNormalized(newOps[entry.repoId], newOp);
  } else {
    newOps[entry.repoId] = [newOp];
  }

  return newOps;
}

export function mapMultiRepoGitOps<T>(
  ops: MultiRepoGitOps,
  f: (repoId: string, op: GitOp) => T
): T[] {
  let result = [] as T[];
  let repoIds = Object.keys(ops);
  for (let repoId of repoIds) {
    for (let op of ops[repoId]) {
      result.push(f(repoId, op));
    }
  }
  return result;
}
