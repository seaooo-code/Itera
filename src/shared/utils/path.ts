export function shortPath(path: string) {
  return path.replace(/^\/Users\/[^/]+/, "~");
}

export function fileExtension(path: string) {
  const name = path.split(/[\\/]/).pop() ?? path;
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return extension === name.toLowerCase() ? "txt" : extension;
}
