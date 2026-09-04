import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { SearchCursor } from "@codemirror/search";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { RangeSetBuilder, StateField, type Extension, type Text } from "@codemirror/state";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  GutterMarker,
  gutter,
  highlightActiveLine,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  type EditorView,
} from "@codemirror/view";
import type { CursorState } from "../../workspace/store/types";

export const editorSetup: Extension = [
  lineNumbers(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
];

type DiffOperation = "equal" | "delete" | "insert";
type LineChangeKind = "added" | "modified";

interface LineChange {
  kind?: LineChangeKind;
  hasDeletion: boolean;
}

const MAX_LCS_CELLS = 250_000;

function splitLines(value: string) {
  return value.split(/\r\n?|\n/);
}

function diffChangedLines(before: string[], after: string[]): DiffOperation[] {
  const rowLength = after.length + 1;
  const cellCount = (before.length + 1) * rowLength;

  if (cellCount > MAX_LCS_CELLS) {
    return [
      ...Array.from<DiffOperation>({ length: before.length }).fill("delete"),
      ...Array.from<DiffOperation>({ length: after.length }).fill("insert"),
    ];
  }

  const lengths = new Uint32Array(cellCount);

  for (let beforeIndex = before.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = after.length - 1; afterIndex >= 0; afterIndex -= 1) {
      const index = beforeIndex * rowLength + afterIndex;
      lengths[index] =
        before[beforeIndex] === after[afterIndex]
          ? lengths[index + rowLength + 1] + 1
          : Math.max(lengths[index + rowLength], lengths[index + 1]);
    }
  }

  const operations: DiffOperation[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;

  while (beforeIndex < before.length && afterIndex < after.length) {
    if (before[beforeIndex] === after[afterIndex]) {
      operations.push("equal");
      beforeIndex += 1;
      afterIndex += 1;
    } else if (
      lengths[(beforeIndex + 1) * rowLength + afterIndex] >=
      lengths[beforeIndex * rowLength + afterIndex + 1]
    ) {
      operations.push("delete");
      beforeIndex += 1;
    } else {
      operations.push("insert");
      afterIndex += 1;
    }
  }

  while (beforeIndex < before.length) {
    operations.push("delete");
    beforeIndex += 1;
  }
  while (afterIndex < after.length) {
    operations.push("insert");
    afterIndex += 1;
  }

  return operations;
}

function diffLines(before: string, after: string): DiffOperation[] {
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  let prefixLength = 0;

  while (
    prefixLength < beforeLines.length &&
    prefixLength < afterLines.length &&
    beforeLines[prefixLength] === afterLines[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < beforeLines.length - prefixLength &&
    suffixLength < afterLines.length - prefixLength &&
    beforeLines[beforeLines.length - suffixLength - 1] ===
      afterLines[afterLines.length - suffixLength - 1]
  ) {
    suffixLength += 1;
  }

  const changedBefore = beforeLines.slice(prefixLength, beforeLines.length - suffixLength);
  const changedAfter = afterLines.slice(prefixLength, afterLines.length - suffixLength);

  return [
    ...Array.from<DiffOperation>({ length: prefixLength }).fill("equal"),
    ...diffChangedLines(changedBefore, changedAfter),
    ...Array.from<DiffOperation>({ length: suffixLength }).fill("equal"),
  ];
}

export function computeLineChanges(before: string, after: string) {
  const changes = new Map<number, LineChange>();
  const operations = diffLines(before, after);
  const afterLineCount = splitLines(after).length;
  let operationIndex = 0;
  let currentLine = 1;

  while (operationIndex < operations.length) {
    if (operations[operationIndex] === "equal") {
      operationIndex += 1;
      currentLine += 1;
      continue;
    }

    let deletedCount = 0;
    let insertedCount = 0;
    while (operationIndex < operations.length && operations[operationIndex] !== "equal") {
      if (operations[operationIndex] === "delete") deletedCount += 1;
      if (operations[operationIndex] === "insert") insertedCount += 1;
      operationIndex += 1;
    }

    const modifiedCount = Math.min(deletedCount, insertedCount);
    for (let offset = 0; offset < insertedCount; offset += 1) {
      changes.set(currentLine + offset, {
        kind: offset < modifiedCount ? "modified" : "added",
        hasDeletion: false,
      });
    }

    if (deletedCount > insertedCount) {
      const markerLine = Math.min(afterLineCount, Math.max(1, currentLine + insertedCount));
      const existing = changes.get(markerLine);
      changes.set(markerLine, { ...existing, hasDeletion: true });
    }

    currentLine += insertedCount;
  }

  return changes;
}

class LineChangeMarker extends GutterMarker {
  readonly elementClass: string;

  constructor(
    readonly kind: LineChangeKind | undefined,
    readonly hasDeletion: boolean,
  ) {
    super();
    this.elementClass = [
      this.kind ? `cm-change-${this.kind}` : "",
      this.hasDeletion ? "cm-change-deleted" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  eq(other: GutterMarker) {
    return (
      other instanceof LineChangeMarker &&
      other.kind === this.kind &&
      other.hasDeletion === this.hasDeletion
    );
  }
}

function buildLineChangeMarkers(originalValue: string, document: Text) {
  const builder = new RangeSetBuilder<GutterMarker>();

  for (const [lineNumber, change] of computeLineChanges(originalValue, document.toString())) {
    const safeLineNumber = Math.min(document.lines, Math.max(1, lineNumber));
    const lineStart = document.line(safeLineNumber).from;
    builder.add(lineStart, lineStart, new LineChangeMarker(change.kind, change.hasDeletion));
  }

  return builder.finish();
}

export function lineChangeExtension(originalValue: string): Extension {
  const lineChanges = StateField.define({
    create: (state) => buildLineChangeMarkers(originalValue, state.doc),
    update: (markers, transaction) =>
      transaction.docChanged
        ? buildLineChangeMarkers(originalValue, transaction.state.doc)
        : markers,
    provide: (field) =>
      gutter({
        class: "cm-changeGutter",
        markers: (view) => view.state.field(field),
      }),
  });

  return lineChanges;
}

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
