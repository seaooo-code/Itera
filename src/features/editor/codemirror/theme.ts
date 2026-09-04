import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

export const editorLayoutTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "var(--itera-editor-font-size)",
    backgroundColor: "var(--itera-color-surface)",
    color: "var(--itera-color-ink)",
  },
  ".cm-scroller": {
    fontFamily: "var(--itera-font-mono)",
    fontSize: "var(--itera-editor-font-size)",
    fontWeight: "400",
    lineHeight: "var(--itera-editor-line-height)",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "12px 20px 48px",
    lineHeight: "var(--itera-editor-line-height)",
    fontWeight: "500",
    caretColor: "var(--itera-color-ink)",
  },
  ".cm-line": {
    display: "block",
    height: "var(--itera-editor-line-height)",
    lineHeight: "var(--itera-editor-line-height)",
    padding: "0",
  },
  ".cm-gutters": {
    paddingTop: "0",
    backgroundColor: "var(--itera-color-surface)",
    color: "var(--itera-color-line-number)",
    border: "0",
    fontSize: "11.5px",
    lineHeight: "var(--itera-editor-line-height)",
    minWidth: "58px",
  },
  ".cm-gutter": {
    lineHeight: "var(--itera-editor-line-height)",
  },
  ".cm-gutterElement": {
    lineHeight: "var(--itera-editor-line-height)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 12px 0 0",
    minWidth: "58px",
    lineHeight: "var(--itera-editor-line-height)",
    textAlign: "right",
  },
  ".cm-activeLine": {
    position: "relative",
    backgroundColor: "var(--itera-color-current-line)",
    boxShadow: "inset 2px 0 0 var(--itera-color-primary-border)",
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
    outline: "1px solid var(--itera-color-warning-border)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "var(--itera-color-warning-find-current)",
  },
});

export const syntaxTheme = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "var(--itera-color-syntax-keyword)" },
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
      tag: [tags.variableName, tags.propertyName],
      color: "var(--itera-color-syntax-property)",
    },
    { tag: tags.tagName, color: "var(--itera-color-syntax-tag)" },
    { tag: tags.operator, color: "var(--itera-color-syntax-punctuation)" },
    { tag: tags.punctuation, color: "var(--itera-color-syntax-punctuation)" },
  ]),
);
