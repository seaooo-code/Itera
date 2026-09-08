import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import type { EditorViewMode } from "../store/types";

interface ViewModeOption {
  id: EditorViewMode;
  label: string;
}

const VIEW_MODES: ViewModeOption[] = [
  { id: "edit", label: "仅编辑" },
  { id: "split", label: "分屏" },
  { id: "preview", label: "仅预览" },
];

interface EditorViewModeControlProps {
  value: EditorViewMode;
  isDisabled?: boolean;
  isPreviewOnly?: boolean;
  onChange: (mode: EditorViewMode) => void;
}

function isEditorViewMode(value: string): value is EditorViewMode {
  return VIEW_MODES.some((mode) => mode.id === value);
}

export function EditorViewModeControl({
  value,
  isDisabled = false,
  isPreviewOnly = false,
  onChange,
}: EditorViewModeControlProps) {
  return (
    <ToggleButtonGroup
      aria-label="编辑器视图模式"
      selectionMode="single"
      disallowEmptySelection
      isDisabled={isDisabled}
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const selected = String([...keys][0] ?? "");
        if (isEditorViewMode(selected)) onChange(selected);
      }}
      className="flex h-[26px] shrink-0 items-center gap-0.5 rounded-[7px] bg-[var(--itera-color-sunken-strong)] p-0.5 data-[disabled]:bg-[var(--itera-color-sunken)]"
    >
      {VIEW_MODES.map((mode) => (
        <ToggleButton
          key={mode.id}
          id={mode.id}
          isDisabled={isPreviewOnly && mode.id !== "preview"}
          aria-label={mode.label}
          className="h-[22px] rounded-[5px] border-0 bg-transparent px-2.5 text-[11.5px] whitespace-nowrap text-[var(--itera-color-muted)] outline-none transition-[background-color,color,box-shadow] hover:bg-[var(--itera-color-hover)] hover:text-[var(--itera-color-ink)] active:bg-[var(--itera-color-press)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] focus-visible:ring-inset data-[selected]:bg-[var(--itera-color-surface)] data-[selected]:font-medium data-[selected]:text-[var(--itera-color-ink)] data-[selected]:shadow-[0_1px_2px_-1px_color-mix(in_oklch,var(--itera-color-ink)_16%,transparent)] data-[selected]:active:bg-[var(--itera-color-surface)] data-[selected]:hover:bg-[var(--itera-color-surface)] data-[selected]:hover:shadow-[0_1px_2px_-1px_color-mix(in_oklch,var(--itera-color-ink)_26%,transparent),0_3px_8px_-6px_color-mix(in_oklch,var(--itera-color-ink)_30%,transparent)] disabled:cursor-not-allowed disabled:text-[color-mix(in_oklch,var(--itera-color-muted)_52%,var(--itera-color-sunken))] disabled:hover:bg-transparent disabled:data-[selected]:bg-[var(--itera-color-surface)] disabled:data-[selected]:shadow-none"
        >
          {mode.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
