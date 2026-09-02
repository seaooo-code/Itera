import { useCallback, useMemo, useRef, type KeyboardEvent } from "react";
import type { FileTreeNode } from "../../../services/tauri/filesystem";
import { Icon } from "../../../shared/components/Icon";
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
  onOpenFile: (path: string) => void;
  onToggleDirectory: (path: string) => void;
}

export function FileTree({
  nodes,
  expandedDirs,
  activePath,
  onOpenFile,
  onToggleDirectory,
}: FileTreeProps) {
  const treeRef = useRef<HTMLDivElement>(null);
  const visibleNodes = useMemo(() => getVisibleNodes(nodes, expandedDirs), [expandedDirs, nodes]);

  const focusNode = useCallback((path: string) => {
    const target = Array.from(
      treeRef.current?.querySelectorAll<HTMLElement>("[data-tree-path]") ?? [],
    ).find((item) => item.dataset.treePath === path);
    target?.focus();
  }, []);

  const onTreeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, node: FileTreeNode) => {
      const currentIndex = visibleNodes.findIndex((item) => item.path === node.path);

      if (event.key === "ArrowDown" && currentIndex < visibleNodes.length - 1) {
        event.preventDefault();
        focusNode(visibleNodes[currentIndex + 1].path);
      } else if (event.key === "ArrowUp" && currentIndex > 0) {
        event.preventDefault();
        focusNode(visibleNodes[currentIndex - 1].path);
      } else if (event.key === "ArrowRight" && node.type === "directory") {
        event.preventDefault();
        if (!expandedDirs[node.path]) {
          onToggleDirectory(node.path);
        } else if (node.children?.[0]) {
          focusNode(node.children[0].path);
        }
      } else if (event.key === "ArrowLeft" && node.type === "directory") {
        if (expandedDirs[node.path]) {
          event.preventDefault();
          onToggleDirectory(node.path);
        }
      } else if (event.key === "Enter" && node.type === "file") {
        event.preventDefault();
        onOpenFile(node.path);
      }
    },
    [expandedDirs, focusNode, onOpenFile, onToggleDirectory, visibleNodes],
  );

  const renderNodes = (items: FileTreeNode[], level: number) =>
    items.map((node) => (
      <div key={node.path}>
        <button
          type="button"
          role="treeitem"
          data-tree-path={node.path}
          aria-level={level}
          aria-expanded={node.type === "directory" ? Boolean(expandedDirs[node.path]) : undefined}
          aria-selected={node.type === "file" ? activePath === node.path : undefined}
          className={`group flex h-[26px] w-full items-center gap-1.5 rounded-[5px] border-0 bg-transparent pr-2 text-left text-[12.5px] outline-none transition-colors hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] focus-visible:ring-inset ${activePath === node.path ? "bg-[var(--itera-color-primary-soft)] font-medium" : ""}`}
          style={{ paddingLeft: `${8 + (level - 1) * 14}px` }}
          onClick={() =>
            node.type === "directory" ? onToggleDirectory(node.path) : onOpenFile(node.path)
          }
          onKeyDown={(event) => onTreeKeyDown(event, node)}
        >
          <span className="flex h-3 w-3 shrink-0 items-center justify-center text-[var(--itera-color-muted)]">
            {node.type === "directory" ? (
              <Icon
                name={expandedDirs[node.path] ? "chevron-down" : "chevron-right"}
                className="h-3 w-3"
              />
            ) : null}
          </span>
          <FileIcon node={node} />
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
        </button>
        {node.type === "directory" && expandedDirs[node.path] && node.children?.length ? (
          <fieldset className="m-0 min-w-0 border-0 p-0">
            {renderNodes(node.children, level + 1)}
          </fieldset>
        ) : null}
      </div>
    ));

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label="项目文件树"
      className="min-h-0 flex-1 overflow-auto px-1.5 py-1.5"
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
