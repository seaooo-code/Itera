import { Button } from "react-aria-components";
import type { ExternalChangeSummary, TabState } from "../store/types";
import { Icon } from "../../../shared/components/Icon";
import { formatClock } from "../../../shared/utils/time";

interface ExternalChangeCardProps {
  summary: ExternalChangeSummary;
  projectPath: string;
  tabs: TabState[];
  onClose: () => void;
}

function relativePath(rootPath: string, path: string) {
  const root = rootPath.replace(/\\/g, "/").replace(/\/$/, "");
  const normalized = path.replace(/\\/g, "/");
  return normalized.startsWith(`${root}/`) ? normalized.slice(root.length + 1) : normalized;
}

export function ExternalChangeCard({
  summary,
  projectPath,
  tabs,
  onClose,
}: ExternalChangeCardProps) {
  const rows = [
    { kind: "新增", glyph: "+", paths: summary.added, tone: "neutral" },
    { kind: "修改", glyph: "~", paths: summary.modified, tone: "neutral" },
    { kind: "删除", glyph: "−", paths: summary.deleted, tone: "danger" },
  ].filter((row) => row.paths.length > 0);
  const conflicts = tabs.filter((tab) => tab.externalConflict).map((tab) => tab.name);
  const missing = tabs.filter((tab) => tab.missing).map((tab) => tab.name);

  return (
    <aside
      role="status"
      aria-live="polite"
      className="absolute bottom-[42px] right-4 z-[70] w-[326px] rounded-[11px] bg-[var(--itera-color-surface)] py-3 pl-3.5 pr-3 shadow-[0_1px_3px_-1px_color-mix(in_oklch,var(--itera-color-ink)_16%,transparent),0_18px_40px_-16px_color-mix(in_oklch,var(--itera-color-ink)_30%,transparent)]"
    >
      <div className="flex items-center gap-2">
        <h2 className="m-0 flex-1 text-[12.5px] font-semibold">文件树已刷新</h2>
        <time className="font-mono text-[10.5px] text-[var(--itera-color-muted)]">
          {formatClock(summary.occurredAt)}
        </time>
        <Button
          className="-my-[3px] -mr-[3px] grid h-6 w-6 place-items-center rounded-[6px] text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-sunken)] hover:text-[var(--itera-color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]"
          aria-label="关闭变更汇总"
          onPress={onClose}
        >
          <Icon name="close" className="h-2.5 w-2.5" />
        </Button>
      </div>
      <ul className="mb-0 mt-2.5 flex list-none flex-col gap-[7px] p-0">
        {rows.map((row) => {
          const relativePaths = row.paths.map((path) => relativePath(projectPath, path));
          const tail =
            relativePaths.length === 1 ? relativePaths[0] : `${relativePaths.length} 个文件`;
          return (
            <li key={row.kind} className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className={`grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[4px] font-mono text-[11px] font-semibold leading-none ${row.tone === "danger" ? "bg-[var(--itera-color-danger-hover-soft)] text-[var(--itera-color-danger)]" : "text-[var(--itera-color-muted)]"}`}
              >
                {row.glyph}
              </span>
              <span className="shrink-0 text-[12px]">
                {row.kind} {row.paths.length}
              </span>
              <span
                className="min-w-0 flex-1 truncate text-right font-mono text-[11px] text-[var(--itera-color-muted)]"
                title={relativePaths.join(" · ")}
              >
                {tail}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mb-0 mt-[11px] text-[11.5px] leading-[1.7] text-[var(--itera-color-muted)]">
        {conflicts.length ? (
          <>
            <b className="font-semibold text-[var(--itera-color-warning)]">
              {conflicts.join("、")}
            </b>{" "}
            有未保存修改，没有被自动覆盖，需要你决定。{" "}
          </>
        ) : null}
        {missing.length ? (
          <>
            <b className="font-semibold text-[var(--itera-color-danger)]">{missing.join("、")}</b>{" "}
            已从磁盘消失，编辑器中的内容仍然保留。{" "}
          </>
        ) : null}
        {conflicts.length || missing.length
          ? "其余文件已重新载入。"
          : summary.deleted.length
            ? "被删除的文件没有在编辑器中打开，已从文件树移除；其余文件已重新载入。"
            : "打开的文件均无未保存修改，已直接重新载入。"}
      </p>
    </aside>
  );
}
