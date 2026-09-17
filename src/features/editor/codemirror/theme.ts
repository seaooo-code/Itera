import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

export const editorLayoutTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "var(--itera-editor-font-size)",
    backgroundColor: "var(--itera-color-surface)",
    color: "var(--itera-color-syntax-text)",
  },
  ".cm-scroller": {
    fontFamily: "var(--itera-font-mono)",
    fontSize: "var(--itera-editor-font-size)",
    fontWeight: "400",
    lineHeight: "var(--itera-editor-line-height)",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "12px 20px 48px 8px",
    lineHeight: "var(--itera-editor-line-height)",
    fontWeight: "500",
    caretColor: "var(--itera-color-ink)",
  },
  ".cm-line": {
    display: "block",
    height: "var(--itera-editor-line-height)",
    lineHeight: "var(--itera-editor-line-height)",
    padding: "0 0 0 12px",
  },
  ".cm-gutters": {
    paddingTop: "0",
    backgroundColor: "var(--itera-color-surface)",
    color: "var(--itera-color-line-number)",
    border: "0",
    fontSize: "11.5px",
    lineHeight: "var(--itera-editor-line-height)",
    minWidth: "0",
  },
  ".cm-gutter": {
    lineHeight: "var(--itera-editor-line-height)",
  },
  ".cm-gutterElement": {
    lineHeight: "var(--itera-editor-line-height)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 6px 0 8px",
    minWidth: "38px",
    lineHeight: "var(--itera-editor-line-height)",
    textAlign: "right",
  },
  ".cm-activeLine": {
    position: "relative",
    backgroundColor: "var(--itera-color-current-line)",
    boxShadow: "inset 2px 0 0 var(--itera-color-primary)",
  },
  ".cm-activeLineGutter": {
    color: "var(--itera-color-ink)",
    backgroundColor: "var(--itera-color-surface)",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "var(--itera-color-selection) !important",
  },
  ".cm-searchMatch": {
    backgroundColor: "var(--itera-color-warning-find)",
    borderRadius: "2px",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "var(--itera-color-warning-find-current)",
    outline: "1px solid var(--itera-color-warning-marker)",
  },
});

export const syntaxTheme = syntaxHighlighting(
  HighlightStyle.define([
    {
      tag: [tags.keyword, tags.bool, tags.null],
      color: "var(--itera-color-syntax-keyword)",
    },
    {
      tag: [tags.typeName, tags.className],
      color: "var(--itera-color-syntax-type)",
    },
    {
      tag: [tags.string, tags.special(tags.string)],
      color: "var(--itera-color-syntax-string)",
    },
    { tag: tags.number, color: "var(--itera-color-syntax-number)" },
    {
      tag: tags.comment,
      color: "var(--itera-color-syntax-comment)",
      fontStyle: "italic",
    },
    {
      tag: [tags.function(tags.variableName), tags.labelName],
      color: "var(--itera-color-syntax-function)",
    },
    {
      tag: [tags.propertyName, tags.attributeName],
      color: "var(--itera-color-syntax-property)",
    },
    { tag: tags.variableName, color: "var(--itera-color-syntax-text)" },
    { tag: tags.tagName, color: "var(--itera-color-syntax-tag)" },
    { tag: tags.operator, color: "var(--itera-color-syntax-punctuation)" },
    { tag: tags.punctuation, color: "var(--itera-color-syntax-punctuation)" },
  ]),
);
