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
    <div className="absolute right-[18px] top-2.5 z-20 flex items-center gap-1.5 rounded-[9px] border border-[var(--itera-color-border)] bg-[var(--itera-color-surface)] px-[7px] py-1.5 shadow-[var(--itera-shadow-find)]">
      <SearchField
        aria-label="文件内查找"
        value={query}
        onChange={onQueryChange}
        className="flex items-center"
      >
        <Label className="sr-only">查找</Label>
        <Input
          autoFocus
          className="h-[26px] w-[186px] rounded-[6px] border border-[var(--itera-color-border)] bg-[var(--itera-color-surface)] px-[9px] text-[12.5px] text-[var(--itera-color-ink)] outline-none placeholder:text-[var(--itera-color-faint)] hover:border-[color-mix(in_oklch,var(--itera-color-ink)_30%,var(--itera-color-border))] focus:border-[var(--itera-color-primary-solid)] focus:ring-[3px] focus:ring-[var(--itera-color-primary-ring-halo)]"
          placeholder="在文件内查找"
        />
      </SearchField>
      <span
        role="status"
        aria-live="polite"
        className={`min-w-10 text-center font-mono text-[11px] ${query && totalMatches === 0 ? "text-[var(--itera-color-danger)]" : "text-[var(--itera-color-muted)]"}`}
      >
        {count}
      </span>
      <Button
        className={`grid h-6 min-w-6 place-items-center rounded-[5px] border border-transparent px-1 font-mono text-[11px] text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] ${caseSensitive ? "border-[var(--itera-color-primary-border)] bg-[var(--itera-color-primary-soft)] text-[var(--itera-color-primary-ink)]" : ""}`}
        aria-pressed={caseSensitive}
        aria-label="区分大小写"
        onPress={() => onCaseSensitiveChange(!caseSensitive)}
      >
        Aa
      </Button>
      <Button
        className="grid h-6 w-6 place-items-center rounded-[5px] border border-transparent text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]"
        aria-label="上一个匹配"
        onPress={() => onMove(-1)}
      >
        <Icon name="arrow-up" className="h-3.5 w-3.5" />
      </Button>
      <Button
        className="grid h-6 w-6 place-items-center rounded-[5px] border border-transparent text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]"
        aria-label="下一个匹配"
        onPress={() => onMove(1)}
      >
        <Icon name="arrow-down" className="h-3.5 w-3.5" />
      </Button>
      <Button
        className="grid h-6 w-6 place-items-center rounded-[5px] border border-transparent text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]"
        aria-label="关闭查找"
        onPress={onClose}
      >
        <Icon name="close" className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
