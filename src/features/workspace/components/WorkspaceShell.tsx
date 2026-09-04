import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { CodeEditorHandle } from "../../editor/components/CodeEditor";
import { formatFileError } from "../../../services/tauri/filesystem";
import { getDirtyPathState, selectActiveTab } from "../store/selectors";
import { useWorkspaceStore } from "../store/workspaceStore";
import { ConfirmDialog } from "./ConfirmDialog";
import { EditorWorkspace } from "./EditorWorkspace";
import { StatusBar } from "./StatusBar";
import { TitleBar } from "./TitleBar";
import type { ConfirmState, ToastState } from "./viewTypes";
import { Welcome } from "./Welcome";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function WorkspaceShell() {
  const project = useWorkspaceStore((state) => state.project);
  const tree = useWorkspaceStore((state) => state.tree);
  const ignoredPatterns = useWorkspaceStore((state) => state.ignoredPatterns);
  const expandedDirs = useWorkspaceStore((state) => state.expandedDirs);
  const tabs = useWorkspaceStore((state) => state.tabs);
  const activePath = useWorkspaceStore((state) => state.activePath);
  const previewPath = useWorkspaceStore((state) => state.previewPath);
  const sidebarVisible = useWorkspaceStore((state) => state.sidebarVisible);
  const sidebarWidth = useWorkspaceStore((state) => state.sidebarWidth);
  const findState = useWorkspaceStore((state) => state.findState);
  const recentProjects = useWorkspaceStore((state) => state.recentProjects);
  const syncState = useWorkspaceStore((state) => state.syncState);
  const chooseProject = useWorkspaceStore((state) => state.chooseProject);
  const openProject = useWorkspaceStore((state) => state.openProject);
  const closeProject = useWorkspaceStore((state) => state.closeProject);
  const refreshWorkspace = useWorkspaceStore((state) => state.refreshWorkspace);
  const toggleDirectory = useWorkspaceStore((state) => state.toggleDirectory);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const closeTab = useWorkspaceStore((state) => state.closeTab);
  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab);
  const updateTabContent = useWorkspaceStore((state) => state.updateTabContent);
  const updateTabCursor = useWorkspaceStore((state) => state.updateTabCursor);
  const updateTabScroll = useWorkspaceStore((state) => state.updateTabScroll);
  const saveFile = useWorkspaceStore((state) => state.saveFile);
  const restoreFile = useWorkspaceStore((state) => state.restoreFile);
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar);
  const resizeSidebar = useWorkspaceStore((state) => state.resizeSidebar);
  const openFind = useWorkspaceStore((state) => state.openFind);
  const closeFind = useWorkspaceStore((state) => state.closeFind);
  const setFindQuery = useWorkspaceStore((state) => state.setFindQuery);
  const setFindCaseSensitive = useWorkspaceStore((state) => state.setFindCaseSensitive);
  const setFindMatch = useWorkspaceStore((state) => state.setFindMatch);
  const initialize = useWorkspaceStore((state) => state.initialize);

  const activeTab = useWorkspaceStore(selectActiveTab);
  const editorRef = useRef<CodeEditorHandle | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const dirtyPaths = useMemo(() => getDirtyPathState(tabs), [tabs]);

  const showToast = useCallback(
    (message: string, tone: ToastState["tone"] = "neutral", detail?: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message, tone, detail });
      toastTimer.current = setTimeout(() => setToast(null), 3200);
    },
    [],
  );

  useEffect(() => {
    void initialize().catch((error: unknown) => {
      showToast(formatFileError(error, "恢复上次项目失败"), "error");
    });
  }, [initialize, showToast]);

  useEffect(() => {
    const query = findState.query;
    if (!activeTab || !query) {
      setFindMatch(0, 0);
      return;
    }

    const haystack = findState.caseSensitive ? activeTab.content : activeTab.content.toLowerCase();
    const needle = findState.caseSensitive ? query : query.toLowerCase();
    let from = 0;
    let total = 0;
    while (true) {
      const index = haystack.indexOf(needle, from);
      if (index < 0) break;
      total += 1;
      from = index + Math.max(1, needle.length);
    }
    setFindMatch(Math.min(findState.currentMatch, Math.max(0, total - 1)), total);
  }, [activeTab, findState.caseSensitive, findState.currentMatch, findState.query, setFindMatch]);

  const runAction = useCallback(
    async (action: () => Promise<void>, errorMessage: string) => {
      try {
        await action();
      } catch (error) {
        const detail = formatFileError(error, errorMessage);
        console.error("[Itera] 操作失败", { errorMessage, error });
        showToast(errorMessage, "error", detail === errorMessage ? undefined : detail);
      }
    },
    [showToast],
  );

  const requestWithDirtyCheck = useCallback(
    (title: string, message: string, action: () => void | Promise<void>) => {
      const dirtyTabs = tabs.filter((tab) => tab.dirty);
      if (dirtyTabs.length) {
        setConfirmState({
          title,
          message,
          dirtyPaths: dirtyTabs.map((tab) => tab.relativePath),
          savePaths: dirtyTabs.map((tab) => tab.path),
          action,
        });
        return;
      }
      void Promise.resolve(action()).catch((error: unknown) => {
        console.error("[Itera] 操作失败", { error });
        showToast(formatFileError(error, "操作失败"), "error");
      });
    },
    [showToast, tabs],
  );

  const handleChooseProject = useCallback(() => {
    requestWithDirtyCheck(
      "切换本地项目？",
      "当前项目仍有未保存修改。切换前请选择如何处理这些文件。",
      () => runAction(chooseProject, "打开项目失败"),
    );
  }, [chooseProject, requestWithDirtyCheck, runAction]);

  const handleOpenRecent = useCallback(
    (path: string) => {
      const item = recentProjects.find((recent) => recent.path === path);
      if (item && !item.available) {
        showToast("这个最近项目目录已不可用。", "error");
        return;
      }
      requestWithDirtyCheck(
        "切换本地项目？",
        "当前项目仍有未保存修改。切换前请选择如何处理这些文件。",
        () => runAction(() => openProject(path), "打开项目失败"),
      );
    },
    [openProject, recentProjects, requestWithDirtyCheck, runAction, showToast],
  );

  const handleCloseProject = useCallback(() => {
    requestWithDirtyCheck(
      "关闭当前项目？",
      "关闭项目不会删除文件，但会结束当前目录的监听。",
      closeProject,
    );
  }, [closeProject, requestWithDirtyCheck]);

  const handleOpenFile = useCallback(
    (path: string, options?: { preview?: boolean }) => {
      void runAction(() => openFile(path, options), "读取文件失败");
    },
    [openFile, runAction],
  );

  const handleCloseTab = useCallback(
    (path: string) => {
      const tab = tabs.find((item) => item.path === path);
      if (!tab?.dirty) {
        closeTab(path);
        return;
      }
      setConfirmState({
        title: "关闭未保存文件？",
        message: `如果不保存，${tab.relativePath} 中的修改将丢失。`,
        dirtyPaths: [tab.relativePath],
        savePaths: [tab.path],
        action: () => closeTab(path),
      });
    },
    [closeTab, tabs],
  );

  const handleSave = useCallback(() => {
    if (!activeTab || activeTab.readOnly) return;
    void saveFile(activeTab.path)
      .then(() => showToast(`已保存 ${activeTab.relativePath}`, "success"))
      .catch((error: unknown) => {
        showToast(formatFileError(error, "保存文件失败"), "error");
      });
  }, [activeTab, saveFile, showToast]);

  const handleConfirmSave = useCallback(async () => {
    if (!confirmState) return;
    setConfirmBusy(true);
    try {
      for (const tab of tabs.filter(
        (item) => item.dirty && confirmState.savePaths.includes(item.path),
      )) {
        await saveFile(tab.path);
      }
      const action = confirmState.action;
      setConfirmState(null);
      await action();
    } catch (error) {
      showToast(formatFileError(error, "保存文件失败"), "error");
    } finally {
      setConfirmBusy(false);
    }
  }, [confirmState, saveFile, showToast, tabs]);

  const handleConfirmDiscard = useCallback(() => {
    if (!confirmState) return;
    const action = confirmState.action;
    setConfirmState(null);
    void Promise.resolve(action()).catch((error: unknown) => {
      showToast(formatFileError(error, "操作失败"), "error");
    });
  }, [confirmState, showToast]);

  const handleFindMove = useCallback(
    (direction: 1 | -1) => {
      const result = editorRef.current?.findNext(
        findState.query,
        findState.caseSensitive,
        direction,
      );
      if (result) setFindMatch(result.index, result.total);
    },
    [findState.caseSensitive, findState.query, setFindMatch],
  );

  const onCancelConfirm = useCallback(() => setConfirmState(null), []);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "o") {
        event.preventDefault();
        handleChooseProject();
      } else if (modifier && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
      } else if (modifier && event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (activeTab) openFind();
      } else if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      } else if (modifier && event.key.toLowerCase() === "w") {
        event.preventDefault();
        if (activeTab) handleCloseTab(activeTab.path);
      } else if (event.key === "Escape") {
        if (confirmState) onCancelConfirm();
        else if (findState.isOpen) closeFind();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [
    activeTab,
    closeFind,
    confirmState,
    findState.isOpen,
    handleChooseProject,
    handleCloseTab,
    handleSave,
    onCancelConfirm,
    openFind,
    toggleSidebar,
  ]);

  const handleResizeStart = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = sidebarWidth;
      const update = (moveEvent: globalThis.PointerEvent) =>
        resizeSidebar(startWidth + moveEvent.clientX - startX);
      const stop = () => {
        window.removeEventListener("pointermove", update);
        window.removeEventListener("pointerup", stop);
      };
      window.addEventListener("pointermove", update);
      window.addEventListener("pointerup", stop, { once: true });
    },
    [resizeSidebar, sidebarWidth],
  );

  const statusText =
    syncState.status === "reading"
      ? "读取中"
      : syncState.status === "failed"
        ? "同步失败"
        : project
          ? "已同步"
          : "未打开项目";
  const lineSelection = activeTab ? Math.abs(activeTab.cursor.head - activeTab.cursor.anchor) : 0;

  return (
    <main className="h-full w-full overflow-auto bg-[var(--itera-color-sunken)] text-[var(--itera-color-ink)]">
      <section
        className="grid h-full min-w-[320px] w-full grid-rows-[46px_minmax(0,1fr)_28px] overflow-hidden bg-[var(--itera-color-sunken)]"
        aria-label="砚 Yan 个人桌面 IDE"
      >
        <TitleBar
          project={project}
          recentProjects={recentProjects}
          activeTab={activeTab}
          sidebarVisible={sidebarVisible}
          onToggleSidebar={toggleSidebar}
          onChooseProject={handleChooseProject}
          onOpenRecent={handleOpenRecent}
          onCloseProject={handleCloseProject}
          onSave={handleSave}
        />

        {!project ? (
          <Welcome
            recentProjects={recentProjects}
            onChooseProject={handleChooseProject}
            onOpenRecent={handleOpenRecent}
          />
        ) : (
          <div className="flex min-h-0 overflow-hidden">
            {sidebarVisible ? (
              <WorkspaceSidebar
                tree={tree}
                ignoredPatterns={ignoredPatterns}
                expandedDirs={expandedDirs}
                activePath={activePath}
                dirtyFiles={dirtyPaths.files}
                dirtyDirectories={dirtyPaths.directories}
                sidebarWidth={sidebarWidth}
                syncStatus={syncState.status}
                statusText={statusText}
                onOpenFile={handleOpenFile}
                onToggleDirectory={toggleDirectory}
                onRefresh={() => void runAction(refreshWorkspace, "刷新项目失败")}
                onResizeStart={handleResizeStart}
                onResize={resizeSidebar}
              />
            ) : null}
            <EditorWorkspace
              tabs={tabs}
              activePath={activePath}
              previewPath={previewPath}
              activeTab={activeTab}
              findState={findState}
              editorRef={editorRef}
              onSetActiveTab={setActiveTab}
              onCloseTab={handleCloseTab}
              onPromoteTab={(path) => handleOpenFile(path, { preview: false })}
              onOpenFind={openFind}
              onCloseFind={closeFind}
              onSetFindQuery={setFindQuery}
              onSetFindCaseSensitive={setFindCaseSensitive}
              onFindMove={handleFindMove}
              onRestoreFile={restoreFile}
              onUpdateContent={updateTabContent}
              onUpdateCursor={updateTabCursor}
              onUpdateScroll={updateTabScroll}
            />
          </div>
        )}

        <StatusBar
          project={project}
          activeTab={activeTab}
          syncState={syncState}
          lineSelection={lineSelection}
          onOpenFind={openFind}
        />

        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className={`absolute bottom-[46px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] shadow-[var(--itera-shadow-toast)] ${toast.tone === "error" ? "border-[var(--itera-color-danger-border)] bg-[var(--itera-color-danger-soft)] text-[var(--itera-color-danger)]" : toast.tone === "success" ? "border-[var(--itera-color-primary-border)] bg-[var(--itera-color-primary-soft)] text-[var(--itera-color-primary-ink)]" : "border-[var(--itera-color-border)] bg-[var(--itera-color-surface)] text-[var(--itera-color-ink)]"}`}
          >
            <span>{toast.message}</span>
            {toast.detail ? (
              <span className="font-mono text-[11px] text-[var(--itera-color-subtle)]">
                {toast.detail}
              </span>
            ) : null}
          </div>
        ) : null}
        <ConfirmDialog
          state={confirmState}
          busy={confirmBusy}
          onSave={() => void handleConfirmSave()}
          onDiscard={handleConfirmDiscard}
          onCancel={onCancelConfirm}
        />
      </section>
    </main>
  );
}
