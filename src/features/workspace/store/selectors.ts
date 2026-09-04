import type { FileLanguage } from "../../../services/tauri/filesystem";
import type { TabState, WorkspaceStore } from "./types";

export interface TreePathState {
  openedFiles: ReadonlySet<string>;
  dirtyFiles: ReadonlySet<string>;
  conflictFiles: ReadonlySet<string>;
}

export const selectActiveTab = (state: WorkspaceStore) =>
  state.activePath ? (state.tabs.find((tab) => tab.path === state.activePath) ?? null) : null;

export const selectDirtyTabs = (state: WorkspaceStore) => state.tabs.filter((tab) => tab.dirty);

export const getTabByPath = (tabs: TabState[], path: string | null) =>
  path ? (tabs.find((tab) => tab.path === path) ?? null) : null;

export function getTreePathState(tabs: TabState[]): TreePathState {
  const openedFiles = new Set<string>();
  const dirtyFiles = new Set<string>();
  const conflictFiles = new Set<string>();

  for (const tab of tabs) {
    openedFiles.add(tab.path);
    if (tab.dirty) dirtyFiles.add(tab.path);
    if (tab.externalConflict) conflictFiles.add(tab.path);
  }

  return { openedFiles, dirtyFiles, conflictFiles };
}

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
