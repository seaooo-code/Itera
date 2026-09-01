import { open } from "@tauri-apps/plugin-dialog";
import { assertTauriRuntime } from "./runtime";

export async function chooseDirectory() {
  assertTauriRuntime("目录选择需要在 Tauri 桌面环境中使用。");

  return open({
    directory: true,
    multiple: false,
    recursive: true,
    title: "选择本地项目目录",
  });
}
