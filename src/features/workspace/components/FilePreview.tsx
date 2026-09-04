import { FileViewer, type ViewerOptions } from "@file-viewer/react-full";
import { useEffect, useState } from "react";
import { formatFileError, readProjectFileBuffer } from "../../../services/tauri/filesystem";

interface FilePreviewProps {
  path: string;
  name: string;
  byteLength: number;
}

type PreviewState =
  | { status: "loading"; buffer: null; error: null }
  | { status: "ready"; buffer: ArrayBuffer; error: null }
  | { status: "error"; buffer: null; error: string };

const VIEWER_OPTIONS: ViewerOptions = {
  theme: "light",
  styleIsolation: "shadow",
  ui: { density: "compact" },
  toolbar: { position: "top" },
};

export function FilePreview({ path, name, byteLength }: FilePreviewProps) {
  const [state, setState] = useState<PreviewState>({
    status: "loading",
    buffer: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", buffer: null, error: null });

    void readProjectFileBuffer(path)
      .then((buffer) => {
        if (!cancelled) setState({ status: "ready", buffer, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[Itera] 读取文件预览数据失败", { path, error });
        setState({
          status: "error",
          buffer: null,
          error: formatFileError(error, "读取文件预览数据失败"),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (state.status === "loading") {
    return (
      <div
        className="grid h-full place-items-center text-[12.5px] text-[var(--itera-color-muted)]"
        role="status"
        aria-live="polite"
      >
        正在加载 {name}…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className="grid h-full place-items-center px-6 text-center"
        role="status"
        aria-live="polite"
      >
        <div>
          <h2 className="m-0 text-[14px] font-semibold text-[var(--itera-color-danger)]">
            无法预览此文件
          </h2>
          <p className="mb-0 mt-2 max-w-[56ch] text-[12.5px] leading-[1.7] text-[var(--itera-color-muted)]">
            {state.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <FileViewer
      buffer={state.buffer}
      filename={name}
      size={byteLength}
      options={VIEWER_OPTIONS}
      className="h-full min-h-0 w-full"
      aria-label={`${name} 文件预览`}
    />
  );
}
