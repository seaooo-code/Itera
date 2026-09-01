import type { FileLanguage } from "../../../services/tauri/filesystem";
import type { TabState, WorkspaceStore } from "./types";

export const selectActiveTab = (state: WorkspaceStore) =>
  state.activePath ? (state.tabs.find((tab) => tab.path === state.activePath) ?? null) : null;

export const selectDirtyTabs = (state: WorkspaceStore) => state.tabs.filter((tab) => tab.dirty);

export const getTabByPath = (tabs: TabState[], path: string | null) =>
  path ? (tabs.find((tab) => tab.path === path) ?? null) : null;

export const getLanguageLabel = (language: FileLanguage) => {
  const labels: Record<FileLanguage, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    markdown: "Markdown",
    text: "纯文本",
  };

  return labels[language];
};
