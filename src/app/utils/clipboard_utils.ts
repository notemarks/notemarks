/*
It looks like fetching the clipboard content is quite a headache in Firefox.

- https://stackoverflow.com/questions/6413036/get-current-clipboard-content
- https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText
- https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read
- https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API#Browser_compatibility

- https://github.com/Teoxoy/factorio-blueprint-editor/issues/33
- https://stackoverflow.com/questions/54600673/pasting-content-from-clipboard-using-mozilla-navigator

- https://web.dev/async-clipboard/

The execCommand thing probably makes no sense, because we want to modify the
content instead of directly pasting it into the editor.

Strange https://caniuse.com/?search=clipboardData shows that window.clipboardData
should be available in FF, but it could mean that it is only available within
an "paste event" and since we are in a custom paste event this probably
won't help either?

Perhaps Monaco editor offers some other way to hook into pasting, at least
the content somehow gets pasted somehow into the editor window.

Another UX work around: Use a normal paste, but allow to mark a text in the monitor
and have a special keyboard shortcut for "turn selection into link". In this case
the link should be available via the selection.
*/

export async function getClipboardText(): Promise<string | null> {
  if (navigator.clipboard != null && navigator.clipboard.readText != null) {
    return await navigator.clipboard.readText();
  } else {
    console.log("Failed to read clipboard text.");
    return null;
  }
}
