import type { FileLanguage } from "../../../services/tauri/filesystem";
import type { TabState, WorkspaceStore } from "./types";

export interface DirtyPathState {
  files: ReadonlySet<string>;
  directories: ReadonlySet<string>;
}

export const selectActiveTab = (state: WorkspaceStore) =>
  state.activePath ? (state.tabs.find((tab) => tab.path === state.activePath) ?? null) : null;

export const selectDirtyTabs = (state: WorkspaceStore) => state.tabs.filter((tab) => tab.dirty);

export const getTabByPath = (tabs: TabState[], path: string | null) =>
  path ? (tabs.find((tab) => tab.path === path) ?? null) : null;

export function getDirtyPathState(tabs: TabState[]): DirtyPathState {
  const files = new Set<string>();
  const directories = new Set<string>();

  for (const tab of tabs) {
    if (!tab.dirty) continue;

    files.add(tab.path);
    let parent = tab.path.replace(/[\\/][^\\/]+$/, "");

    while (parent) {
      directories.add(parent);
      const nextParent = parent.replace(/[\\/][^\\/]+$/, "");
      if (nextParent === parent) break;
      parent = nextParent;
    }
  }

  return { files, directories };
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
