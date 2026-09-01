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
    color: "#7f8790",
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
    backgroundColor: "#f3fbf5",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#f3fbf5",
    color: "#29303a",
    boxShadow: "inset 2px 0 0 #83c88f",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "#dff3e4 !important",
  },
  ".cm-searchMatch": {
    backgroundColor: "#fae4ad",
    outline: "1px solid #d4a749",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#f1c66b",
  },
});

export const syntaxTheme = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "#7441a8" },
    { tag: [tags.typeName, tags.className], color: "#3e617d" },
    { tag: [tags.string, tags.special(tags.string)], color: "#996126" },
    { tag: tags.number, color: "#9d4f38" },
    { tag: tags.comment, color: "#6c737c", fontStyle: "italic" },
    {
      tag: [tags.function(tags.variableName), tags.labelName],
      color: "#4e569c",
    },
    { tag: [tags.variableName, tags.propertyName], color: "#3f4855" },
    { tag: tags.tagName, color: "#95436e" },
    { tag: tags.operator, color: "#58626c" },
    { tag: tags.punctuation, color: "#58626c" },
  ]),
);
