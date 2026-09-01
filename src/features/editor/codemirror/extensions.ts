import { SearchCursor } from "@codemirror/search";
import type { EditorView } from "@codemirror/view";
import type { CursorState } from "../../workspace/store/types";

export function cursorFromView(view: EditorView): CursorState {
  const selection = view.state.selection.main;
  const position = view.state.doc.lineAt(selection.head);

  return {
    anchor: selection.anchor,
    head: selection.head,
    line: position.number,
    column: selection.head - position.from + 1,
  };
}

export function collectMatches(view: EditorView, query: string, caseSensitive: boolean) {
  if (!query) return [];
  const normalize = caseSensitive ? undefined : (value: string) => value.toLowerCase();
  const cursor = new SearchCursor(view.state.doc, query, 0, view.state.doc.length, normalize);
  const matches: Array<{ from: number; to: number }> = [];

  for (let result = cursor.next(); !result.done; result = cursor.next()) {
    matches.push({ from: result.value.from, to: result.value.to });
  }

  return matches;
}
