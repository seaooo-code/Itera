import { Button, Input, Label, SearchField } from "react-aria-components";
import { Icon } from "../../../shared/components/Icon";

interface FindBarProps {
  isOpen: boolean;
  query: string;
  caseSensitive: boolean;
  currentMatch: number;
  totalMatches: number;
  onQueryChange: (query: string) => void;
  onCaseSensitiveChange: (value: boolean) => void;
  onMove: (direction: 1 | -1) => void;
  onClose: () => void;
}

export function FindBar({
  isOpen,
  query,
  caseSensitive,
  currentMatch,
  totalMatches,
  onQueryChange,
  onCaseSensitiveChange,
  onMove,
  onClose,
}: FindBarProps) {
  if (!isOpen) return null;

  const count =
    query && totalMatches === 0
      ? "无结果"
      : `${totalMatches ? currentMatch + 1 : 0} / ${totalMatches}`;

  return (
    <div className="absolute right-4 top-2 z-20 flex items-center gap-1.5 rounded-[9px] border border-[#dfe4e6] bg-white p-1.5 shadow-[0_10px_26px_-12px_rgba(41,48,58,0.32)]">
      <SearchField
        aria-label="文件内查找"
        value={query}
        onChange={onQueryChange}
        className="flex items-center"
      >
        <Label className="sr-only">查找</Label>
        <Input
          autoFocus
          className="h-[26px] w-[186px] rounded-[6px] border border-[#dfe4e6] bg-white px-2 text-[12.5px] text-[#29303a] outline-none placeholder:text-[#9aa0a7] focus:border-[#3c8f55] focus:ring-2 focus:ring-[#b8dfc1]"
          placeholder="查找文件内容…"
        />
      </SearchField>
      <span
        role="status"
        aria-live="polite"
        className={`min-w-10 text-center font-mono text-[11px] ${query && totalMatches === 0 ? "text-[#a04b3e]" : "text-[#6c737c]"}`}
      >
        {count}
      </span>
      <Button
        className={`grid h-6 min-w-6 place-items-center rounded-[5px] border border-transparent px-1 font-mono text-[11px] text-[#6c737c] outline-none hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55] ${caseSensitive ? "border-[#b8dfc1] bg-[#eff9f1] text-[#347d4a]" : ""}`}
        aria-pressed={caseSensitive}
        aria-label="区分大小写"
        onPress={() => onCaseSensitiveChange(!caseSensitive)}
      >
        Aa
      </Button>
      <Button
        className="grid h-6 w-6 place-items-center rounded-[5px] border border-transparent text-[#6c737c] outline-none hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55]"
        aria-label="上一个匹配"
        onPress={() => onMove(-1)}
      >
        <Icon name="arrow-up" className="h-3.5 w-3.5" />
      </Button>
      <Button
        className="grid h-6 w-6 place-items-center rounded-[5px] border border-transparent text-[#6c737c] outline-none hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55]"
        aria-label="下一个匹配"
        onPress={() => onMove(1)}
      >
        <Icon name="arrow-down" className="h-3.5 w-3.5" />
      </Button>
      <Button
        className="grid h-6 w-6 place-items-center rounded-[5px] border border-transparent text-[#6c737c] outline-none hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55]"
        aria-label="关闭查找"
        onPress={onClose}
      >
        <Icon name="close" className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
