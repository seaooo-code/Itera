import type { FileTreeNode } from "../../../services/tauri/filesystem";
import { Icon } from "../../../shared/components/Icon";
import { fileExtension } from "../../../shared/utils/path";

export function FileIcon({ node }: { node: FileTreeNode }) {
  if (node.type === "directory") {
    return <Icon name="folder" className="h-[15px] w-[15px] text-[#6c737c]" />;
  }

  const extension = fileExtension(node.name);
  const tone = ["ts", "tsx"].includes(extension)
    ? "text-[#3e617d]"
    : ["js", "jsx", "mjs", "cjs"].includes(extension)
      ? "text-[#96721a]"
      : ["md", "markdown"].includes(extension)
        ? "text-[#7441a8]"
        : "text-[#6c737c]";

  return (
    <span
      className={`grid h-[15px] w-[15px] place-items-center text-[9px] font-semibold uppercase ${tone}`}
      aria-hidden="true"
    >
      {extension.slice(0, 2)}
    </span>
  );
}
