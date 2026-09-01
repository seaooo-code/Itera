import { watch, type UnwatchFn, type WatchEvent } from "@tauri-apps/plugin-fs";
import { isTauriRuntime } from "./runtime";

export async function watchProject(
  rootPath: string,
  onChange: (event: WatchEvent) => void,
): Promise<UnwatchFn | null> {
  if (!isTauriRuntime()) return null;

  return watch(rootPath, onChange, {
    recursive: true,
    delayMs: 450,
  });
}
