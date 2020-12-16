import React from "react";
import { useRef, useImperativeHandle, forwardRef } from "react";

import Editor from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";

import styled from "@emotion/styled";

import { NoEntrySelected } from "./HelperComponents";
import { UiRow } from "./UiRow";

import { Entry } from "./types";
import * as fn from "./fn_utils";
import * as clipboard_utils from "./clipboard_utils";
import * as web_utils from "./web_utils";

type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor;

/*
// ----------------------------------------------------------------------------
// Notes:
// ----------------------------------------------------------------------------

# Choice of library

There are several React Monaco Editor wrappers. I went for this one, mainly
because it is the only one compatible with CRA/non-eject:

https://github.com/suren-atoyan/monaco-react#readme

Alternatives are (and in particular the first one is much more popular):
- https://github.com/react-monaco-editor/react-monaco-editor
- https://github.com/jaywcjlove/react-monacoeditor

# How to expose editor state to the main app without "hoisting state"

The Monaco editor is an example where lifting its entire state into the
main app doesn't make sense. Instead the main app needs to query the
editor only in specific moments (like when leaving the editor) for certain
information.

The hooks-based solution for this problem is a combination of `forwardRef`
and `useImparativeHandle` as described here:

https://stackoverflow.com/a/61547777/1804173

Getting the type information for the forward ref right, was loosely based on:

https://stackoverflow.com/a/62258685/1804173

In retrospect: Since there is a editorDidMount callback anyway that gets the
editor instance, and we need to bubble the callback up to the main app e.g.
for cursor restoring, we might as well drop the forwardRef mechanism and
pass that ref up via the callback manually?
*/

async function handlePasteLink(editor: monacoEditor.editor.ICodeEditor) {
  let clipboardText = await clipboard_utils.getClipboardText();
  console.log("clipboard text:", clipboardText);
  if (clipboardText == null) {
    // We cannot get the clipboard text. At least try to run the paste command
    // to get the clipboard content into the editor without any processing.
    document.execCommand("paste");
    return;
  }

  // try to request a title from clipboard text
  let title = await web_utils.getTitle(clipboardText);

  console.log("title is:", title);
  if (title === undefined) {
    title = "";
  }

  var selection = editor.getSelection();
  // console.log(selection);
  if (selection !== null) {
    var range = new monacoEditor.Range(
      selection.startLineNumber,
      selection.startColumn,
      selection.endLineNumber,
      selection.endColumn
    );
    var id = { major: 1, minor: 1 };
    var text = `[${title}](${clipboardText})`;
    var op = {
      identifier: id,
      range: range,
      text: text,
      forceMoveMarkers: true,
    };
    let newSelection = new monacoEditor.Selection(
      selection.startLineNumber,
      selection.startColumn + 1 + title.length,
      selection.startLineNumber,
      selection.startColumn + 1
    );
    editor.executeEdits("paste-link", [op], [newSelection]);
  }
}

const DebugBox = styled.div`
  height: 100%;
  /* Work-around for vertical overflow issue: https://github.com/microsoft/monaco-editor/issues/29 */
  overflow: hidden;
  /* background: #050; */
`;

export type NoteEditorRef = {
  getEditorContent: () => string | undefined;
  getScrollPosition: () => number | undefined;
  setScrollPosition: (pos: number) => void;
  getCursorPosition: () => monacoEditor.Position | undefined;
  setCursorPosition: (pos: monacoEditor.Position) => void;
  focus: () => void;
};

type NoteEditorProps = {
  entry?: Entry;
  onEditorDidMount: () => void;
};

const NoteEditor = forwardRef(
  ({ entry, onEditorDidMount }: NoteEditorProps, ref: React.Ref<NoteEditorRef>) => {
    const editorRef = useRef(undefined as IStandaloneCodeEditor | undefined);

    // https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-adding-an-action-to-an-editor-instance
    const onEditorDidMountWrapper = (_: () => string, editor: IStandaloneCodeEditor) => {
      editor.addAction({
        // An unique identifier of the contributed action.
        id: "link-paste",
        // A label of the action that will be presented to the user.
        label: "Link paste",
        // An optional array of keybindings for the action.
        keybindings: [
          monacoEditor.KeyMod.CtrlCmd | monacoEditor.KeyMod.Shift | monacoEditor.KeyCode.KEY_V,
        ],
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.5,
        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convenience
        run: function (editor) {
          handlePasteLink(editor);
        },
      });

      editorRef.current = editor;
      onEditorDidMount();
    };

    useImperativeHandle(ref, () => ({
      getEditorContent: () => {
        return editorRef.current?.getValue();
      },
      // https://stackoverflow.com/a/45349393/1804173
      // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.icodeeditor.html
      getScrollPosition: () => {
        return editorRef.current?.getScrollTop();
      },
      setScrollPosition: (pos: number) => {
        editorRef.current?.setScrollTop(pos);
      },
      getCursorPosition: () => {
        return fn.mapNullToUndefined(editorRef.current?.getPosition());
      },
      setCursorPosition: (pos: monacoEditor.Position) => {
        editorRef.current?.setPosition(pos);
      },
      focus: () => {
        editorRef.current?.focus();
      },
    }));

    const renderEntry = (entry: Entry) => {
      return (
        <DebugBox>
          <Editor
            height="100%"
            theme="dark"
            language="markdown"
            value={entry.content}
            editorDidMount={onEditorDidMountWrapper}
            options={{
              fontSize: 12,
              cursorBlinking: "smooth",
              wordWrap: "on",
              wordWrapColumn: 100,
              minimap: {
                enabled: false,
              },
              // Doesn't seem to have an effect?
              // Reference: https://stackoverflow.com/questions/47017753/monaco-editor-dynamically-resizable
              // automaticLayout: true,
            }}
          />
        </DebugBox>
      );
    };

    return (
      <UiRow
        center={entry != null ? renderEntry(entry) : <NoEntrySelected />}
        style={{ height: "100%" }}
      />
    );
  }
);

export default NoteEditor;
