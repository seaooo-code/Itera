import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "react-aria-components";
import { Icon } from "../../../shared/components/Icon";
import {
  TerminalEmulator,
  type TerminalEmulatorHandle,
  type TerminalStatus,
} from "./TerminalEmulator";

const MAX_SESSIONS = 4;
const TERMINAL_FONT = '400 12.5px "Itera JetBrainsMono Nerd Font Mono"';
let nextSessionId = 0;

interface TerminalSession {
  id: string;
  name: string;
  status: TerminalStatus;
}

interface TerminalPanelProps {
  projectPath: string;
  projectName: string;
  visible: boolean;
  height: number;
  onHide: () => void;
  onRunningCountChange: (count: number) => void;
}

function createSession(projectName: string): TerminalSession {
  nextSessionId += 1;
  return {
    id: `terminal-${Date.now()}-${nextSessionId}`,
    name: `${projectName} ${nextSessionId}`,
    status: "starting",
  };
}

function statusLabel(status: TerminalStatus) {
  if (status === "starting") return "正在启动";
  if (status === "running") return "Shell 正在运行";
  if (status === "exited") return "Shell 已退出";
  return "启动失败";
}

export function TerminalPanel({
  projectPath,
  projectName,
  visible,
  height,
  onHide,
  onRunningCountChange,
}: TerminalPanelProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>(() => [createSession(projectName)]);
  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0].id);
  const [initialized, setInitialized] = useState(visible);
  const [fontReady, setFontReady] = useState(false);
  const emulatorRefs = useRef(new Map<string, TerminalEmulatorHandle>());

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const runningCount = useMemo(
    () => sessions.filter((session) => session.status === "running").length,
    [sessions],
  );

  useEffect(() => onRunningCountChange(runningCount), [onRunningCountChange, runningCount]);
  useEffect(() => () => onRunningCountChange(0), [onRunningCountChange]);
  useEffect(() => {
    if (visible) setInitialized(true);
  }, [visible]);
  useEffect(() => {
    if (!initialized || fontReady) return;
    let cancelled = false;
    void document.fonts
      .load(TERMINAL_FONT)
      .catch((error: unknown) => {
        console.warn("[Itera] 内置终端字体加载失败，将使用后备等宽字体", { error });
      })
      .then(() => {
        if (!cancelled) setFontReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fontReady, initialized]);

  const focusActive = useCallback(() => {
    queueMicrotask(() => emulatorRefs.current.get(activeSessionId)?.focus());
  }, [activeSessionId]);

  const updateStatus = useCallback((sessionId: string, status: TerminalStatus) => {
    setSessions((current) =>
      current.map((session) => (session.id === sessionId ? { ...session, status } : session)),
    );
  }, []);

  const addSession = useCallback(() => {
    setSessions((current) => {
      if (current.length >= MAX_SESSIONS) return current;
      const session = createSession(projectName);
      setActiveSessionId(session.id);
      return [...current, session];
    });
  }, [projectName]);

  const closeSession = useCallback((sessionId: string) => {
    setSessions((current) => {
      if (current.length <= 1) return current;
      const index = current.findIndex((session) => session.id === sessionId);
      if (index < 0) return current;
      emulatorRefs.current.delete(sessionId);
      const next = current.filter((session) => session.id !== sessionId);
      setActiveSessionId((active) =>
        active === sessionId ? next[Math.max(0, index - 1)].id : active,
      );
      return next;
    });
  }, []);

  const restartSession = useCallback(
    (sessionId: string) => {
      const replacement = createSession(projectName);
      setSessions((current) =>
        current.map((session) => (session.id === sessionId ? replacement : session)),
      );
      setActiveSessionId(replacement.id);
    },
    [projectName],
  );

  if (!activeSession) return null;

  return (
    <section
      className={`${visible ? "flex" : "hidden"} min-h-0 shrink-0 flex-col overflow-hidden rounded-[9px] bg-[var(--itera-color-surface)] shadow-[var(--itera-shadow-panel)]`}
      style={{ height }}
      aria-label="终端"
    >
      <div className="flex h-8 shrink-0 items-center gap-[3px] px-1.5 pl-2">
        <div
          className="flex min-w-0 items-center gap-[3px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="终端会话"
        >
          {sessions.map((session) => {
            const selected = session.id === activeSession.id;
            const live = session.status === "running" || session.status === "starting";
            return (
              <div
                key={session.id}
                className={`group relative flex h-[26px] max-w-[194px] shrink-0 items-center rounded-[6px] font-mono text-[11.5px] ${selected ? "bg-[var(--itera-color-primary-soft)] text-[var(--itera-color-ink)]" : "text-[var(--itera-color-muted)] hover:bg-[var(--itera-color-sunken)] hover:text-[var(--itera-color-ink)]"}`}
              >
                {selected ? (
                  <i className="absolute inset-y-[5px] left-0 w-0.5 rounded-r bg-[var(--itera-color-primary)]" />
                ) : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`terminal-view-${session.id}`}
                  tabIndex={selected ? 0 : -1}
                  title={`${session.name} · ${statusLabel(session.status)}`}
                  className="flex h-[26px] min-w-0 items-center gap-1.5 border-0 bg-transparent py-0 pl-[11px] pr-1 font-inherit text-inherit outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--itera-color-primary-solid)]"
                  onClick={() => {
                    setActiveSessionId(session.id);
                    queueMicrotask(() => emulatorRefs.current.get(session.id)?.focus());
                  }}
                  onKeyDown={(event) => {
                    const index = sessions.findIndex((item) => item.id === session.id);
                    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                      event.preventDefault();
                      const offset = event.key === "ArrowRight" ? 1 : sessions.length - 1;
                      setActiveSessionId(sessions[(index + offset) % sessions.length].id);
                    } else if (event.key === "Delete" || event.key === "Backspace") {
                      event.preventDefault();
                      closeSession(session.id);
                    }
                  }}
                >
                  <i
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${live ? "animate-pulse bg-[var(--itera-color-primary)]" : session.status === "error" ? "bg-[var(--itera-color-danger)]" : "bg-[var(--itera-color-muted)]"}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{session.name}</span>
                </button>
                {sessions.length > 1 ? (
                  <button
                    type="button"
                    className="mr-px grid h-6 w-6 shrink-0 place-items-center rounded-[5px] border-0 bg-transparent text-inherit outline-none hover:bg-[var(--itera-color-press)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--itera-color-primary-solid)]"
                    aria-label={`关闭会话 ${session.name}`}
                    onClick={() => closeSession(session.id)}
                  >
                    <Icon name="close" className="h-[11px] w-[11px]" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        <Button
          isDisabled={sessions.length >= MAX_SESSIONS}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-[5px] text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-40"
          aria-label="新建终端会话（最多 4 个）"
          onPress={addSession}
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
        </Button>
        <span className="flex-1" />
        <Button
          className="h-6 shrink-0 rounded-[5px] border border-transparent bg-transparent px-2 font-mono text-[11px] text-[var(--itera-color-muted)] outline-none hover:border-[var(--itera-color-border)] hover:bg-[var(--itera-color-hover)] hover:text-[var(--itera-color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-40"
          isDisabled={activeSession.status === "starting"}
          onPress={() => {
            if (activeSession.status === "running") {
              emulatorRefs.current.get(activeSession.id)?.interrupt();
            } else {
              restartSession(activeSession.id);
            }
          }}
        >
          {activeSession.status === "running" ? "中断 ⌃C" : "重启 Shell"}
        </Button>
        <Button
          className="h-6 shrink-0 rounded-[5px] border border-transparent bg-transparent px-2 font-mono text-[11px] text-[var(--itera-color-muted)] outline-none hover:border-[var(--itera-color-border)] hover:bg-[var(--itera-color-hover)] hover:text-[var(--itera-color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]"
          onPress={() => {
            emulatorRefs.current.get(activeSession.id)?.clear();
            focusActive();
          }}
        >
          清空
        </Button>
        <Button
          className="grid h-6 w-6 shrink-0 place-items-center rounded-[5px] text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] hover:text-[var(--itera-color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)]"
          aria-label="隐藏终端面板（⌘J）"
          onPress={onHide}
        >
          <Icon name="close" className="h-[11px] w-[11px]" />
        </Button>
      </div>

      <div className="relative min-h-0 flex-1" aria-live="off">
        {initialized && fontReady
          ? sessions.map((session) => {
              const active = session.id === activeSession.id;
              return (
                <div
                  id={`terminal-view-${session.id}`}
                  key={session.id}
                  role="tabpanel"
                  aria-label={session.name}
                  className={active ? "absolute inset-0" : "hidden"}
                >
                  <TerminalEmulator
                    ref={(handle) => {
                      if (handle) emulatorRefs.current.set(session.id, handle);
                      else emulatorRefs.current.delete(session.id);
                    }}
                    sessionId={session.id}
                    cwd={projectPath}
                    active={active}
                    visible={visible}
                    onStatusChange={(status) => updateStatus(session.id, status)}
                  />
                </div>
              );
            })
          : null}
      </div>
    </section>
  );
}
