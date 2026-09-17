import { FitAddon } from "@xterm/addon-fit";
import { Terminal, type ITheme } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import {
  closeTerminal,
  createTerminal,
  resizeTerminal,
  writeTerminal,
  type TerminalEvent,
} from "../../../services/tauri/terminal";
import "./TerminalEmulator.css";

export type TerminalStatus = "starting" | "running" | "exited" | "error";

export interface TerminalEmulatorHandle {
  clear: () => void;
  focus: () => void;
  interrupt: () => void;
}

interface TerminalEmulatorProps {
  sessionId: string;
  cwd: string;
  active: boolean;
  visible: boolean;
  onStatusChange: (status: TerminalStatus) => void;
}

const textEncoder = new TextEncoder();

function cssColor(styles: CSSStyleDeclaration, name: string) {
  return styles.getPropertyValue(name).trim();
}

function terminalTheme(): ITheme {
  const styles = getComputedStyle(document.documentElement);
  const color = (name: string) => cssColor(styles, name);
  return {
    background: color("--itera-color-surface"),
    foreground: color("--itera-color-terminal-output"),
    cursor: color("--itera-color-primary-solid"),
    cursorAccent: color("--itera-color-surface"),
    selectionBackground: color("--itera-color-selection"),
    selectionForeground: color("--itera-color-syntax-text"),
    black: color("--itera-color-ink"),
    brightBlack: color("--itera-color-subtle"),
    red: color("--itera-color-danger"),
    brightRed: color("--itera-color-danger"),
    green: color("--itera-color-change-added-ink"),
    brightGreen: color("--itera-color-change-added"),
    yellow: color("--itera-color-warning"),
    brightYellow: color("--itera-color-warning-marker"),
    blue: color("--itera-color-change-modified"),
    brightBlue: color("--itera-color-syntax-type"),
    magenta: color("--itera-color-syntax-keyword"),
    brightMagenta: color("--itera-color-syntax-tag"),
    cyan: color("--itera-color-primary-solid"),
    brightCyan: color("--itera-color-primary"),
    white: color("--itera-color-muted"),
    brightWhite: color("--itera-color-ink"),
  };
}

function binaryBytes(data: string) {
  return Uint8Array.from(data, (character) => character.charCodeAt(0) & 0xff);
}

export const TerminalEmulator = forwardRef<TerminalEmulatorHandle, TerminalEmulatorProps>(
  function TerminalEmulator({ sessionId, cwd, active, visible, onStatusChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const startedRef = useRef(false);
    const lastSizeRef = useRef({ cols: 0, rows: 0 });
    const activeVisibleRef = useRef(active && visible);
    const onStatusChangeRef = useRef(onStatusChange);

    activeVisibleRef.current = active && visible;
    onStatusChangeRef.current = onStatusChange;

    const send = useCallback(
      (data: Uint8Array) => {
        if (!startedRef.current) return;
        void writeTerminal(sessionId, data).catch((error: unknown) => {
          console.error("[Itera] 写入终端失败", { sessionId, error });
        });
      },
      [sessionId],
    );

    useImperativeHandle(
      ref,
      () => ({
        clear: () => terminalRef.current?.clear(),
        focus: () => terminalRef.current?.focus(),
        interrupt: () => send(Uint8Array.of(3)),
      }),
      [send],
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const terminal = new Terminal({
        allowProposedApi: false,
        cursorBlink: true,
        cursorStyle: "bar",
        fontFamily: getComputedStyle(document.documentElement)
          .getPropertyValue("--itera-font-terminal")
          .trim(),
        fontSize: 12.5,
        fontWeight: "400",
        lineHeight: 1.52,
        minimumContrastRatio: 4.5,
        screenReaderMode: true,
        scrollback: 5_000,
        theme: terminalTheme(),
      });
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(container);
      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      let disposed = false;
      let resizeFrame = 0;

      const reportError = (action: string, error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Itera] ${action}`, { sessionId, cwd, error });
        terminal.writeln(`\r\n\x1b[31m${action}: ${message}\x1b[0m`);
        onStatusChangeRef.current("error");
      };

      const fit = () => {
        if (disposed || !container.offsetParent) return;
        fitAddon.fit();
        if (!startedRef.current || terminal.cols < 1 || terminal.rows < 1) return;
        const size = lastSizeRef.current;
        if (size.cols === terminal.cols && size.rows === terminal.rows) return;
        lastSizeRef.current = { cols: terminal.cols, rows: terminal.rows };
        void resizeTerminal(sessionId, terminal.cols, terminal.rows).catch((error: unknown) => {
          console.error("[Itera] 调整终端尺寸失败", {
            sessionId,
            cols: terminal.cols,
            rows: terminal.rows,
            error,
          });
        });
      };

      const scheduleFit = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(fit);
      };

      const handleEvent = (event: TerminalEvent) => {
        if (disposed) return;
        if (event.type === "output") {
          terminal.write(new Uint8Array(event.data));
        } else if (event.type === "error") {
          terminal.writeln(`\r\n\x1b[31m${event.message}\x1b[0m`);
        } else {
          startedRef.current = false;
          const detail = event.signal ? ` (${event.signal})` : ` (${event.code})`;
          terminal.writeln(`\r\n\x1b[90m[Shell 已退出${detail}]\x1b[0m`);
          onStatusChangeRef.current("exited");
        }
      };

      const input = terminal.onData((data) => send(textEncoder.encode(data)));
      const binaryInput = terminal.onBinary((data) => send(binaryBytes(data)));
      terminal.attachCustomKeyEventHandler((event) => {
        if (event.metaKey && event.key.toLowerCase() === "k") {
          if (event.type === "keydown") terminal.clear();
          return false;
        }
        return true;
      });
      const observer = new ResizeObserver(scheduleFit);
      observer.observe(container);

      // 延后一帧创建，避免 React StrictMode 的开发期 effect 探测重复启动同一会话。
      const createTimer = window.setTimeout(() => {
        if (disposed) return;
        fitAddon.fit();
        void createTerminal({
          sessionId,
          cwd,
          cols: Math.max(1, terminal.cols),
          rows: Math.max(1, terminal.rows),
          onEvent: handleEvent,
        })
          .then(() => {
            if (disposed) {
              return closeTerminal(sessionId).catch(() => false);
            }
            startedRef.current = true;
            lastSizeRef.current = { cols: terminal.cols, rows: terminal.rows };
            onStatusChangeRef.current("running");
            if (activeVisibleRef.current) terminal.focus();
          })
          .catch((error: unknown) => {
            if (!disposed) reportError("启动终端失败", error);
          });
      }, 0);

      return () => {
        disposed = true;
        window.clearTimeout(createTimer);
        cancelAnimationFrame(resizeFrame);
        observer.disconnect();
        input.dispose();
        binaryInput.dispose();
        terminal.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
        lastSizeRef.current = { cols: 0, rows: 0 };
        if (startedRef.current) {
          startedRef.current = false;
          void closeTerminal(sessionId).catch((error: unknown) => {
            console.error("[Itera] 清理终端会话失败", { sessionId, error });
          });
        }
      };
    }, [cwd, send, sessionId]);

    useEffect(() => {
      if (!active || !visible) return;
      const frame = requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
        const terminal = terminalRef.current;
        if (!terminal) return;
        terminal.focus();
        if (!startedRef.current) return;
        lastSizeRef.current = { cols: terminal.cols, rows: terminal.rows };
        void resizeTerminal(sessionId, terminal.cols, terminal.rows).catch((error: unknown) => {
          console.error("[Itera] 激活终端时调整尺寸失败", { sessionId, error });
        });
      });
      return () => cancelAnimationFrame(frame);
    }, [active, sessionId, visible]);

    return (
      <div
        ref={containerRef}
        className="terminal-emulator"
        role="application"
        aria-label="交互式终端"
      />
    );
  },
);
