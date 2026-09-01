import { create } from "zustand";
import { persist } from "zustand/middleware";
import { chooseDirectory } from "../../../services/tauri/dialog";
import {
  formatFileError,
  pathExists,
  readProjectFile,
  readProjectTree,
  relativePath,
  writeProjectFile,
} from "../../../services/tauri/filesystem";
import { watchProject } from "../../../services/tauri/watcher";
import type { CursorState, TabState, WorkspaceStore } from "./types";

export type {
  CursorState,
  FindState,
  ProjectState,
  RecentProject,
  SyncState,
  TabState,
  WorkspaceActions,
  WorkspaceState,
  WorkspaceStore,
} from "./types";

let stopWatching: (() => void) | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function clampSidebar(width: number) {
  return Math.min(460, Math.max(196, Math.round(width)));
}

function fileName(path: string) {
  return path.replace(/\\/g, "/").split("/").pop() ?? path;
}

function defaultCursor(): CursorState {
  return { anchor: 0, head: 0, line: 1, column: 1 };
}

function createTab(
  rootPath: string,
  file: Awaited<ReturnType<typeof readProjectFile>>,
  draft?: Partial<TabState>,
): TabState {
  const content = draft?.content ?? file.content;
  const dirty = draft?.dirty ?? false;

  return {
    path: file.path,
    relativePath: relativePath(rootPath, file.path),
    name: fileName(file.path),
    content,
    diskContent: file.content,
    dirty,
    cursor: draft?.cursor ?? defaultCursor(),
    scrollTop: draft?.scrollTop ?? 0,
    language: file.language,
    readOnly: file.binary,
    binary: file.binary,
    byteLength: file.byteLength,
    externalConflict: draft?.externalConflict ?? false,
    missing: false,
  };
}

async function loadPersistedTabs(rootPath: string, drafts: TabState[]): Promise<TabState[]> {
  const loaded: TabState[] = [];

  for (const draft of drafts) {
    try {
      const file = await readProjectFile(draft.path);
      loaded.push(createTab(rootPath, file, draft));
    } catch {
      loaded.push({ ...draft, missing: true });
    }
  }

  return loaded;
}

async function startWatching(rootPath: string) {
  stopWatching?.();
  stopWatching = await watchProject(rootPath, () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      void useWorkspaceStore.getState().refreshWorkspace();
    }, 150);
  });
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      project: null,
      tree: [],
      ignoredPatterns: [],
      expandedDirs: {},
      tabs: [],
      activePath: null,
      sidebarVisible: true,
      sidebarWidth: 264,
      findState: {
        isOpen: false,
        query: "",
        caseSensitive: false,
        currentMatch: 0,
        totalMatches: 0,
      },
      recentProjects: [],
      syncState: { status: "idle", error: null },
      initialized: false,

      chooseProject: async () => {
        const path = await chooseDirectory();
        if (typeof path === "string") {
          await get().openProject(path);
        }
      },

      openProject: async (path, restoreTabs = false) => {
        const existingProject = get().project;
        const persistedTabs = restoreTabs ? get().tabs : [];
        set({ syncState: { status: "reading", error: null } });

        try {
          const project = await readProjectTree(path);
          const tabs =
            restoreTabs && existingProject?.path === path
              ? await loadPersistedTabs(path, persistedTabs)
              : [];
          const recentProjects = [
            {
              path,
              name: project.name,
              openedAt: Date.now(),
              available: true,
            },
            ...get().recentProjects.filter((item) => item.path !== path),
          ].slice(0, 8);

          set({
            project: {
              path: project.path,
              name: project.name,
              syncedAt: Date.now(),
            },
            tree: project.children,
            ignoredPatterns: project.ignoredPatterns,
            tabs,
            activePath: tabs.some((tab) => tab.path === get().activePath)
              ? get().activePath
              : (tabs[0]?.path ?? null),
            recentProjects,
            syncState: { status: "synced", error: null },
          });
        } catch (error) {
          const message = formatFileError(error, "打开项目失败");
          console.error("[Itera] 打开项目失败", { path, error });
          set({ syncState: { status: "failed", error: message } });
          throw error;
        }

        try {
          await startWatching(path);
        } catch (error) {
          const message = formatFileError(error, "监听项目目录失败");
          console.error("[Itera] 监听项目目录失败", { path, error });
          set({ syncState: { status: "failed", error: message } });
        }
      },

      closeProject: () => {
        stopWatching?.();
        stopWatching = null;
        set({
          project: null,
          tree: [],
          ignoredPatterns: [],
          tabs: [],
          activePath: null,
          syncState: { status: "idle", error: null },
          findState: {
            ...get().findState,
            isOpen: false,
            query: "",
            currentMatch: 0,
            totalMatches: 0,
          },
        });
      },

      refreshWorkspace: async () => {
        const project = get().project;
        if (!project) return;

        set({ syncState: { status: "reading", error: null } });

        try {
          const nextProject = await readProjectTree(project.path);
          const nextTabs = await Promise.all(
            get().tabs.map(async (tab) => {
              try {
                const file = await readProjectFile(tab.path);
                if (tab.dirty) {
                  return {
                    ...tab,
                    diskContent: file.content,
                    byteLength: file.byteLength,
                    binary: file.binary,
                    externalConflict: file.content !== tab.diskContent || tab.externalConflict,
                    missing: false,
                  };
                }

                return createTab(project.path, file, {
                  ...tab,
                  content: file.content,
                  dirty: false,
                });
              } catch {
                return { ...tab, missing: true };
              }
            }),
          );

          set({
            tree: nextProject.children,
            ignoredPatterns: nextProject.ignoredPatterns,
            tabs: nextTabs,
            project: { ...project, syncedAt: Date.now() },
            syncState: { status: "synced", error: null },
          });
        } catch (error) {
          const message = formatFileError(error, "刷新项目失败");
          console.error("[Itera] 刷新项目失败", { path: project.path, error });
          set({ syncState: { status: "failed", error: message } });
        }
      },

      toggleDirectory: (path) =>
        set((state) => ({
          expandedDirs: {
            ...state.expandedDirs,
            [path]: !state.expandedDirs[path],
          },
        })),

      openFile: async (path) => {
        const project = get().project;
        if (!project) return;

        const existing = get().tabs.find((tab) => tab.path === path);
        if (existing) {
          set({ activePath: path });
          return;
        }

        try {
          const file = await readProjectFile(path);
          const tab = createTab(project.path, file);
          set((state) => ({
            tabs: [...state.tabs, tab],
            activePath: path,
          }));
        } catch (error) {
          console.error("[Itera] 读取文件失败", { path, error });
          throw error;
        }
      },

      closeTab: (path) =>
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.path === path);
          const tabs = state.tabs.filter((tab) => tab.path !== path);
          const nextActive =
            state.activePath !== path
              ? state.activePath
              : (tabs[index]?.path ?? tabs[index - 1]?.path ?? null);

          return { tabs, activePath: nextActive };
        }),

      setActiveTab: (path) => set({ activePath: path }),

      updateTabContent: (path, content) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.path === path ? { ...tab, content, dirty: content !== tab.diskContent } : tab,
          ),
        })),

      updateTabCursor: (path, cursor) =>
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.path === path ? { ...tab, cursor } : tab)),
        })),

      updateTabScroll: (path, scrollTop) =>
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.path === path ? { ...tab, scrollTop } : tab)),
        })),

      saveFile: async (path = get().activePath ?? undefined) => {
        const tab = path ? get().tabs.find((item) => item.path === path) : undefined;
        if (!tab || tab.readOnly || !tab.dirty) return;

        try {
          await writeProjectFile(tab.path, tab.content);
          set((state) => ({
            tabs: state.tabs.map((item) =>
              item.path === tab.path
                ? {
                    ...item,
                    diskContent: item.content,
                    dirty: false,
                    externalConflict: false,
                    missing: false,
                  }
                : item,
            ),
            project: state.project ? { ...state.project, syncedAt: Date.now() } : null,
            syncState: { status: "synced", error: null },
          }));
        } catch (error) {
          const message = formatFileError(error, "保存文件失败");
          console.error("[Itera] 保存文件失败", { path: tab.path, error });
          set({ syncState: { status: "failed", error: message } });
          throw error;
        }
      },

      restoreFile: (path = get().activePath ?? undefined) => {
        if (!path) return;
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.path === path
              ? {
                  ...tab,
                  content: tab.diskContent,
                  dirty: false,
                  externalConflict: false,
                  missing: false,
                }
              : tab,
          ),
        }));
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarVisible: !state.sidebarVisible }));
      },

      resizeSidebar: (width) => set({ sidebarWidth: clampSidebar(width) }),

      openFind: () => set((state) => ({ findState: { ...state.findState, isOpen: true } })),

      closeFind: () =>
        set((state) => ({
          findState: {
            ...state.findState,
            isOpen: false,
            query: "",
            currentMatch: 0,
            totalMatches: 0,
          },
        })),

      setFindQuery: (query) =>
        set((state) => ({
          findState: { ...state.findState, query, currentMatch: 0 },
        })),

      setFindCaseSensitive: (caseSensitive) =>
        set((state) => ({
          findState: { ...state.findState, caseSensitive, currentMatch: 0 },
        })),

      setFindMatch: (currentMatch, totalMatches) =>
        set((state) => {
          if (
            state.findState.currentMatch === currentMatch &&
            state.findState.totalMatches === totalMatches
          ) {
            return state;
          }

          return {
            findState: { ...state.findState, currentMatch, totalMatches },
          };
        }),

      initialize: async () => {
        if (get().initialized) return;
        set({ initialized: true });

        const persistedProject = get().project;
        const recentProjects = await Promise.all(
          get().recentProjects.map(async (item) => ({
            ...item,
            available: await pathExists(item.path),
          })),
        );

        const lastPath = persistedProject?.path;
        const lastAvailable = lastPath ? await pathExists(lastPath) : false;
        set({
          recentProjects: lastAvailable
            ? recentProjects
            : recentProjects.filter((item) => item.path !== lastPath),
        });

        if (lastPath && lastAvailable) {
          await get().openProject(lastPath, true);
        } else {
          set({ project: null, tree: [], ignoredPatterns: [], tabs: [], activePath: null });
        }
      },
    }),
    {
      name: "itera-workspace",
      partialize: (state) => ({
        project: state.project,
        expandedDirs: state.expandedDirs,
        tabs: state.tabs,
        activePath: state.activePath,
        sidebarVisible: state.sidebarVisible,
        sidebarWidth: state.sidebarWidth,
        findState: {
          isOpen: false,
          query: "",
          caseSensitive: state.findState.caseSensitive,
          currentMatch: 0,
          totalMatches: 0,
        },
        recentProjects: state.recentProjects,
      }),
    },
  ),
);
