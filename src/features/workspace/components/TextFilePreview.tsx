import { FileViewer, type ViewerOptions } from "@file-viewer/react-full";
import { useEffect, useMemo, useState } from "react";

interface TextFilePreviewProps {
  name: string;
  content: string;
}

const TEXT_VIEWER_OPTIONS: ViewerOptions = {
  theme: "light",
  styleIsolation: "scoped",
  ui: { density: "compact" },
  toolbar: false,
};

export function TextFilePreview({ name, content }: TextFilePreviewProps) {
  const [previewContent, setPreviewContent] = useState(content);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewContent(content), 200);
    return () => window.clearTimeout(timer);
  }, [content]);

  const buffer = useMemo(() => new TextEncoder().encode(previewContent).buffer, [previewContent]);

  return (
    <FileViewer
      buffer={buffer}
      filename={name}
      size={buffer.byteLength}
      options={TEXT_VIEWER_OPTIONS}
      className="h-full min-h-0 w-full"
      aria-label={`${name} 文件预览`}
    />
  );
}
