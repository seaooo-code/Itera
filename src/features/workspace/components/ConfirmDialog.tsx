import { Button, Dialog, Modal, ModalOverlay } from "react-aria-components";
import type { ConfirmState } from "./viewTypes";

interface ConfirmDialogProps {
  state: ConfirmState | null;
  busy: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ state, busy, onSave, onDiscard, onCancel }: ConfirmDialogProps) {
  return (
    <ModalOverlay
      isOpen={Boolean(state)}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
      isDismissable={!busy}
      className="fixed inset-0 z-50 grid place-items-center bg-[#29303a]/25 p-5 backdrop-blur-[1.5px]"
    >
      <Modal className="w-full max-w-[492px] overflow-hidden rounded-[14px] border border-[#dfe4e6] bg-white shadow-[0_30px_70px_-22px_rgba(41,48,58,0.46)]">
        <Dialog className="outline-none">
          {state ? (
            <>
              <div className="px-[18px] pb-3 pt-[15px]">
                <h2 className="m-0 text-[14px] font-semibold text-[#29303a]">{state.title}</h2>
                <p className="mb-0 mt-2 text-[12.5px] leading-6 text-[#6c737c]">{state.message}</p>
                <p className="mb-0 mt-2 font-mono text-[11px] text-[#8b9299]">
                  {state.dirtyPaths.length === 1
                    ? state.dirtyPaths[0]
                    : `${state.dirtyPaths.length} 个文件有未保存修改`}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#f5f7f7] px-3.5 py-3">
                <span className="flex-1 text-[11.5px] leading-5 text-[#6c737c]">
                  保存会直接写回你选择的本地目录。
                </span>
                <Button
                  isDisabled={busy}
                  className="h-8 rounded-[6px] border border-[#dfe4e6] bg-white px-3 text-[12px] font-medium text-[#29303a] outline-none hover:bg-[#edf0f2] focus-visible:ring-2 focus-visible:ring-[#3c8f55] disabled:opacity-50"
                  onPress={onDiscard}
                >
                  放弃修改
                </Button>
                <Button
                  isDisabled={busy}
                  className="h-8 rounded-[6px] border border-[#347d4a] bg-[#3c8f55] px-3 text-[12px] font-medium text-white outline-none hover:bg-[#337c49] focus-visible:ring-2 focus-visible:ring-[#3c8f55] disabled:opacity-50"
                  onPress={onSave}
                >
                  {busy ? "保存中…" : "保存"}
                </Button>
                <Button
                  isDisabled={busy}
                  className="h-8 rounded-[6px] border border-transparent px-2.5 text-[12px] text-[#6c737c] outline-none hover:bg-[#e9edef] focus-visible:ring-2 focus-visible:ring-[#3c8f55] disabled:opacity-50"
                  onPress={onCancel}
                >
                  取消
                </Button>
              </div>
            </>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
