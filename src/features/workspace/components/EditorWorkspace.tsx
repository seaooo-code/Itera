import { useEffect, useRef, type RefObject } from "react";
import { Button, Tab, TabList, Tabs } from "react-aria-components";
import { CodeEditor, type CodeEditorHandle } from "../../editor/components/CodeEditor";
import { fileExtension } from "../../../shared/utils/path";
import type {
  CursorState,
  EditorViewMode,
  FindState,
  TabState,
  TreeChangeKind,
} from "../store/types";
import { Icon } from "../../../shared/components/Icon";
import { FilePreview } from "./FilePreview";
import { FindBar } from "./FindBar";
import { TextFilePreview } from "./TextFilePreview";
import { isFileViewerPreviewSupported } from "./fileViewerSupport";

interface TabFileBadgeDefinition {
  label: string;
  tone: string;
}

function getTabFileBadge(name: string): TabFileBadgeDefinition {
  const extension = fileExtension(name);

  if (["ts", "tsx"].includes(extension)) {
    return {
      label: "TS",
      tone: "border-[color-mix(in_oklch,var(--itera-color-icon-typescript)_30%,var(--itera-color-border))] text-[var(--itera-color-icon-typescript)]",
    };
  }

  if (["js", "jsx", "mjs", "cjs"].includes(extension)) {
    return {
      label: "JS",
      tone: "border-[color-mix(in_oklch,var(--itera-color-icon-javascript)_30%,var(--itera-color-border))] text-[var(--itera-color-icon-javascript)]",
    };
  }

  if (["css", "scss", "sass", "less"].includes(extension)) {
    return {
      label: "CSS",
      tone: "border-[color-mix(in_oklch,var(--itera-color-icon-markdown)_30%,var(--itera-color-border))] text-[var(--itera-color-icon-markdown)]",
    };
  }

  if (["html", "htm"].includes(extension)) {
    return {
      label: "HTM",
      tone: "border-[color-mix(in_oklch,var(--itera-color-icon-markdown)_30%,var(--itera-color-border))] text-[var(--itera-color-icon-markdown)]",
    };
  }

  if (extension === "svg") {
    return {
      label: "SVG",
      tone: "border-[color-mix(in_oklch,var(--itera-color-icon-markdown)_30%,var(--itera-color-border))] text-[var(--itera-color-icon-markdown)]",
    };
  }

  if (extension === "json") return { label: "{ }", tone: "text-[var(--itera-color-muted)]" };
  if (["md", "markdown"].includes(extension)) {
    return { label: "MD", tone: "text-[var(--itera-color-muted)]" };
  }

  return { label: "TXT", tone: "text-[var(--itera-color-muted)]" };
}

function TabFileBadge({ name }: { name: string }) {
  const badge = getTabFileBadge(name);

  return (
    <span
      aria-hidden="true"
      className={`grid h-[15px] w-[18px] shrink-0 place-items-center rounded-[3px] border border-[var(--itera-color-border)] bg-[var(--itera-color-surface)] font-mono text-[8.5px] font-semibold leading-none ${badge.tone}`}
    >
      {badge.label}
    </span>
  );
}

interface EditorWorkspaceProps {
  tabs: TabState[];
  activePath: string | null;
  previewPath: string | null;
  previewRevision: number | null;
  treeChanges: Record<string, TreeChangeKind>;
  activeTab: TabState | null;
  editorViewMode: EditorViewMode;
  findState: FindState;
  editorRef: RefObject<CodeEditorHandle | null>;
  terminalVisible: boolean;
  onSetActiveTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onPromoteTab: (path: string) => void;
  onOpenFind: () => void;
  onCloseFind: () => void;
  onSetFindQuery: (query: string) => void;
  onSetFindCaseSensitive: (value: boolean) => void;
  onFindMove: (direction: 1 | -1) => void;
  onDismissDiskNotice: (path: string) => void;
  onUpdateContent: (path: string, content: string) => void;
  onUpdateCursor: (path: string, cursor: CursorState) => void;
  onUpdateScroll: (path: string, scrollTop: number) => void;
}

export function EditorWorkspace({
  tabs,
  activePath,
  previewPath,
  previewRevision,
  treeChanges,
  activeTab,
  editorViewMode,
  findState,
  editorRef,
  terminalVisible,
  onSetActiveTab,
  onCloseTab,
  onPromoteTab,
  onOpenFind,
  onCloseFind,
  onSetFindQuery,
  onSetFindCaseSensitive,
  onFindMove,
  onDismissDiskNotice,
  onUpdateContent,
  onUpdateCursor,
  onUpdateScroll,
}: EditorWorkspaceProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tabList = tabListRef.current;
    if (!tabList) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.getAttribute("role") !== "tab") return;
      if ((event.key === "Delete" || event.key === "Backspace") && activePath) {
        event.preventDefault();
        onCloseTab(activePath);
      } else if (event.key === "Enter" && activePath && activePath === previewPath) {
        event.preventDefault();
        onPromoteTab(activePath);
      }
    };

    tabList.addEventListener("keydown", handleKeyDown);
    return () => tabList.removeEventListener("keydown", handleKeyDown);
  }, [activePath, onCloseTab, onPromoteTab, previewPath]);

  const showDiskNotice =
    activeTab &&
    !activeTab.diskNoticeDismissed &&
    (activeTab.externalConflict || activeTab.missing);
  const supportsFilePreview = Boolean(activeTab && isFileViewerPreviewSupported(activeTab.name));
  const activeViewMode = !supportsFilePreview
    ? "edit"
    : activeTab?.binary
      ? "preview"
      : editorViewMode;
  const showEditor = activeViewMode !== "preview";
  const showPreview = supportsFilePreview && activeViewMode !== "edit";

  return (
    <section
      className={`mr-2 mt-2 flex min-h-0 min-w-0 flex-1 overflow-hidden ${terminalVisible ? "mb-0" : "mb-2"} ${showEditor && showPreview ? "gap-2" : "rounded-[9px] bg-[var(--itera-color-surface)] shadow-[var(--itera-shadow-panel)]"}`}
      aria-label="编辑器工作区"
    >
      <Tabs
        selectedKey={activePath ?? undefined}
        onSelectionChange={(key) => onSetActiveTab(String(key))}
        className={`flex min-h-0 min-w-0 flex-col overflow-hidden ${showEditor && showPreview ? "basis-[56%] rounded-[9px] bg-[var(--itera-color-surface)] shadow-[var(--itera-shadow-panel)]" : "flex-1"}`}
      >
        <div className="flex h-[38px] shrink-0 items-center gap-[3px] bg-transparent px-1.5">
          <TabList
            ref={tabListRef}
            aria-label="打开的文件"
            className="flex min-w-0 flex-1 items-center gap-[3px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => {
              const isActive = tab.path === activePath;
              const isPreview = tab.path === previewPath;
              const diskState = tab.missing
                ? { glyph: "−", label: "已在磁盘上删除", tone: "danger" }
                : tab.externalConflict
                  ? { glyph: "!", label: "磁盘上已更改，与未保存修改冲突", tone: "warning" }
                  : treeChanges[tab.path] === "reloaded"
                    ? { glyph: "~", label: "外部已修改，已重新载入", tone: "neutral" }
                    : null;
              return (
                <Tab
                  key={tab.path}
                  id={tab.path}
                  className={`group relative flex h-7 max-w-[212px] shrink-0 select-none items-center gap-[7px] rounded-[7px] border border-transparent pl-[11px] text-[12.5px] text-[var(--itera-color-muted)] outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] focus-visible:ring-inset ${isActive ? "bg-[var(--itera-color-primary-soft)] font-medium text-[var(--itera-color-ink)] hover:bg-[var(--itera-color-primary-soft-strong)]" : "hover:bg-[var(--itera-color-sunken)] hover:text-[var(--itera-color-ink)]"}`}
                  onDoubleClick={() => onPromoteTab(tab.path)}
                >
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute left-0 w-0.5 ${isPreview ? "inset-y-[6px]" : "inset-y-0 bg-[var(--itera-color-primary)]"}`}
                    >
                      {isPreview ? (
                        <>
                          <i className="absolute inset-x-0 top-0 h-1 bg-[var(--itera-color-primary)]" />
                          <i className="absolute inset-x-0 bottom-0 h-1 bg-[var(--itera-color-primary)]" />
                        </>
                      ) : null}
                    </span>
                  ) : null}
                  <TabFileBadge name={tab.name} />
                  <span
                    className={`min-w-0 flex-1 truncate ${isPreview ? "italic" : ""} ${tab.missing ? "decoration-[1.5px] decoration-[var(--itera-color-danger)] line-through" : ""}`}
                  >
                    {tab.name}
                  </span>
                  {diskState ? (
                    <>
                      <span
                        aria-hidden="true"
                        className={`grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[4px] font-mono text-[11px] font-semibold leading-none ${diskState.tone === "danger" ? "bg-[var(--itera-color-danger-hover-soft)] text-[var(--itera-color-danger)]" : diskState.tone === "warning" ? "bg-[var(--itera-color-warning-hover-soft)] text-[var(--itera-color-warning)]" : "text-[var(--itera-color-muted)]"}`}
                      >
                        {diskState.glyph}
                      </span>
                      <span className="sr-only">（{diskState.label}）</span>
                    </>
                  ) : null}
                  {tab.dirty ? <span className="sr-only">（未保存）</span> : null}
                  {isPreview ? <span className="sr-only">（预览态，双击或按回车固定）</span> : null}
                  <span className="relative mr-[5px] grid h-5 w-5 shrink-0 place-items-center">
                    <Button
                      className={`peer relative grid h-5 w-5 place-items-center rounded-[5px] text-[var(--itera-color-muted)] outline-none before:absolute before:-inset-0.5 hover:text-[var(--itera-color-ink)] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] focus-visible:ring-inset group-hover:opacity-100 ${isActive ? "hover:bg-[var(--itera-color-primary-soft-strong)]" : "hover:bg-[var(--itera-color-press)]"} ${tab.dirty ? "opacity-0" : "opacity-100"}`}
                      aria-label={`关闭 ${tab.name}（⌘W）`}
                      onClick={(event) => event.stopPropagation()}
                      onPress={() => onCloseTab(tab.path)}
                    >
                      <Icon name="close" className="h-[9px] w-[9px]" />
                    </Button>
                    {tab.dirty ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute h-[7px] w-[7px] rounded-full bg-[var(--itera-color-warning-marker)] transition-opacity group-hover:opacity-0 peer-focus-visible:opacity-0"
                      />
                    ) : null}
                  </span>
                </Tab>
              );
            })}
          </TabList>
          <Button
            isDisabled={!activeTab || activeTab.binary || !showEditor}
            className="mr-1.5 grid h-7 w-7 self-center place-items-center rounded-[6px] border border-transparent text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-40"
            aria-label="打开文件内查找（⌘F）"
            onPress={onOpenFind}
          >
            <Icon name="search" className="h-3.5 w-3.5" />
          </Button>
        </div>
        {showDiskNotice ? (
          <div
            role="status"
            aria-live="polite"
            className={`flex min-h-[33px] shrink-0 items-center gap-[9px] px-2 py-[7px] pl-3 text-[12px] leading-[1.6] ${activeTab.missing ? "bg-[var(--itera-color-danger-soft)] text-[var(--itera-color-danger)]" : "bg-[var(--itera-color-warning-soft)] text-[var(--itera-color-warning)]"}`}
          >
            <span
              aria-hidden="true"
              className={`grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[4px] font-mono text-[11px] font-semibold ${activeTab.missing ? "bg-[var(--itera-color-danger-hover-soft)]" : "bg-[var(--itera-color-warning-hover-soft)]"}`}
            >
              {activeTab.missing ? "−" : "!"}
            </span>
            <span className="min-w-0 flex-1">
              <b className="font-mono font-semibold">{activeTab.name}</b>{" "}
              {activeTab.missing
                ? "已从磁盘上删除。编辑器中的内容仍然保留，⌘S 会把它重新写回。"
                : "在磁盘上已更改。你的未保存修改仍保留在编辑器中，没有被覆盖。"}
            </span>
            <Button
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset ${activeTab.missing ? "hover:bg-[var(--itera-color-danger-hover-soft)]" : "hover:bg-[var(--itera-color-warning-hover-soft)]"}`}
              aria-label="收起磁盘状态提示"
              onPress={() => {
                onDismissDiskNotice(activeTab.path);
                queueMicrotask(() => editorRef.current?.focus());
              }}
            >
              <Icon name="close" className="h-2.5 w-2.5" />
            </Button>
          </div>
        ) : null}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {showEditor ? (
            activeTab ? (
              <div className="relative h-full">
                {activeTab.binary ? (
                  <FilePreview
                    key={`${activeTab.path}:${previewRevision ?? 0}`}
                    path={activeTab.path}
                    name={activeTab.name}
                    byteLength={activeTab.byteLength}
                  />
                ) : (
                  <div className="relative h-full min-w-0">
                    <FindBar
                      isOpen={findState.isOpen}
                      query={findState.query}
                      caseSensitive={findState.caseSensitive}
                      currentMatch={findState.currentMatch}
                      totalMatches={findState.totalMatches}
                      onQueryChange={onSetFindQuery}
                      onCaseSensitiveChange={onSetFindCaseSensitive}
                      onMove={onFindMove}
                      onClose={onCloseFind}
                    />
                    <div className="h-full">
                      <CodeEditor
                        ref={editorRef}
                        value={activeTab.content}
                        originalValue={
                          activeTab.missing ? activeTab.content : activeTab.diskContent
                        }
                        onChange={(content) => onUpdateContent(activeTab.path, content)}
                        language={activeTab.language}
                        readOnly={activeTab.readOnly}
                        cursor={activeTab.cursor}
                        scrollTop={activeTab.scrollTop}
                        searchQuery={findState.query}
                        searchCaseSensitive={findState.caseSensitive}
                        onCursorChange={(cursor) => onUpdateCursor(activeTab.path, cursor)}
                        onScrollChange={(scrollTop) => onUpdateScroll(activeTab.path, scrollTop)}
                        ariaLabel={`${activeTab.name} 编辑器`}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid h-full place-items-center px-6 text-center">
                <div>
                  <div className="mx-auto grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-[var(--itera-color-sunken)] text-[var(--itera-color-muted)]">
                    <Icon name="code" className="h-[18px] w-[18px]" />
                  </div>
                  <h2 className="mb-0 mt-3.5 text-[14px] font-semibold text-[var(--itera-color-ink)]">
                    当前没有打开的文件
                  </h2>
                  <p className="mx-auto mb-0 mt-[7px] max-w-[40ch] text-[12.5px] leading-[1.7] text-[var(--itera-color-muted)]">
                    单击文件树中的文件即可预览，双击固定为常驻 Tab。固定的 Tab 会保留到下次启动。
                  </p>
                  <div className="mt-[18px] flex justify-center gap-[18px]">
                    {[
                      ["⌘O", "打开项目"],
                      ["⇧⏎", "在文件树中直接固定"],
                      ["⌘B", "显示 / 隐藏文件树"],
                    ].map(([key, label]) => (
                      <div key={key} className="grid justify-items-center gap-1">
                        <kbd className="rounded-[5px] bg-[var(--itera-color-sunken)] px-[7px] py-[3px] font-mono text-[11px] text-[var(--itera-color-ink)]">
                          {key}
                        </kbd>
                        <span className="text-[11.5px] text-[var(--itera-color-muted)]">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : activeTab ? (
            <div className="h-full min-w-0">
              {activeTab.binary ? (
                <FilePreview
                  key={`${activeTab.path}:${previewRevision ?? 0}`}
                  path={activeTab.path}
                  name={activeTab.name}
                  byteLength={activeTab.byteLength}
                />
              ) : (
                <TextFilePreview
                  key={activeTab.path}
                  name={activeTab.name}
                  content={activeTab.content}
                />
              )}
            </div>
          ) : null}
        </div>
      </Tabs>
      {showEditor && showPreview && activeTab ? (
        <section
          className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[9px] bg-[var(--itera-color-surface)] shadow-[var(--itera-shadow-panel)] ${showEditor ? "basis-[44%]" : "flex-1"}`}
          aria-label={`${activeTab.name} 文件预览`}
        >
          <div className="flex h-[38px] shrink-0 items-center gap-[7px] px-1.5 pl-[11px]">
            <TabFileBadge name={activeTab.name} />
            <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--itera-color-ink)]">
              {activeTab.name}
            </span>
          </div>
          <div className="min-h-0 flex-1">
            {activeTab.binary ? (
              <FilePreview
                key={`${activeTab.path}:${previewRevision ?? 0}`}
                path={activeTab.path}
                name={activeTab.name}
                byteLength={activeTab.byteLength}
              />
            ) : (
              <TextFilePreview
                key={activeTab.path}
                name={activeTab.name}
                content={activeTab.content}
              />
            )}
          </div>
        </section>
      ) : null}
    </section>
  );
}
