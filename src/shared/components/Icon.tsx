import type { ReactNode } from "react";

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

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const SvgIcon = ({ children }: { children: ReactNode }) => (
    <svg {...common} aria-hidden="true" focusable="false">
      <title>{name}</title>
      {children}
    </svg>
  );

  switch (name) {
    case "arrow-left":
      return (
        <SvgIcon>
          <path d="m14 6-6 6 6 6" />
          <path d="M8 12h12" />
        </SvgIcon>
      );
    case "arrow-right":
      return (
        <SvgIcon>
          <path d="m10 6 6 6-6 6" />
          <path d="M4 12h12" />
        </SvgIcon>
      );
    case "arrow-up":
      return (
        <SvgIcon>
          <path d="M12 19V5" />
          <path d="m6 11 6-6 6 6" />
        </SvgIcon>
      );
    case "arrow-down":
      return (
        <SvgIcon>
          <path d="M12 5v14" />
          <path d="m6 13 6 6 6-6" />
        </SvgIcon>
      );
    case "check":
      return (
        <SvgIcon>
          <path d="m5 12 4.5 4.5L19 7" />
        </SvgIcon>
      );
    case "chevron-down":
      return (
        <SvgIcon>
          <path d="m6 9 6 6 6-6" />
        </SvgIcon>
      );
    case "chevron-right":
      return (
        <SvgIcon>
          <path d="m9 5.5 6.5 6.5L9 18.5" />
        </SvgIcon>
      );
    case "close":
      return (
        <SvgIcon>
          <path d="M6 6 18 18M18 6 6 18" />
        </SvgIcon>
      );
    case "code":
      return (
        <SvgIcon>
          <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
        </SvgIcon>
      );
    case "folder":
      return (
        <SvgIcon>
          <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h3.4l1.7 2H19a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5z" />
        </SvgIcon>
      );
    case "panel":
      return (
        <SvgIcon>
          <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
          <path d="M9.5 4.5v15" />
        </SvgIcon>
      );
    case "refresh":
      return (
        <SvgIcon>
          <path d="M20 12a8 8 0 1 1-2.6-5.9" />
          <path d="M20 4.5V10h-5.3" />
        </SvgIcon>
      );
    case "search":
      return (
        <SvgIcon>
          <circle cx="11" cy="11" r="6.2" />
          <path d="m15.6 15.6 4.4 4.4" />
        </SvgIcon>
      );
    case "save":
      return (
        <SvgIcon>
          <path d="M5.5 4.5h9.8l4.2 4.2v10.8h-14z" />
          <path d="M8.5 4.5v5h6v-5M8.5 19.5V14h7v5.5" />
        </SvgIcon>
      );
    case "warning":
      return (
        <SvgIcon>
          <path d="m12 4 8 15H4z" />
          <path d="M12 9v4M12 17h.01" />
        </SvgIcon>
      );
  }
}
