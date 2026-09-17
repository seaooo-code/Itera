import { Channel, invoke } from "@tauri-apps/api/core";
import { assertTauriRuntime } from "./runtime";

export type TerminalEvent =
  | { type: "output"; data: number[] }
  | { type: "exit"; code: number; signal: string | null }
  | { type: "error"; message: string };

interface CreateTerminalOptions {
  sessionId: string;
  cwd: string;
  cols: number;
  rows: number;
  onEvent: (event: TerminalEvent) => void;
}

const activeChannels = new Map<string, Channel<TerminalEvent>>();
const writeQueues = new Map<string, Promise<void>>();

export async function createTerminal({
  sessionId,
  cwd,
  cols,
  rows,
  onEvent,
}: CreateTerminalOptions) {
  assertTauriRuntime("终端只能在 Itera 桌面应用中运行");
  const eventChannel = new Channel<TerminalEvent>();
  eventChannel.onmessage = (event) => {
    onEvent(event);
    if (event.type === "exit") activeChannels.delete(sessionId);
  };
  activeChannels.set(sessionId, eventChannel);

  try {
    await invoke("terminal_create", {
      sessionId,
      cwd,
      cols,
      rows,
      onEvent: eventChannel,
    });
  } catch (error) {
    activeChannels.delete(sessionId);
    throw error;
  }
}

export function writeTerminal(sessionId: string, data: Uint8Array) {
  assertTauriRuntime("终端输入只能在 Itera 桌面应用中发送");
  const pending = writeQueues.get(sessionId) ?? Promise.resolve();
  const write = pending
    .catch(() => undefined)
    .then(() => invoke<void>("terminal_write", { sessionId, data: Array.from(data) }));
  writeQueues.set(sessionId, write);
  const release = () => {
    if (writeQueues.get(sessionId) === write) writeQueues.delete(sessionId);
  };
  void write.then(release, release);
  return write;
}

export function resizeTerminal(sessionId: string, cols: number, rows: number) {
  assertTauriRuntime("终端尺寸只能在 Itera 桌面应用中调整");
  return invoke<void>("terminal_resize", { sessionId, cols, rows });
}

export async function closeTerminal(sessionId: string) {
  assertTauriRuntime("终端只能在 Itera 桌面应用中关闭");
  try {
    return await invoke<boolean>("terminal_close", { sessionId });
  } finally {
    activeChannels.delete(sessionId);
    writeQueues.delete(sessionId);
  }
}
