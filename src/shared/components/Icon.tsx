import { ArrowDownIcon } from "@phosphor-icons/react/ArrowDown";
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpIcon } from "@phosphor-icons/react/ArrowUp";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/ArrowsClockwise";
import { CaretDownIcon } from "@phosphor-icons/react/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/CaretRight";
import { CheckIcon } from "@phosphor-icons/react/Check";
import { CodeIcon } from "@phosphor-icons/react/Code";
import { FloppyDiskIcon } from "@phosphor-icons/react/FloppyDisk";
import { FolderSimpleIcon } from "@phosphor-icons/react/FolderSimple";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/MagnifyingGlass";
import { SidebarSimpleIcon } from "@phosphor-icons/react/SidebarSimple";
import { WarningIcon } from "@phosphor-icons/react/Warning";
import { XIcon } from "@phosphor-icons/react/X";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "check"
  | "chevron-down"
  | "chevron-right"
  | "close"
  | "code"
  | "folder"
  | "panel"
  | "refresh"
  | "search"
  | "save"
  | "warning";

const ICONS: Record<IconName, PhosphorIcon> = {
  "arrow-left": ArrowLeftIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-up": ArrowUpIcon,
  "arrow-down": ArrowDownIcon,
  check: CheckIcon,
  "chevron-down": CaretDownIcon,
  "chevron-right": CaretRightIcon,
  close: XIcon,
  code: CodeIcon,
  folder: FolderSimpleIcon,
  panel: SidebarSimpleIcon,
  refresh: ArrowsClockwiseIcon,
  search: MagnifyingGlassIcon,
  save: FloppyDiskIcon,
  warning: WarningIcon,
};

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const IconComponent = ICONS[name];

  return <IconComponent weight="regular" className={className} aria-hidden focusable="false" />;
}
