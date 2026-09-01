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
      className="my-2 mr-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_1px_2px_-1px_rgba(41,48,58,0.14),0_10px_24px_-16px_rgba(41,48,58,0.26)]"
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
                className={`group relative flex h-7 max-w-[212px] shrink-0 items-center gap-1.5 rounded-[7px] border border-transparent pl-[11px] pr-[5px] text-[12.5px] text-[#6c737c] outline-none transition hover:bg-[#f0f2f3] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[#3c8f55] ${tab.path === activePath ? "bg-[#eff9f1] text-[#29303a] before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-l-[7px] before:bg-[#83c88f]" : ""}`}
              >
                <FileIcon node={{ name: tab.name, path: tab.path, type: "file" }} />
                <span className="min-w-0 flex-1 truncate">{tab.name}</span>
                {tab.dirty ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#b67816] group-hover:hidden"
                    />
                    <span className="sr-only">未保存</span>
                  </>
                ) : null}
                <Button
                  className="mr-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-[#8b9299] opacity-0 outline-none hover:bg-[#e1e4e6] hover:text-[#29303a] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#3c8f55] group-hover:opacity-100"
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
            className="mr-1.5 grid h-7 w-7 self-center place-items-center rounded-[6px] border border-transparent text-[#6c737c] outline-none hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55] disabled:opacity-40"
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
                  className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b border-[#ead9ae] bg-[#fff8e8] px-4 py-2 text-[12px] text-[#805a16]"
                >
                  <Icon name="warning" className="h-3.5 w-3.5 shrink-0" />
                  磁盘上的文件已发生变化，本地未保存草稿仍被保留。保存会覆盖磁盘内容。
                  <Button
                    className="ml-auto text-[11px] underline outline-none focus-visible:ring-2 focus-visible:ring-[#3c8f55]"
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
                <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-[8px] border border-[#dfe4e6] text-[#7c848d]">
                  <Icon name="code" className="h-4 w-4" />
                </div>
                <h2 className="m-0 text-[13px] font-medium text-[#29303a]">还没有打开文件</h2>
                <p className="mb-0 mt-1.5 text-[12px] text-[#7c848d]">
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
