import type { PointerEvent } from "react";
import { Button } from "react-aria-components";
import type { FileTreeNode } from "../../../services/tauri/filesystem";
import { Icon } from "../../../shared/components/Icon";
import { FileTree } from "./FileTree";

interface WorkspaceSidebarProps {
  tree: FileTreeNode[];
  ignoredPatterns: string[];
  expandedDirs: Record<string, boolean>;
  activePath: string | null;
  sidebarWidth: number;
  syncStatus: "idle" | "reading" | "synced" | "failed";
  statusText: string;
  onOpenFile: (path: string) => void;
  onToggleDirectory: (path: string) => void;
  onRefresh: () => void;
  onResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  onResize: (width: number) => void;
}

export function WorkspaceSidebar({
  tree,
  ignoredPatterns,
  expandedDirs,
  activePath,
  sidebarWidth,
  syncStatus,
  statusText,
  onOpenFile,
  onToggleDirectory,
  onRefresh,
  onResizeStart,
  onResize,
}: WorkspaceSidebarProps) {
  return (
    <>
      <aside
        className="flex min-h-0 shrink-0 flex-col"
        style={{ width: `${sidebarWidth}px` }}
        aria-label="项目文件树面板"
      >
        <div className="flex h-8 shrink-0 items-center gap-1.5 pl-3 pr-1.5">
          <span className="flex-1 font-mono text-[10.5px] tracking-[0.1em] text-[var(--itera-color-muted)] uppercase">
            文件
          </span>
          <span className="flex items-center gap-1 font-mono text-[10.5px] text-[var(--itera-color-subtle)]">
            <i
              className={`h-[5px] w-[5px] rounded-full ${syncStatus === "failed" ? "bg-[var(--itera-color-danger)]" : syncStatus === "reading" ? "bg-[var(--itera-color-warning)]" : "bg-[var(--itera-color-muted)]"}`}
            />
            {statusText}
          </span>
          <Button
            className="grid h-7 w-7 place-items-center rounded-[6px] border border-transparent text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]"
            aria-label="刷新项目文件树"
            onPress={onRefresh}
          >
            <Icon
              name="refresh"
              className={`h-3.5 w-3.5 ${syncStatus === "reading" ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        <FileTree
          nodes={tree}
          expandedDirs={expandedDirs}
          activePath={activePath}
          onOpenFile={onOpenFile}
          onToggleDirectory={onToggleDirectory}
        />
        {ignoredPatterns.length > 0 ? (
          <p
            className="m-0 shrink-0 cursor-default overflow-hidden text-ellipsis whitespace-nowrap px-3 pb-2.5 pt-[9px] font-mono text-[11px] text-[var(--itera-color-muted)]"
            title={`已忽略 ${ignoredPatterns.join(" · ")} 等 ${ignoredPatterns.length} 项`}
          >
            已忽略隐藏与依赖目录{" "}
            <b className="font-semibold text-[var(--itera-color-muted)]">
              · {ignoredPatterns.length} 项
            </b>
          </p>
        ) : null}
      </aside>
      <hr
        className="group relative m-0 w-2 shrink-0 cursor-col-resize border-0 after:absolute after:inset-y-3 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:rounded-full after:bg-transparent group-hover:after:bg-[var(--itera-color-primary-border)]"
        aria-label="调整文件树宽度"
        aria-orientation="vertical"
        aria-valuemin={196}
        aria-valuemax={460}
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        onPointerDown={onResizeStart}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") onResize(sidebarWidth - 12);
          if (event.key === "ArrowRight") onResize(sidebarWidth + 12);
        }}
      />
    </>
  );
}
