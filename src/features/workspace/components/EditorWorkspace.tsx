import { useEffect, useRef, type RefObject } from "react";
import { Button, Tab, TabList, Tabs } from "react-aria-components";
import { CodeEditor, type CodeEditorHandle } from "../../editor/components/CodeEditor";
import { fileExtension } from "../../../shared/utils/path";
import type { CursorState, FindState, TabState } from "../store/types";
import { Icon } from "../../../shared/components/Icon";
import { FindBar } from "./FindBar";

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
  activeTab: TabState | null;
  findState: FindState;
  editorRef: RefObject<CodeEditorHandle | null>;
  onSetActiveTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onPromoteTab: (path: string) => void;
  onOpenFind: () => void;
  onCloseFind: () => void;
  onSetFindQuery: (query: string) => void;
  onSetFindCaseSensitive: (value: boolean) => void;
  onFindMove: (direction: 1 | -1) => void;
  onRestoreFile: (path: string) => void;
  onUpdateContent: (path: string, content: string) => void;
  onUpdateCursor: (path: string, cursor: CursorState) => void;
  onUpdateScroll: (path: string, scrollTop: number) => void;
}

export function EditorWorkspace({
  tabs,
  activePath,
  previewPath,
  activeTab,
  findState,
  editorRef,
  onSetActiveTab,
  onCloseTab,
  onPromoteTab,
  onOpenFind,
  onCloseFind,
  onSetFindQuery,
  onSetFindCaseSensitive,
  onFindMove,
  onRestoreFile,
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
      if (
        target instanceof HTMLElement &&
        target.getAttribute("role") === "tab" &&
        (event.key === "Delete" || event.key === "Backspace") &&
        activePath
      ) {
        event.preventDefault();
        onCloseTab(activePath);
      }
    };

    tabList.addEventListener("keydown", handleKeyDown);
    return () => tabList.removeEventListener("keydown", handleKeyDown);
  }, [activePath, onCloseTab]);

  return (
    <section
      className="my-2 mr-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] bg-[var(--itera-color-surface)] shadow-[var(--itera-shadow-panel)]"
      aria-label="编辑器工作区"
    >
      <Tabs
        selectedKey={activePath ?? undefined}
        onSelectionChange={(key) => onSetActiveTab(String(key))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex h-[38px] shrink-0 items-center gap-[3px] bg-transparent px-1.5">
          <TabList
            ref={tabListRef}
            aria-label="打开的文件"
            className="flex min-w-0 flex-1 items-center gap-[3px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => {
              const isActive = tab.path === activePath;
              const diskState = tab.missing
                ? { glyph: "−", label: "已在磁盘上删除", tone: "danger" }
                : tab.externalConflict
                  ? { glyph: "!", label: "磁盘上已更改，与未保存修改冲突", tone: "warning" }
                  : null;

              return (
                <Tab
                  key={tab.path}
                  id={tab.path}
                  className={`group relative flex h-7 max-w-[212px] shrink-0 items-center gap-[7px] rounded-[7px] border border-transparent pl-[11px] text-[12.5px] text-[var(--itera-color-muted)] outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] focus-visible:ring-inset ${isActive ? "bg-[var(--itera-color-primary-soft)] font-medium text-[var(--itera-color-ink)] before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[var(--itera-color-primary)] hover:bg-[var(--itera-color-primary-soft-strong)]" : "hover:bg-[var(--itera-color-sunken)] hover:text-[var(--itera-color-ink)]"}`}
                  onDoubleClick={() => onPromoteTab(tab.path)}
                >
                  <TabFileBadge name={tab.name} />
                  <span
                    className={`min-w-0 flex-1 truncate ${tab.path === previewPath ? "italic" : ""} ${tab.missing ? "decoration-[1.5px] decoration-[var(--itera-color-danger)] line-through" : ""}`}
                  >
                    {tab.name}
                  </span>
                  {diskState ? (
                    <>
                      <span
                        aria-hidden="true"
                        className={`grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[4px] font-mono text-[11px] font-semibold leading-none ${diskState.tone === "danger" ? "bg-[var(--itera-color-danger-hover-soft)] text-[var(--itera-color-danger)]" : "bg-[var(--itera-color-warning-hover-soft)] text-[var(--itera-color-warning)]"}`}
                      >
                        {diskState.glyph}
                      </span>
                      <span className="sr-only">（{diskState.label}）</span>
                    </>
                  ) : null}
                  {tab.dirty ? <span className="sr-only">（未保存）</span> : null}
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
            isDisabled={!activeTab}
            className="mr-1.5 grid h-7 w-7 self-center place-items-center rounded-[6px] border border-transparent text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-40"
            aria-label="打开文件内查找（⌘F）"
            onPress={onOpenFind}
          >
            <Icon name="search" className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {activeTab ? (
            <div className="relative h-full">
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
              {activeTab.externalConflict ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b border-[var(--itera-color-warning-border)] bg-[var(--itera-color-warning-soft)] px-4 py-2 text-[12px] text-[var(--itera-color-warning)]"
                >
                  <Icon name="warning" className="h-3.5 w-3.5 shrink-0" />
                  磁盘上的文件已发生变化，本地未保存草稿仍被保留。保存会覆盖磁盘内容。
                  <Button
                    className="ml-auto text-[11px] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]"
                    onPress={() => onRestoreFile(activeTab.path)}
                  >
                    恢复磁盘版本
                  </Button>
                </div>
              ) : null}
              <div className={`h-full ${activeTab.externalConflict ? "pt-9" : ""}`}>
                <CodeEditor
                  ref={editorRef}
                  value={activeTab.content}
                  originalValue={activeTab.diskContent}
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
          ) : (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-[8px] border border-[var(--itera-color-border)] text-[var(--itera-color-subtle)]">
                  <Icon name="code" className="h-4 w-4" />
                </div>
                <h2 className="m-0 text-[13px] font-medium text-[var(--itera-color-ink)]">
                  还没有打开文件
                </h2>
                <p className="mb-0 mt-1.5 text-[12px] text-[var(--itera-color-subtle)]">
                  从左侧文件树选择一个文件开始编辑。
                </p>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </section>
  );
}
