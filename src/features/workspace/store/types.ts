import type { FileLanguage, FileTreeNode } from "../../../services/tauri/filesystem";

export interface ProjectState {
  path: string;
  name: string;
  syncedAt: number | null;
}

export interface RecentProject {
  path: string;
  name: string;
  openedAt: number;
  available: boolean;
}

export interface CursorState {
  anchor: number;
  head: number;
  line: number;
  column: number;
}

export interface TabState {
  path: string;
  relativePath: string;
  name: string;
  content: string;
  diskContent: string;
  dirty: boolean;
  cursor: CursorState;
  scrollTop: number;
  language: FileLanguage;
  readOnly: boolean;
  binary: boolean;
  byteLength: number;
  externalConflict: boolean;
  missing: boolean;
  diskNoticeDismissed: boolean;
}

export interface FindState {
  isOpen: boolean;
  query: string;
  caseSensitive: boolean;
  currentMatch: number;
  totalMatches: number;
}

export interface SyncState {
  status: "idle" | "reading" | "synced" | "failed";
  error: string | null;
}

export type TreeChangeKind = "added" | "reloaded";

export interface ExternalChangeSummary {
  occurredAt: number;
  added: string[];
  modified: string[];
  deleted: string[];
}

export interface WorkspaceState {
  project: ProjectState | null;
  tree: FileTreeNode[];
  treeChanges: Record<string, TreeChangeKind>;
  externalChangeSummary: ExternalChangeSummary | null;
  ignoredPatterns: string[];
  expandedDirs: Record<string, boolean>;
  tabs: TabState[];
  activePath: string | null;
  previewPath: string | null;
  sidebarVisible: boolean;
  sidebarWidth: number;
  findState: FindState;
  recentProjects: RecentProject[];
  syncState: SyncState;
  initialized: boolean;
}

export interface WorkspaceActions {
  chooseProject: () => Promise<void>;
  openProject: (path: string, restoreTabs?: boolean) => Promise<void>;
  closeProject: () => void;
  refreshWorkspace: () => Promise<void>;
  toggleDirectory: (path: string) => void;
  openFile: (path: string, options?: { preview?: boolean }) => Promise<void>;
  closeTab: (path: string) => void;
  setActiveTab: (path: string | null) => void;
  updateTabContent: (path: string, content: string) => void;
  updateTabCursor: (path: string, cursor: CursorState) => void;
  updateTabScroll: (path: string, scrollTop: number) => void;
  saveFile: (path?: string) => Promise<void>;
  restoreFile: (path?: string) => void;
  dismissDiskNotice: (path?: string) => void;
  dismissExternalChangeSummary: () => void;
  toggleSidebar: () => void;
  resizeSidebar: (width: number) => void;
  openFind: () => void;
  closeFind: () => void;
  setFindQuery: (query: string) => void;
  setFindCaseSensitive: (caseSensitive: boolean) => void;
  setFindMatch: (currentMatch: number, totalMatches: number) => void;
  initialize: () => Promise<void>;
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions;
