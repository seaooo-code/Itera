import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { FileTreeNode } from "../../../services/tauri/filesystem";
import { Icon } from "../../../shared/components/Icon";
import type { TreeChangeKind } from "../store/types";
import { DirectoryIcon } from "./DirectoryIcon";
import { FileIcon } from "./FileIcon";

function getVisibleNodes(nodes: FileTreeNode[], expandedDirs: Record<string, boolean>) {
  const visible: FileTreeNode[] = [];
  const visit = (items: FileTreeNode[]) => {
    for (const item of items) {
      visible.push(item);
      if (item.type === "directory" && expandedDirs[item.path]) {
        visit(item.children ?? []);
      }
    }
  };
  visit(nodes);
  return visible;
}

interface FileTreeProps {
  nodes: FileTreeNode[];
  expandedDirs: Record<string, boolean>;
  activePath: string | null;
  openedFiles: ReadonlySet<string>;
  dirtyFiles: ReadonlySet<string>;
  conflictFiles: ReadonlySet<string>;
  treeChanges: Record<string, TreeChangeKind>;
  onOpenFile: (path: string, options?: { preview?: boolean }) => void;
  onToggleDirectory: (path: string) => void;
}

export function FileTree({
  nodes,
  expandedDirs,
  activePath,
  openedFiles,
  dirtyFiles,
  conflictFiles,
  treeChanges,
  onOpenFile,
  onToggleDirectory,
}: FileTreeProps) {
  const treeRef = useRef<HTMLDivElement>(null);
  const visibleNodes = useMemo(() => getVisibleNodes(nodes, expandedDirs), [expandedDirs, nodes]);
  const visiblePaths = useMemo(
    () => new Set(visibleNodes.map((node) => node.path)),
    [visibleNodes],
  );
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const tabStopPath =
    (focusedPath && visiblePaths.has(focusedPath) ? focusedPath : null) ??
    (activePath && visiblePaths.has(activePath) ? activePath : null) ??
    visibleNodes[0]?.path ??
    null;

  useEffect(() => {
    if (focusedPath && !visiblePaths.has(focusedPath)) {
      setFocusedPath(null);
    }
  }, [focusedPath, visiblePaths]);

  const focusNode = useCallback((path: string) => {
    setFocusedPath(path);
    const target = Array.from(
      treeRef.current?.querySelectorAll<HTMLElement>("[data-tree-path]") ?? [],
    ).find((item) => item.dataset.treePath === path);
    target?.focus();
  }, []);

  const focusAt = useCallback(
    (index: number) => {
      const node = visibleNodes[Math.max(0, Math.min(visibleNodes.length - 1, index))];
      if (node) focusNode(node.path);
    },
    [focusNode, visibleNodes],
  );

  const onTreeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, node: FileTreeNode) => {
      const currentIndex = visibleNodes.findIndex((item) => item.path === node.path);
      if (currentIndex < 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusAt(currentIndex + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusAt(currentIndex - 1);
          break;
        case "Home":
          event.preventDefault();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          focusAt(visibleNodes.length - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          if (node.type === "directory" && !expandedDirs[node.path]) {
            onToggleDirectory(node.path);
          } else {
            focusAt(currentIndex + 1);
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (node.type === "directory" && expandedDirs[node.path]) {
            onToggleDirectory(node.path);
          } else {
            focusAt(currentIndex - 1);
          }
          break;
        case "Enter":
          if (node.type === "file") {
            event.preventDefault();
            onOpenFile(node.path, { preview: !event.shiftKey });
          }
          break;
        default:
          break;
      }
    },
    [expandedDirs, focusAt, onOpenFile, onToggleDirectory, visibleNodes],
  );

  const renderNodes = (items: FileTreeNode[], level: number) =>
    items.map((node) => {
      const isFile = node.type === "file";
      const isActive = isFile && activePath === node.path;
      const isOpened = isFile && openedFiles.has(node.path);
      const isDirty = isFile && dirtyFiles.has(node.path);
      const hasConflict = isFile && conflictFiles.has(node.path);
      const treeChange = isFile ? treeChanges[node.path] : undefined;
      const changeMarker = hasConflict
        ? { glyph: "!", label: "磁盘上已更改，与未保存修改冲突", isConflict: true }
        : treeChange === "added"
          ? { glyph: "+", label: "外部新增", isConflict: false }
          : treeChange === "reloaded"
            ? { glyph: "~", label: "外部已修改，已重新载入", isConflict: false }
            : null;

      return (
        <div key={node.path}>
          <button
            type="button"
            role="treeitem"
            data-tree-path={node.path}
            aria-level={level}
            aria-expanded={node.type === "directory" ? Boolean(expandedDirs[node.path]) : undefined}
            aria-selected={isFile ? isActive : undefined}
            tabIndex={node.path === tabStopPath ? 0 : -1}
            className={`group relative flex h-[26px] [overflow-anchor:none] w-full select-none items-center rounded-[5px] border-0 bg-transparent pr-1.5 text-left text-[12.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] focus-visible:ring-inset ${isActive ? "bg-[var(--itera-color-primary-soft)] before:absolute before:inset-y-[3px] before:left-0 before:w-0.5 before:rounded-[1px] before:bg-[var(--itera-color-primary)] hover:bg-[var(--itera-color-primary-soft-strong)]" : "hover:bg-[var(--itera-color-hover)]"}`}
            style={{ paddingLeft: `${6 + (level - 1) * 13}px` }}
            onFocus={() => setFocusedPath(node.path)}
            onClick={() =>
              node.type === "directory"
                ? onToggleDirectory(node.path)
                : onOpenFile(node.path, { preview: true })
            }
            onDoubleClick={() => {
              if (node.type === "file") onOpenFile(node.path, { preview: false });
            }}
            onKeyDown={(event) => onTreeKeyDown(event, node)}
          >
            <span
              aria-hidden="true"
              className="grid h-4 w-4 shrink-0 place-items-center text-[var(--itera-color-muted)]"
            >
              {node.type === "directory" ? (
                <Icon
                  name="chevron-right"
                  className={`h-3 w-3 ${expandedDirs[node.path] ? "rotate-90" : ""}`}
                />
              ) : null}
            </span>
            <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center">
              {node.type === "directory" ? (
                <DirectoryIcon name={node.name} />
              ) : (
                <FileIcon name={node.name} />
              )}
            </span>
            <span
              className={`ml-1.5 min-w-0 flex-1 truncate ${isActive ? "font-medium text-[var(--itera-color-ink)]" : isFile && !isOpened ? "text-[var(--itera-color-muted)]" : "text-[var(--itera-color-ink)]"}`}
            >
              {node.name}
            </span>
            {changeMarker ? (
              <>
                <span
                  aria-hidden="true"
                  className={`grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[4px] font-mono text-[11px] font-semibold leading-none ${changeMarker.isConflict ? "bg-[var(--itera-color-warning-hover-soft)] text-[var(--itera-color-warning)]" : "text-[var(--itera-color-muted)]"}`}
                >
                  {changeMarker.glyph}
                </span>
                <span className="sr-only">{changeMarker.label}</span>
              </>
            ) : null}
            {isDirty ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--itera-color-warning-marker)]"
                />
                <span className="sr-only">未保存</span>
              </>
            ) : null}
          </button>
          {node.type === "directory" && expandedDirs[node.path] && node.children?.length ? (
            <fieldset className="m-0 min-w-0 border-0 p-0">
              {renderNodes(node.children, level + 1)}
            </fieldset>
          ) : null}
        </div>
      );
    });

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label="项目文件树"
      className="min-h-0 flex-1 overflow-auto px-1.5 pb-2.5 pt-1.5 [overflow-anchor:none] [scrollbar-gutter:stable]"
    >
      {nodes.length ? (
        renderNodes(nodes, 1)
      ) : (
        <div className="px-2 py-4 text-[12px] leading-6 text-[var(--itera-color-subtle)]">
          项目目录为空
        </div>
      )}
    </div>
  );
}
