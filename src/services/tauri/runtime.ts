export function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export function assertTauriRuntime(message: string) {
  if (!isTauriRuntime()) {
    throw new Error(message);
  }
}
