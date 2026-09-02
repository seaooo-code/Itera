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
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--itera-color-scrim)] p-5 backdrop-blur-[1.5px]"
    >
      <Modal className="w-full max-w-[492px] overflow-hidden rounded-[14px] border border-[var(--itera-color-border)] bg-[var(--itera-color-surface)] shadow-[var(--itera-shadow-dialog)]">
        <Dialog className="outline-none">
          {state ? (
            <>
              <div className="px-[18px] pb-3 pt-[15px]">
                <h2 className="m-0 text-[14px] font-semibold text-[var(--itera-color-ink)]">
                  {state.title}
                </h2>
                <p className="mb-0 mt-2 text-[12.5px] leading-6 text-[var(--itera-color-muted)]">
                  {state.message}
                </p>
                <p className="mb-0 mt-2 font-mono text-[11px] text-[var(--itera-color-faint)]">
                  {state.dirtyPaths.length === 1
                    ? state.dirtyPaths[0]
                    : `${state.dirtyPaths.length} 个文件有未保存修改`}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[var(--itera-color-sunken)] px-3.5 py-3">
                <span className="flex-1 text-[11.5px] leading-5 text-[var(--itera-color-muted)]">
                  保存会直接写回你选择的本地目录。
                </span>
                <Button
                  isDisabled={busy}
                  className="h-8 rounded-[6px] border border-[var(--itera-color-border)] bg-[var(--itera-color-surface)] px-3 text-[12px] font-medium text-[var(--itera-color-ink)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-50"
                  onPress={onDiscard}
                >
                  放弃修改
                </Button>
                <Button
                  isDisabled={busy}
                  className="h-8 rounded-[6px] border border-[var(--itera-color-primary-solid)] bg-[var(--itera-color-primary-solid)] px-3 text-[12px] font-medium text-[var(--itera-color-surface)] outline-none hover:bg-[var(--itera-color-primary-dark)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-50"
                  onPress={onSave}
                >
                  {busy ? "保存中…" : "保存"}
                </Button>
                <Button
                  isDisabled={busy}
                  className="h-8 rounded-[6px] border border-transparent px-2.5 text-[12px] text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-50"
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
