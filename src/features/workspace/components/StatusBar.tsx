import type { ProjectState, SyncState, TabState } from "../store/types";
import { getLanguageLabel } from "../store/selectors";
import { shortPath } from "../../../shared/utils/path";
import { formatClock } from "../../../shared/utils/time";

interface StatusBarProps {
  project: ProjectState | null;
  activeTab: TabState | null;
  syncState: SyncState;
  lineSelection: number;
  onOpenFind: () => void;
}

export function StatusBar({
  project,
  activeTab,
  syncState,
  lineSelection,
  onOpenFind,
}: StatusBarProps) {
  return (
    <footer
      className="flex min-w-0 items-center gap-3 px-3 font-mono text-[11px] text-[var(--itera-color-muted)]"
      role="status"
      aria-live="polite"
    >
      <span className="min-w-0 truncate">
        {project
          ? shortPath(project.path) + (activeTab ? ` / ${activeTab.relativePath}` : "")
          : "未打开项目"}
      </span>
      <span className="shrink-0">
        <span
          className={`inline-flex h-[19px] items-center gap-1.5 rounded-full border px-2 text-[10.5px] ${activeTab?.dirty ? "border-[var(--itera-color-warning-border)] bg-[var(--itera-color-warning-soft)] text-[var(--itera-color-warning)]" : syncState.status === "failed" ? "border-[var(--itera-color-danger-border)] bg-[var(--itera-color-danger-soft)] text-[var(--itera-color-danger)]" : "border-[var(--itera-color-primary-border)] bg-[var(--itera-color-primary-soft)] text-[var(--itera-color-primary-ink)]"}`}
        >
          <i className="h-[5px] w-[5px] rounded-full bg-current" />
          {activeTab?.dirty
            ? "未保存"
            : syncState.status === "failed"
              ? "同步失败"
              : `已保存 ${formatClock(project?.syncedAt)}`}
        </span>
      </span>
      <span className="flex-1" />
      <span className="shrink-0">
        {activeTab ? `行 ${activeTab.cursor.line}，列 ${activeTab.cursor.column}` : "行 1，列 1"}
      </span>
      {lineSelection ? <span className="shrink-0">已选 {lineSelection}</span> : null}
      <span className="shrink-0">空格 2 · UTF-8 · LF</span>
      <span className="shrink-0">{activeTab ? getLanguageLabel(activeTab.language) : "—"}</span>
      <button
        type="button"
        className="h-6 shrink-0 rounded-[5px] border border-transparent bg-transparent px-2 font-mono text-[11px] text-[var(--itera-color-muted)] outline-none hover:border-[var(--itera-color-border)] hover:bg-[var(--itera-color-hover)] hover:text-[var(--itera-color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={onOpenFind}
        disabled={!activeTab}
      >
        ⌘F 查找
      </button>
    </footer>
  );
}
