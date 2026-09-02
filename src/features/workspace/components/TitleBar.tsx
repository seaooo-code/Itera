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
          className={`grid h-7 w-7 place-items-center rounded-[7px] border outline-none transition hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] ${sidebarVisible ? "border-[var(--itera-color-primary-border)] bg-[var(--itera-color-primary-soft)] text-[var(--itera-color-primary-ink)]" : "border-transparent text-[var(--itera-color-muted)]"}`}
          aria-pressed={sidebarVisible}
          aria-label="显示或隐藏文件树"
          onPress={onToggleSidebar}
        >
          <Icon name="panel" />
        </Button>
        <span className="pointer-events-none flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-[var(--itera-color-ink)] text-white">
            <Icon name="code" className="h-3 w-3" />
          </span>
          <span className="text-[12.5px] font-semibold tracking-[0.01em]">砚 Yan</span>
        </span>
        <MenuTrigger>
          <Button className="flex h-7 min-w-0 max-w-[260px] items-center gap-1.5 rounded-[7px] border border-transparent px-2 text-[12.5px] font-medium outline-none hover:border-[var(--itera-color-border)] hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]">
            <span className="truncate">{project?.name ?? "未打开项目"}</span>
            <Icon
              name="chevron-down"
              className="h-3 w-3 shrink-0 text-[var(--itera-color-muted)]"
            />
          </Button>
          <Popover
            placement="bottom start"
            className="w-[300px] rounded-[12px] border border-[var(--itera-color-border)] bg-[var(--itera-color-surface)] p-1.5 shadow-[var(--itera-shadow-popover)]"
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
                className="px-2 py-1 font-mono text-[10.5px] tracking-[0.09em] text-[var(--itera-color-subtle)] uppercase"
              >
                最近打开
              </MenuItem>
              {recentProjects.length ? (
                recentProjects.map((item) => (
                  <MenuItem
                    key={item.path}
                    id={`recent:${item.path}`}
                    isDisabled={!item.available}
                    className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 outline-none hover:bg-[var(--itera-color-hover)] focus-visible:bg-[var(--itera-color-primary-soft)] disabled:opacity-50"
                  >
                    <Icon
                      name="folder"
                      className="h-4 w-4 shrink-0 text-[var(--itera-color-muted)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px]">{item.name}</span>
                      <span className="block truncate font-mono text-[10.5px] text-[var(--itera-color-subtle)]">
                        {shortPath(item.path)}
                      </span>
                    </span>
                    <span className="font-mono text-[10.5px] text-[var(--itera-color-faint)]">
                      {item.available ? formatRelativeTime(item.openedAt) : "不可用"}
                    </span>
                  </MenuItem>
                ))
              ) : (
                <MenuItem
                  id="none"
                  isDisabled
                  className="px-2 py-1.5 text-[12px] text-[var(--itera-color-faint)]"
                >
                  还没有最近项目
                </MenuItem>
              )}
              <MenuItem
                id="choose"
                className="mt-1 flex items-center justify-between rounded-[6px] border-t border-[var(--itera-color-border-soft)] px-2 py-2 text-[12.5px] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:bg-[var(--itera-color-primary-soft)]"
              >
                <span>打开其他目录…</span>
                <span className="font-mono text-[10.5px] text-[var(--itera-color-faint)]">⌘O</span>
              </MenuItem>
              {project ? (
                <MenuItem
                  id="close"
                  className="flex rounded-[6px] px-2 py-1.5 text-[12.5px] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:bg-[var(--itera-color-primary-soft)]"
                >
                  关闭当前项目
                </MenuItem>
              ) : null}
            </Menu>
          </Popover>
        </MenuTrigger>
      </Toolbar>

      <p className="pointer-events-none flex min-w-0 items-center gap-1.5 font-mono text-[11.5px] text-[var(--itera-color-muted)]">
        {breadcrumbParts.length
          ? breadcrumbParts.slice(0, -1).map((part) => (
              <span key={part} className="min-w-0 truncate">
                {part} /
              </span>
            ))
          : null}
        {breadcrumbParts[breadcrumbParts.length - 1] ? (
          <b className="shrink-0 font-medium text-[var(--itera-color-ink)]">
            {breadcrumbParts[breadcrumbParts.length - 1]}
          </b>
        ) : project ? (
          <span>{project.name}</span>
        ) : null}
        {activeTab?.dirty ? (
          <>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--itera-color-warning)]"
            />
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
          className="flex h-7 items-center gap-1.5 rounded-[7px] border border-transparent px-2 text-[12px] text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:cursor-not-allowed disabled:opacity-45"
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
