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
      className="group flex w-full items-center gap-3 rounded-[8px] border border-transparent px-3 py-2 text-left outline-none transition hover:border-[#dce2e5] hover:bg-[#f5f7f7] focus-visible:ring-2 focus-visible:ring-[#3c8f55] disabled:cursor-not-allowed disabled:opacity-50"
      isDisabled={!item.available}
      onPress={() => onOpen(item.path)}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[7px] bg-[#eff9f1] text-[#3c8f55]">
        <Icon name="folder" className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[#29303a]">{item.name}</span>
        <span className="block truncate font-mono text-[11px] text-[#7c848d]">
          {shortPath(item.path)}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[10.5px] text-[#8b9299]">
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
      <div className="w-full max-w-[520px]">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-[14px] bg-[#29303a] text-white shadow-[0_12px_24px_-14px_rgba(41,48,58,0.6)]">
            <Icon name="code" className="h-7 w-7" />
          </div>
          <h1
            id="welcome-title"
            className="m-0 text-[26px] font-semibold leading-[1.35] tracking-normal text-[#29303a]"
          >
            打开一个本地项目，开始写代码
          </h1>
          <p className="mt-3 text-[13px] text-[#6c737c]">
            选择一个目录，砚 Yan 会读取文件并保留你的本地编辑草稿。
          </p>
          <Button
            className="mt-6 inline-flex h-9 items-center gap-2 rounded-[7px] border border-[#347d4a] bg-[#3c8f55] px-4 text-[12.5px] font-medium text-white shadow-[0_5px_12px_-8px_rgba(60,143,85,0.8)] outline-none transition hover:bg-[#337c49] focus-visible:ring-2 focus-visible:ring-[#3c8f55] focus-visible:ring-offset-2"
            onPress={onChooseProject}
          >
            <Icon name="folder" className="h-4 w-4" />
            选择项目目录
            <span className="ml-1 font-mono text-[10.5px] opacity-80">⌘O</span>
          </Button>
        </div>

        <div className="rounded-[12px] border border-[#e1e5e7] bg-white p-3 shadow-[0_10px_24px_-18px_rgba(41,48,58,0.35)]">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <h2 className="m-0 font-mono text-[10.5px] font-medium tracking-[0.1em] text-[#6c737c] uppercase">
              最近打开
            </h2>
            <span className="font-mono text-[10.5px] text-[#9aa0a7]">
              {recentProjects.length} / 8
            </span>
          </div>
          {recentProjects.length ? (
            recentProjects.map((item) => (
              <RecentProjectRow key={item.path} item={item} onOpen={onOpenRecent} />
            ))
          ) : (
            <p className="px-3 py-5 text-center text-[12px] text-[#8b9299]">还没有最近项目</p>
          )}
        </div>
      </div>
    </section>
  );
}
