import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import type { FileLanguage } from "../../../services/tauri/filesystem";

export function languageExtension(language: FileLanguage) {
  switch (language) {
    case "javascript":
      return javascript({ jsx: true });
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    case "css":
      return css();
    case "html":
      return html();
    case "json":
      return json();
    case "markdown":
      return markdown();
    default:
      return [];
  }
}
