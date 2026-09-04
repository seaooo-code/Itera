import { Button } from "react-aria-components";
import type { RecentProject } from "../store/types";
import { Icon } from "../../../shared/components/Icon";
import { shortPath } from "../../../shared/utils/path";
import { formatRelativeTime } from "../../../shared/utils/time";

function RecentProjectRow({
  item,
  onOpen,
}: {
  item: RecentProject;
  onOpen: (path: string) => void;
}) {
  return (
    <Button
      className="group flex w-full items-center gap-3 rounded-[8px] border-0 bg-transparent px-2.5 py-[9px] text-left outline-none transition hover:bg-[var(--itera-color-surface)] hover:shadow-[0_1px_3px_color-mix(in_oklch,var(--itera-color-ink)_10%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:cursor-not-allowed"
      isDisabled={!item.available}
      onPress={() => onOpen(item.path)}
    >
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] border border-[var(--itera-color-border)] bg-[var(--itera-color-sunken-strong)] text-[var(--itera-color-muted)]">
        <Icon name="folder" className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium leading-[1.45] text-[var(--itera-color-ink)]">
          {item.name}
        </span>
        <span className="block truncate font-mono text-[11px] leading-[1.45] text-[var(--itera-color-muted)]">
          {shortPath(item.path)}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[11px] text-[var(--itera-color-muted)]">
        {item.available ? formatRelativeTime(item.openedAt) : "不可用"}
      </span>
    </Button>
  );
}

interface WelcomeProps {
  recentProjects: RecentProject[];
  onChooseProject: () => void;
  onOpenRecent: (path: string) => void;
}

export function Welcome({ recentProjects, onChooseProject, onOpenRecent }: WelcomeProps) {
  return (
    <section
      className="grid min-h-0 place-items-center overflow-auto px-8 py-12"
      aria-labelledby="welcome-title"
    >
      <div className="w-full max-w-[600px] py-10">
        <div>
          <div className="grid h-10 w-10 place-items-center rounded-[11px] bg-[var(--itera-color-ink)] text-[var(--itera-color-surface)]">
            <Icon name="code" className="h-[22px] w-[22px]" />
          </div>
          <h1
            id="welcome-title"
            className="mb-0 mt-5 text-[26px] font-semibold leading-[1.35] tracking-normal text-[var(--itera-color-ink)]"
          >
            打开一个本地项目，开始写代码。
          </h1>
          <p className="mb-0 mt-[9px] max-w-[42ch] text-[13.5px] leading-[1.7] text-[var(--itera-color-muted)]">
            砚 Yan 第一版只做四件事：打开本地项目、浏览文件、编辑 JavaScript /
            TypeScript、保存。没有别的。
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button
              className="inline-flex h-9 items-center gap-[7px] rounded-[7px] border border-[var(--itera-color-primary-solid)] bg-[var(--itera-color-primary-solid)] px-[17px] text-[13.5px] font-medium text-[var(--itera-color-surface)] outline-none transition hover:bg-[var(--itera-color-primary-dark)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] focus-visible:ring-offset-2"
              onPress={onChooseProject}
            >
              <Icon name="folder" className="h-3.5 w-3.5" />
              选择项目目录…
            </Button>
            <span className="font-mono text-[11px] text-[var(--itera-color-muted)]">或按 ⌘O</span>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-2 mt-0 font-mono text-[10.5px] font-medium tracking-[0.1em] text-[var(--itera-color-muted)] uppercase">
            最近打开
          </h2>
          {recentProjects.length ? (
            recentProjects.map((item) => (
              <RecentProjectRow key={item.path} item={item} onOpen={onOpenRecent} />
            ))
          ) : (
            <p className="py-5 text-[12px] text-[var(--itera-color-faint)]">还没有最近项目</p>
          )}
        </div>
      </div>
    </section>
  );
}
