import type { PointerEvent } from "react";
import { Button } from "react-aria-components";
import type { FileTreeNode } from "../../../services/tauri/filesystem";
import { Icon } from "../../../shared/components/Icon";
import { FileTree } from "./FileTree";

interface WorkspaceSidebarProps {
  tree: FileTreeNode[];
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
          <span className="flex-1 font-mono text-[10.5px] tracking-[0.1em] text-[#6c737c] uppercase">
            文件
          </span>
          <span className="flex items-center gap-1 font-mono text-[10.5px] text-[#7c848d]">
            <i
              className={`h-[5px] w-[5px] rounded-full ${syncStatus === "failed" ? "bg-[#a04b3e]" : syncStatus === "reading" ? "bg-[#b67816]" : "bg-[#6c737c]"}`}
            />
            {statusText}
          </span>
          <Button
            className="grid h-7 w-7 place-items-center rounded-[6px] border border-transparent text-[#6c737c] outline-none hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55]"
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
        <p className="m-0 shrink-0 px-3 pb-2.5 pt-1 font-mono text-[11px] text-[#6c737c]">
          已忽略 <b className="font-medium text-[#29303a]">.git</b> ·{" "}
          <b className="font-medium text-[#29303a]">node_modules</b> ·{" "}
          <b className="font-medium text-[#29303a]">dist</b>
        </p>
      </aside>
      <hr
        className="group relative m-0 w-2 shrink-0 cursor-col-resize border-0 after:absolute after:inset-y-3 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:rounded-full after:bg-transparent group-hover:after:bg-[#b8dfc1]"
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
