import { fileViewerFullPreset } from "@file-viewer/react-full";

const supportedExtensions = new Set(
  fileViewerFullPreset.renderers.flatMap((renderer) =>
    (renderer.definitions ?? []).flatMap((definition) => definition.extensions),
  ),
);

function previewExtension(path: string) {
  const name = path.split(/[\\/]/).pop() ?? path;
  const separator = name.lastIndexOf(".");
  return separator > 0 && separator < name.length - 1
    ? name.slice(separator + 1).toLowerCase()
    : "";
}

export function isFileViewerPreviewSupported(path: string) {
  const extension = previewExtension(path);
  return extension !== "" && supportedExtensions.has(extension);
}
