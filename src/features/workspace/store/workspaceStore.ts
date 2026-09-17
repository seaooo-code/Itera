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
import type {
  CursorState,
  ExternalChangeSummary,
  TabState,
  TreeChangeKind,
  WorkspaceStore,
} from "./types";

export type {
  CursorState,
  EditorViewMode,
  ExternalChangeSummary,
  FindState,
  ProjectState,
  RecentProject,
  SyncState,
  TabState,
  TreeChangeKind,
  WorkspaceActions,
  WorkspaceState,
  WorkspaceStore,
} from "./types";

let stopWatching: (() => void) | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let treeChangeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingModifiedPaths = new Set<string>();
let ignoredWatchPaths = new Map<string, number>();

function watchEventKind(event: Parameters<Parameters<typeof watchProject>[1]>[0]) {
  if (event.type === "any") return "modified" as const;
  if (event.type === "other") return "structural" as const;
  if ("access" in event.type) return "ignored" as const;
  if ("create" in event.type || "remove" in event.type) return "structural" as const;
  if (event.type.modify.kind === "metadata") return "ignored" as const;
  if (event.type.modify.kind === "rename") return "structural" as const;
  return "modified" as const;
}

function shouldIgnoreWatchPath(path: string) {
  const expiresAt = ignoredWatchPaths.get(path);
  if (!expiresAt) return false;
  if (expiresAt > Date.now()) return true;
  ignoredWatchPaths.delete(path);
  return false;
}

function collectFilePaths(nodes: WorkspaceStore["tree"]) {
  const paths = new Set<string>();

  const visit = (items: WorkspaceStore["tree"]) => {
    for (const item of items) {
      if (item.type === "file") {
        paths.add(item.path);
      } else {
        visit(item.children ?? []);
      }
    }
  };

  visit(nodes);
  return paths;
}

function clearTreeChangeTimer() {
  if (!treeChangeTimer) return;
  clearTimeout(treeChangeTimer);
  treeChangeTimer = null;
}

function scheduleTreeChangeClear() {
  clearTreeChangeTimer();
  treeChangeTimer = setTimeout(() => {
    const state = useWorkspaceStore.getState();
    const needsAttention = state.tabs.some((tab) => tab.externalConflict || tab.missing);
    useWorkspaceStore.setState({
      treeChanges: {},
      externalChangeSummary: needsAttention ? state.externalChangeSummary : null,
    });
    treeChangeTimer = null;
  }, 5000);
}

function clampSidebar(width: number) {
  return Math.min(460, Math.max(196, Math.round(width)));
}

function clampTerminal(height: number) {
  return Math.min(420, Math.max(132, Math.round(height)));
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
    diskNoticeDismissed: draft?.diskNoticeDismissed ?? false,
  };
}

async function loadPersistedTabs(rootPath: string, drafts: TabState[]): Promise<TabState[]> {
  const loaded: TabState[] = [];

  for (const draft of drafts) {
    try {
      const file = await readProjectFile(draft.path);
      loaded.push(createTab(rootPath, file, draft));
    } catch {
      loaded.push({
        ...draft,
        dirty: true,
        missing: true,
        externalConflict: false,
        diskNoticeDismissed: draft.diskNoticeDismissed ?? false,
      });
    }
  }

  return loaded;
}

async function startWatching(rootPath: string) {
  stopWatching?.();
  pendingModifiedPaths = new Set<string>();
  ignoredWatchPaths = new Map<string, number>();
  stopWatching = await watchProject(rootPath, (event) => {
    const kind = watchEventKind(event);
    if (kind === "ignored") return;
    if (kind === "modified") {
      for (const path of event.paths) {
        if (!shouldIgnoreWatchPath(path)) pendingModifiedPaths.add(path);
      }
    }
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
      treeChanges: {},
      externalChangeSummary: null,
      ignoredPatterns: [],
      expandedDirs: {},
      tabs: [],
      activePath: null,
      previewPath: null,
      sidebarVisible: true,
      sidebarWidth: 264,
      terminalVisible: false,
      terminalHeight: 224,
      editorViewMode: "edit",
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
        clearTreeChangeTimer();
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
            treeChanges: {},
            externalChangeSummary: null,
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
        clearTreeChangeTimer();
        set({
          project: null,
          tree: [],
          treeChanges: {},
          externalChangeSummary: null,
          ignoredPatterns: [],
          tabs: [],
          activePath: null,
          previewPath: null,
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
          const previousFilePaths = collectFilePaths(get().tree);
          const nextProject = await readProjectTree(project.path);
          const nextFilePaths = collectFilePaths(nextProject.children);
          const treeChanges: Record<string, TreeChangeKind> = { ...get().treeChanges };
          const added = new Set<string>();
          const modified = new Set<string>();
          const deleted = new Set<string>();

          for (const path of nextFilePaths) {
            if (!previousFilePaths.has(path) && !shouldIgnoreWatchPath(path)) {
              added.add(path);
              treeChanges[path] = "added";
            }
          }
          for (const path of previousFilePaths) {
            if (!nextFilePaths.has(path)) deleted.add(path);
          }
          for (const path of pendingModifiedPaths) {
            if (nextFilePaths.has(path) && !added.has(path)) {
              modified.add(path);
              treeChanges[path] = "reloaded";
            }
          }
          pendingModifiedPaths = new Set<string>();

          const nextTabs = await Promise.all(
            get().tabs.map(async (tab) => {
              try {
                const file = await readProjectFile(tab.path);
                if (tab.dirty) {
                  if (file.content !== tab.diskContent) modified.add(tab.path);
                  return {
                    ...tab,
                    diskContent: file.content,
                    byteLength: file.byteLength,
                    binary: file.binary,
                    externalConflict: file.content !== tab.diskContent || tab.externalConflict,
                    missing: false,
                    diskNoticeDismissed:
                      file.content !== tab.diskContent ? false : tab.diskNoticeDismissed,
                  };
                }

                if (file.content !== tab.diskContent) {
                  modified.add(tab.path);
                  treeChanges[tab.path] = "reloaded";
                }

                return createTab(project.path, file, {
                  ...tab,
                  content: file.content,
                  dirty: false,
                });
              } catch {
                return {
                  ...tab,
                  dirty: true,
                  missing: true,
                  externalConflict: false,
                  diskNoticeDismissed: tab.missing ? tab.diskNoticeDismissed : false,
                };
              }
            }),
          );

          const hasNewTreeChanges = added.size + modified.size + deleted.size > 0;
          const externalChangeSummary: ExternalChangeSummary | null = hasNewTreeChanges
            ? {
                occurredAt: Date.now(),
                added: [...added],
                modified: [...modified],
                deleted: [...deleted],
              }
            : get().externalChangeSummary;

          set({
            tree: nextProject.children,
            treeChanges,
            externalChangeSummary,
            ignoredPatterns: nextProject.ignoredPatterns,
            tabs: nextTabs,
            project: { ...project, syncedAt: Date.now() },
            syncState: { status: "synced", error: null },
          });
          if (hasNewTreeChanges) scheduleTreeChangeClear();
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

      openFile: async (path, options) => {
        const project = get().project;
        if (!project) return;

        const preview = options?.preview ?? false;
        const existing = get().tabs.find((tab) => tab.path === path);

        if (existing) {
          set((state) => ({
            activePath: path,
            previewPath: !preview && state.previewPath === path ? null : state.previewPath,
          }));
          return;
        }

        try {
          const file = await readProjectFile(path);
          const tab = createTab(project.path, file);

          set((state) => {
            const previewTab = state.previewPath
              ? state.tabs.find((item) => item.path === state.previewPath)
              : undefined;

            if (preview && previewTab && !previewTab.dirty) {
              const tabs = state.tabs.map((item) => (item.path === previewTab.path ? tab : item));
              return { tabs, activePath: path, previewPath: path };
            }

            return {
              tabs: [...state.tabs, tab],
              activePath: path,
              previewPath: preview ? path : state.previewPath,
            };
          });
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
              : (tabs[index - 1]?.path ?? tabs[index]?.path ?? null);

          return {
            tabs,
            activePath: nextActive,
            previewPath: state.previewPath === path ? null : state.previewPath,
          };
        }),

      setActiveTab: (path) => set({ activePath: path }),

      updateTabContent: (path, content) =>
        set((state) => {
          const tab = state.tabs.find((item) => item.path === path);
          const dirty = tab ? tab.missing || content !== tab.diskContent : false;

          return {
            tabs: state.tabs.map((item) =>
              item.path === path ? { ...item, content, dirty } : item,
            ),
            previewPath: dirty && state.previewPath === path ? null : state.previewPath,
          };
        }),

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
          ignoredWatchPaths.set(tab.path, Date.now() + 2000);
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
                    diskNoticeDismissed: false,
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
                  diskNoticeDismissed: false,
                }
              : tab,
          ),
        }));
      },

      dismissDiskNotice: (path = get().activePath ?? undefined) => {
        if (!path) return;
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.path === path ? { ...tab, diskNoticeDismissed: true } : tab,
          ),
        }));
      },

      dismissExternalChangeSummary: () => set({ externalChangeSummary: null }),

      toggleSidebar: () => {
        set((state) => ({ sidebarVisible: !state.sidebarVisible }));
      },

      resizeSidebar: (width) => set({ sidebarWidth: clampSidebar(width) }),

      toggleTerminal: () => {
        if (!get().project) return;
        set((state) => ({ terminalVisible: !state.terminalVisible }));
      },

      setTerminalVisible: (terminalVisible) => set({ terminalVisible }),

      resizeTerminal: (height) => set({ terminalHeight: clampTerminal(height) }),

      setEditorViewMode: (editorViewMode) =>
        set((state) => ({
          editorViewMode,
          findState:
            editorViewMode === "preview"
              ? {
                  ...state.findState,
                  isOpen: false,
                  query: "",
                  currentMatch: 0,
                  totalMatches: 0,
                }
              : state.findState,
        })),

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
          set({
            project: null,
            tree: [],
            treeChanges: {},
            externalChangeSummary: null,
            ignoredPatterns: [],
            tabs: [],
            activePath: null,
            previewPath: null,
          });
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
        terminalVisible: state.terminalVisible,
        terminalHeight: state.terminalHeight,
        editorViewMode: state.editorViewMode,
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
