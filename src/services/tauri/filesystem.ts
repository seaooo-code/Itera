import { basename, join } from "@tauri-apps/api/path";
import { exists, readDir, readFile, writeTextFile, type DirEntry } from "@tauri-apps/plugin-fs";
import { assertTauriRuntime, isTauriRuntime } from "./runtime";

export type FileLanguage =
  | "javascript"
  | "typescript"
  | "css"
  | "html"
  | "json"
  | "markdown"
  | "text";

export interface FileTreeNode {
  name: string;
  path: string;
  type: "directory" | "file";
  children?: FileTreeNode[];
}

export interface ReadFileResult {
  path: string;
  content: string;
  binary: boolean;
  byteLength: number;
  language: FileLanguage;
}

export function formatFileError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") {
        return serialized;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist"]);

function decodeUtf8(bytes: Uint8Array) {
  if (bytes.includes(0)) {
    return null;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function normalizedPath(path: string) {
  return path.replace(/\\/g, "/").replace(/\/$/, "");
}

export function relativePath(rootPath: string, filePath: string) {
  const root = normalizedPath(rootPath);
  const file = normalizedPath(filePath);
  return file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;
}

export function languageForPath(path: string): FileLanguage {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";

  if (["js", "jsx", "mjs", "cjs"].includes(extension)) return "javascript";
  if (["ts", "tsx"].includes(extension)) return "typescript";
  if (extension === "css") return "css";
  if (["html", "htm"].includes(extension)) return "html";
  if (extension === "json") return "json";
  if (["md", "markdown"].includes(extension)) return "markdown";
  return "text";
}

async function readDirectoryTree(path: string): Promise<FileTreeNode[]> {
  let entries: DirEntry[];

  try {
    entries = await readDir(path);
  } catch (error) {
    throw new Error(`读取目录失败：${path}：${formatFileError(error, "未知文件系统错误")}`);
  }

  const sortedEntries = entries
    .filter((entry) => !entry.isSymlink && !IGNORED_DIRECTORIES.has(entry.name))
    .sort((left, right) => {
      if (left.isDirectory !== right.isDirectory) {
        return left.isDirectory ? -1 : 1;
      }

      return left.name.localeCompare(right.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

  return Promise.all(
    sortedEntries.map(async (entry: DirEntry) => {
      const entryPath = await join(path, entry.name);

      if (entry.isDirectory) {
        let children: FileTreeNode[] = [];

        try {
          children = await readDirectoryTree(entryPath);
        } catch (error) {
          console.warn("[Itera] 跳过无法读取的子目录", {
            path: entryPath,
            error,
          });
        }

        return {
          name: entry.name,
          path: entryPath,
          type: "directory" as const,
          children,
        };
      }

      return {
        name: entry.name,
        path: entryPath,
        type: "file" as const,
      };
    }),
  );
}

export async function readProjectTree(rootPath: string) {
  assertTauriRuntime("本地文件能力需要在 Tauri 桌面环境中使用。");

  return {
    name: await basename(rootPath),
    path: rootPath,
    children: await readDirectoryTree(rootPath),
  };
}

export async function readProjectFile(path: string): Promise<ReadFileResult> {
  assertTauriRuntime("本地文件能力需要在 Tauri 桌面环境中使用。");

  const bytes = await readFile(path);
  const decoded = decodeUtf8(bytes);

  if (decoded === null) {
    return {
      path,
      content: "此文件无法按 UTF-8 文本解码，已以只读二进制状态打开。",
      binary: true,
      byteLength: bytes.byteLength,
      language: "text",
    };
  }

  return {
    path,
    content: decoded,
    binary: false,
    byteLength: bytes.byteLength,
    language: languageForPath(path),
  };
}

export async function writeProjectFile(path: string, content: string) {
  assertTauriRuntime("本地文件能力需要在 Tauri 桌面环境中使用。");

  await writeTextFile(path, content);
}

export async function pathExists(path: string) {
  if (!isTauriRuntime()) return false;

  try {
    return await exists(path);
  } catch {
    return false;
  }
}
