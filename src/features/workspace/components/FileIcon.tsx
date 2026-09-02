import { FileIcon as DefaultFileIcon } from "@phosphor-icons/react/File";
import { FileCodeIcon } from "@phosphor-icons/react/FileCode";
import { FileCssIcon } from "@phosphor-icons/react/FileCss";
import { FileHtmlIcon } from "@phosphor-icons/react/FileHtml";
import { FileImageIcon } from "@phosphor-icons/react/FileImage";
import { FileJsIcon } from "@phosphor-icons/react/FileJs";
import { FileJsxIcon } from "@phosphor-icons/react/FileJsx";
import { FileLockIcon } from "@phosphor-icons/react/FileLock";
import { FileMdIcon } from "@phosphor-icons/react/FileMd";
import { FilePyIcon } from "@phosphor-icons/react/FilePy";
import { FileRsIcon } from "@phosphor-icons/react/FileRs";
import { FileSvgIcon } from "@phosphor-icons/react/FileSvg";
import { FileTextIcon } from "@phosphor-icons/react/FileText";
import { FileTsIcon } from "@phosphor-icons/react/FileTs";
import { FileTsxIcon } from "@phosphor-icons/react/FileTsx";
import { FolderSimpleIcon } from "@phosphor-icons/react/FolderSimple";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { FileTreeNode } from "../../../services/tauri/filesystem";
import { fileExtension } from "../../../shared/utils/path";

type FileIconKind =
  | "typescript"
  | "javascript"
  | "jsx"
  | "tsx"
  | "css"
  | "html"
  | "markdown"
  | "config"
  | "lock"
  | "image"
  | "python"
  | "rust"
  | "svg"
  | "text"
  | "default";

interface FileIconDefinition {
  component: PhosphorIcon;
  tone: string;
}

const FILE_ICON_DEFINITIONS: Record<FileIconKind, FileIconDefinition> = {
  typescript: { component: FileTsIcon, tone: "text-[#3e617d]" },
  javascript: { component: FileJsIcon, tone: "text-[#96721a]" },
  jsx: { component: FileJsxIcon, tone: "text-[#3e617d]" },
  tsx: { component: FileTsxIcon, tone: "text-[#3e617d]" },
  css: { component: FileCssIcon, tone: "text-[#267a7c]" },
  html: { component: FileHtmlIcon, tone: "text-[#a34d3d]" },
  markdown: { component: FileMdIcon, tone: "text-[#7441a8]" },
  config: { component: FileCodeIcon, tone: "text-[#5d6f86]" },
  lock: { component: FileLockIcon, tone: "text-[#805a16]" },
  image: { component: FileImageIcon, tone: "text-[#7b5a8f]" },
  python: { component: FilePyIcon, tone: "text-[#3e617d]" },
  rust: { component: FileRsIcon, tone: "text-[#8d3e34]" },
  svg: { component: FileSvgIcon, tone: "text-[#267a7c]" },
  text: { component: FileTextIcon, tone: "text-[#6c737c]" },
  default: { component: DefaultFileIcon, tone: "text-[#6c737c]" },
};

const FILE_NAME_KINDS: Record<string, FileIconKind> = {
  ".babelrc": "config",
  ".dockerignore": "config",
  ".editorconfig": "config",
  ".env": "config",
  ".eslintrc": "config",
  ".gitignore": "config",
  ".npmignore": "config",
  ".npmrc": "config",
  ".prettierignore": "config",
  ".prettierrc": "config",
  "package.json": "config",
  "package-lock.json": "lock",
  "pnpm-lock.yaml": "lock",
  "yarn.lock": "lock",
};

const IMAGE_EXTENSIONS = new Set(["gif", "ico", "jpeg", "jpg", "png", "webp"]);

function fileIconKind(name: string): FileIconKind {
  const normalizedName = name.toLowerCase();
  const namedKind = FILE_NAME_KINDS[normalizedName];
  if (namedKind) return namedKind;

  if (normalizedName.startsWith("readme")) return "markdown";

  const extension = fileExtension(name);
  if (["ts"].includes(extension)) return "typescript";
  if (["js", "mjs", "cjs"].includes(extension)) return "javascript";
  if (extension === "jsx") return "jsx";
  if (extension === "tsx") return "tsx";
  if (["css", "scss", "sass", "less"].includes(extension)) return "css";
  if (["html", "htm"].includes(extension)) return "html";
  if (["md", "markdown"].includes(extension)) return "markdown";
  if (["lock"].includes(extension) || normalizedName.endsWith("-lock.yaml")) return "lock";
  if (["ini", "toml", "yaml", "yml", "json"].includes(extension)) return "config";
  if (["py", "pyw"].includes(extension)) return "python";
  if (extension === "rs") return "rust";
  if (extension === "svg") return "svg";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (["txt", "text", "log", "license"].includes(extension)) return "text";
  return "default";
}

export function FileIcon({ node }: { node: FileTreeNode }) {
  if (node.type === "directory") {
    return (
      <FolderSimpleIcon
        size={15}
        weight="regular"
        className="shrink-0 text-[#6c737c]"
        aria-hidden
      />
    );
  }

  const { component: FileIconComponent, tone } = FILE_ICON_DEFINITIONS[fileIconKind(node.name)];

  return (
    <FileIconComponent size={15} weight="regular" className={`shrink-0 ${tone}`} aria-hidden />
  );
}
