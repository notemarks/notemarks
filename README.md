
![logo/full.png](logo/full.png)

[![Build Status](https://github.com/notemarks/notemarks/workflows/CI/badge.svg)](https://github.com/notemarks/notemarks/actions?query=workflow%3Aci)

A git based labeling app to manage notes, documents, and bookmarks.

[notemarks.app](https://notemarks.app)

Or try a demo:
- [Demo tutorial](https://notemarks.app/#demo-tutorial): This is a small walk-through of notemarks features.
- [Demo awesome](https://notemarks.app/#demo-awesome): This demo consists of only one note — the famous [awesome](https://github.com/sindresorhus/awesome) readme. The main purpose of the demo is to show how embedded links are accessible in the general search.

Project status: The app is currently in an early beta status. There will be bugs, and there are many things to improve internally and externally. Nonetheless it has reached a level of basic usefulness 😉. I hope I can stabilize the app over the following weeks.

## Why notemarks?

- **Mixing notes, documents, and bookmarks**: My note-taking approach is an interplay of notes, documents (e.g. papers), and bookmarks. For instance, in some cases a note revolves around a bookmark or document, in other cases a note evolves into a collection of links. In notemarks all three can be managed in a coherent system — at least eventually.
- **Hierarchical label system**: Hierarchical labeling system are perhaps the most powerful way to structure information. They can do the same as normal file system trees, but at the same time allow to organize things in orthogonal categories. In fact, one of the planned features is to use the file system structure as a built-in label dimension.
- **Access notes & bookmarks from everywhere**: Notemarks is entirely web-based. This makes it easy to access ones notes from everywhere. Currently there are no native mobile apps, but I tried to make the web-app mobile friendly so that I can access my notes easily from my smartphone.
- **Full git integration**: I love git, and for me, note-taking has to be done in git. However entirely manual pull/commits/push cycles can become a bit tedious. Notemarks provides some convenience to perform these standard steps with just a few mouse clicks.
- **Multi Repository Support**: Want to separate your work notes from private notes, or tech notes from cooking recipes? Notemarks supports storing all entities across multiple repositories, which can be enabled/disabled depending on the context.
- **Keyboard friendly UI**: Notemarks tries to support standard workflows with keyboard-only input.
- **No vendor lock in / open source**: Notemarks is an open-source client layer over plain git repositories. Currently only supports GitHub as git backend, but the way it stores notes, documents, and bookmarks is fully transparent and hackable.

## Usage notes

### Keyboard shortcuts

In the long term it is planned to make keyboard shortcuts configurable. Currently they are:

- <kbd>CTRL</kbd>+<kbd>p</kbd> jumps to the search input — following VSCode conventions.

- <kbd>↑</kbd> and <kbd>↓</kbd> in the search allows to select notes.

- <kbd>ENTER</kbd> in the search to select note.

- <kbd>CTRL</kbd>+<kbd>e</kbd> toggles between note editing and note viewer.

### Search

The label tree allows to include or exclude certain labels. A left mouse click (short press on mobile) selects a label for inclusion, a right mouse click (long press on mobile) selects a label for exclusion.

In general the search prioritizes notes over documents over links. Filter the search by entry type is an obvious TODO 😉

### GitHub authentication

Notemarks can be used without GitHub authentication in read-only mode on public repositories — as is done in the demos. If write-access or read-access to private repositories is needed, it is necessary to authenticate with GitHub. This is currently solved by using GitHub's personal access token feature. In order to create a personal access token you need to go to your GitHub Settings → Developer settings → Personal access tokens → Generate new token. Currently I'm giving the token the `repo` status, i.e., _Full control of private repositories_. I need to investigate if a more fine granular access would work as well.

This access token then needs to be specified in the notemarks settings under GitHub authentication. Note that notemarks will never store the token without encryption. If you want to avoid re-entering the token every time, you can run notemarks with a local encryption password. In this case, notemarks uses strong encryption from webcrypto to store the token securely.

### Internal concepts

Notemarks operates on plain files in a git repository, and stores all its internal information in a top-level `.notemarks` folder (similar to a `.git` folder). For instance, if your files are:

```
.
├── notes
│   ├── Note on bar.md
│   └── Note on foo.md
└── papers
    └── Great paper on something.pdf
```

it will internally create additional meta data files resulting in:

```
.
├── .notemarks
│   ├── link_db.yaml
│   ├── notes
│   │   ├── Note on bar.yaml
│   │   └── Note on foo.yaml
│   └── papers
│       └── Great paper on something.yaml
├── notes
│   ├── Note on bar.md
│   └── Note on foo.md
└── papers
    └── Great paper on something.pdf
```

There are two kind of meta data files:
- The `.yaml` directly correspond to notes/documents and store information such as creation timestamps and associated labels.
- The `link_db.yaml` stores internal information on bookmarks like internal titles or associated labels.


### Title encoding

Notemarks infers note and document titles directly from their filenames in order to avoid having internal titles different from file system titles. Since some characters like `/` are useful characters in a note/document title, it encodes them into close unicode equivalents which are supported by file systems — in case of `/` e.g. [⧸ (BIG SOLIDUS)](https://www.fileformat.info/info/unicode/char/29f8/index.htm). This is mainly tested against POSIX systems so far.


## Planned features

### Short term

- Embedding images via paste
- Auto-complete on labels
- Filter search by entry types

### Mid term

- Table multi-select for batch labelling
- Priority system for entries to allow for custom sorting (use case: pinning/favorites)
- Priority system for labels to allow for custom sorting
- Dynamically update label counts in tree view depending on selection
- Full text search, perhaps with fuzziness
- "Unlabeled" Label
- Labels inferred from file paths
- Modifyable label colors
- Time as a label for publications
- .notemarksignore file
- Multiple note rendering styles
- More per-note preferences like Markdown flavor, encryption
- Note encryption

### Longer term

- Other data backends like Bitbucket or even Dropbox
- Native apps

## Support

If you like notemarks or want to support its development:

[![paypal](https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif)](https://paypal.me/FabKeller)

Thank you! 🙏


