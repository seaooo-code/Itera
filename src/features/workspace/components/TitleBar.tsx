import { Button, Menu, MenuItem, MenuTrigger, Popover, Toolbar } from "react-aria-components";
import type { ProjectState, RecentProject, TabState } from "../store/types";
import { Icon } from "../../../shared/components/Icon";
import { shortPath } from "../../../shared/utils/path";
import { formatRelativeTime } from "../../../shared/utils/time";

const titlebarInsetClass = /Macintosh|Mac OS X/.test(navigator.userAgent)
  ? "pl-[78px] pr-3.5"
  : "px-3.5";

interface TitleBarProps {
  project: ProjectState | null;
  recentProjects: RecentProject[];
  activeTab: TabState | null;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  onChooseProject: () => void;
  onOpenRecent: (path: string) => void;
  onCloseProject: () => void;
  onSave: () => void;
}

export function TitleBar({
  project,
  recentProjects,
  activeTab,
  sidebarVisible,
  onToggleSidebar,
  onChooseProject,
  onOpenRecent,
  onCloseProject,
  onSave,
}: TitleBarProps) {
  const breadcrumbParts = activeTab?.relativePath.split("/") ?? [];

  return (
    <header
      data-tauri-drag-region
      className={`grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-center gap-4 select-none ${titlebarInsetClass}`}
    >
      <Toolbar
        data-tauri-drag-region
        aria-label="顶部操作"
        className="flex min-w-0 items-center gap-2.5"
      >
        <Button
          className={`grid h-7 w-7 place-items-center rounded-[7px] border outline-none transition hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55] ${sidebarVisible ? "border-[#b8dfc1] bg-[#eff9f1] text-[#347d4a]" : "border-transparent text-[#6c737c]"}`}
          aria-pressed={sidebarVisible}
          aria-label="显示或隐藏文件树"
          onPress={onToggleSidebar}
        >
          <Icon name="panel" />
        </Button>
        <span className="pointer-events-none flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-[#29303a] text-white">
            <Icon name="code" className="h-3 w-3" />
          </span>
          <span className="text-[12.5px] font-semibold tracking-[0.01em]">砚 Yan</span>
        </span>
        <MenuTrigger>
          <Button className="flex h-7 min-w-0 max-w-[260px] items-center gap-1.5 rounded-[7px] border border-transparent px-2 text-[12.5px] font-medium outline-none hover:border-[#dfe4e6] hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55]">
            <span className="truncate">{project?.name ?? "未打开项目"}</span>
            <Icon name="chevron-down" className="h-3 w-3 shrink-0 text-[#6c737c]" />
          </Button>
          <Popover
            placement="bottom start"
            className="w-[300px] rounded-[12px] border border-[#dfe4e6] bg-white p-1.5 shadow-[0_14px_34px_-12px_rgba(41,48,58,0.3)]"
          >
            <Menu
              aria-label="项目"
              onAction={(key) => {
                const action = String(key);
                if (action === "choose") onChooseProject();
                else if (action === "close") onCloseProject();
                else if (action.startsWith("recent:")) {
                  onOpenRecent(action.slice(7));
                }
              }}
            >
              <MenuItem
                id="recent-label"
                isDisabled
                className="px-2 py-1 font-mono text-[10.5px] tracking-[0.09em] text-[#7c848d] uppercase"
              >
                最近打开
              </MenuItem>
              {recentProjects.length ? (
                recentProjects.map((item) => (
                  <MenuItem
                    key={item.path}
                    id={`recent:${item.path}`}
                    isDisabled={!item.available}
                    className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 outline-none hover:bg-[#edf0f2] focus-visible:bg-[#eff9f1] disabled:opacity-50"
                  >
                    <Icon name="folder" className="h-4 w-4 shrink-0 text-[#6c737c]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px]">{item.name}</span>
                      <span className="block truncate font-mono text-[10.5px] text-[#7c848d]">
                        {shortPath(item.path)}
                      </span>
                    </span>
                    <span className="font-mono text-[10.5px] text-[#8b9299]">
                      {item.available ? formatRelativeTime(item.openedAt) : "不可用"}
                    </span>
                  </MenuItem>
                ))
              ) : (
                <MenuItem id="none" isDisabled className="px-2 py-1.5 text-[12px] text-[#8b9299]">
                  还没有最近项目
                </MenuItem>
              )}
              <MenuItem
                id="choose"
                className="mt-1 flex items-center justify-between rounded-[6px] border-t border-[#e7ebed] px-2 py-2 text-[12.5px] outline-none hover:bg-[#edf0f2] focus-visible:bg-[#eff9f1]"
              >
                <span>打开其他目录…</span>
                <span className="font-mono text-[10.5px] text-[#8b9299]">⌘O</span>
              </MenuItem>
              {project ? (
                <MenuItem
                  id="close"
                  className="flex rounded-[6px] px-2 py-1.5 text-[12.5px] outline-none hover:bg-[#edf0f2] focus-visible:bg-[#eff9f1]"
                >
                  关闭当前项目
                </MenuItem>
              ) : null}
            </Menu>
          </Popover>
        </MenuTrigger>
      </Toolbar>

      <p className="pointer-events-none flex min-w-0 items-center gap-1.5 font-mono text-[11.5px] text-[#6c737c]">
        {breadcrumbParts.length
          ? breadcrumbParts.slice(0, -1).map((part) => (
              <span key={part} className="min-w-0 truncate">
                {part} /
              </span>
            ))
          : null}
        {breadcrumbParts[breadcrumbParts.length - 1] ? (
          <b className="shrink-0 font-medium text-[#29303a]">
            {breadcrumbParts[breadcrumbParts.length - 1]}
          </b>
        ) : project ? (
          <span>{project.name}</span>
        ) : null}
        {activeTab?.dirty ? (
          <>
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#b67816]" />
            <span className="sr-only">未保存</span>
          </>
        ) : null}
      </p>

      <Toolbar
        data-tauri-drag-region
        aria-label="文件操作"
        className="flex min-w-0 items-center justify-end gap-1"
      >
        <Button
          className="flex h-7 items-center gap-1.5 rounded-[7px] border border-transparent px-2 text-[12px] text-[#6c737c] outline-none hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55] disabled:cursor-not-allowed disabled:opacity-45"
          isDisabled={!activeTab || activeTab.readOnly || !activeTab.dirty}
          aria-label="保存当前文件（⌘S）"
          onPress={onSave}
        >
          <Icon name="save" className="h-3.5 w-3.5" />
          <span>{activeTab?.dirty ? "保存" : activeTab ? "已保存" : "无可保存文件"}</span>
          <span className="font-mono text-[10.5px] opacity-80">⌘S</span>
        </Button>
      </Toolbar>
    </header>
  );
}
