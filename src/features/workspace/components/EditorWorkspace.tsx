import type { RefObject } from "react";
import { Button, Tab, TabList, Tabs } from "react-aria-components";
import { CodeEditor, type CodeEditorHandle } from "../../editor/components/CodeEditor";
import type { CursorState, FindState, TabState } from "../store/types";
import { Icon } from "../../../shared/components/Icon";
import { FileIcon } from "./FileIcon";
import { FindBar } from "./FindBar";

interface EditorWorkspaceProps {
  tabs: TabState[];
  activePath: string | null;
  activeTab: TabState | null;
  findState: FindState;
  editorRef: RefObject<CodeEditorHandle | null>;
  onSetActiveTab: (path: string) => void;
  onCloseTab: (path: string) => void;
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
  activeTab,
  findState,
  editorRef,
  onSetActiveTab,
  onCloseTab,
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
            aria-label="打开的文件"
            className="flex min-w-0 flex-1 items-center gap-[3px] overflow-x-auto"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.path}
                id={tab.path}
                className={`group relative flex h-7 max-w-[212px] shrink-0 items-center gap-1.5 rounded-[7px] border border-transparent pl-[11px] pr-[5px] text-[12.5px] text-[var(--itera-color-muted)] outline-none transition hover:bg-[var(--itera-color-hover)] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] ${tab.path === activePath ? "bg-[var(--itera-color-primary-soft)] text-[var(--itera-color-ink)] before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-l-[7px] before:bg-[var(--itera-color-primary-border)]" : ""}`}
              >
                <FileIcon node={{ name: tab.name, path: tab.path, type: "file" }} />
                <span className="min-w-0 flex-1 truncate">{tab.name}</span>
                {tab.dirty ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--itera-color-warning)] group-hover:hidden"
                    />
                    <span className="sr-only">未保存</span>
                  </>
                ) : null}
                <Button
                  className="mr-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-[var(--itera-color-faint)] opacity-0 outline-none hover:bg-[var(--itera-color-press)] hover:text-[var(--itera-color-ink)] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] group-hover:opacity-100"
                  aria-label={`关闭 ${tab.name}`}
                  onClick={(event) => event.stopPropagation()}
                  onPress={() => onCloseTab(tab.path)}
                >
                  <Icon name="close" className="h-3 w-3" />
                </Button>
              </Tab>
            ))}
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
