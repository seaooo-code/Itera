import { Button, Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Icon } from "../../../shared/components/Icon";
import type { ConfirmState } from "./viewTypes";

const PATH_LIST_LIMIT = 4;

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
      <Modal className="w-full max-w-[440px] overflow-hidden rounded-[14px] border border-[var(--itera-color-border)] bg-[var(--itera-color-surface)] shadow-[var(--itera-shadow-dialog)]">
        <Dialog className="outline-none">
          {state ? (
            <>
              <div className="relative px-5 pb-4 pt-5">
                <Button
                  isDisabled={busy}
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-[6px] border border-transparent text-[var(--itera-color-muted)] outline-none hover:bg-[var(--itera-color-hover)] hover:text-[var(--itera-color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-50"
                  aria-label="取消关闭"
                  onPress={onCancel}
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                </Button>
                <div className="flex gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--itera-color-warning-soft)] text-[var(--itera-color-warning)]">
                    <Icon name="warning" className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 pr-6 pt-0.5">
                    <h2 className="m-0 text-[14px] font-semibold text-[var(--itera-color-ink)]">
                      {state.title}
                    </h2>
                    <p className="mb-0 mt-1.5 text-[12.5px] leading-6 text-[var(--itera-color-muted)]">
                      {state.message}
                    </p>
                  </div>
                </div>
                {state.dirtyPaths.length > 1 ? (
                  <div className="ml-12 mt-3 flex flex-col gap-1 rounded-[8px] border border-[var(--itera-color-border-soft)] bg-[var(--itera-color-sunken)] px-2.5 py-2">
                    {state.dirtyPaths.length <= PATH_LIST_LIMIT ? (
                      state.dirtyPaths.map((path) => (
                        <span
                          key={path}
                          className="truncate font-mono text-[11px] text-[var(--itera-color-subtle)]"
                        >
                          {path}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-[11px] text-[var(--itera-color-subtle)]">
                        {state.dirtyPaths.length} 个文件有未保存修改
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-1">
                <Button
                  isDisabled={busy}
                  className="h-8 rounded-[7px] border border-transparent bg-transparent px-3 text-[12px] font-medium text-[var(--itera-color-danger)] outline-none hover:bg-[var(--itera-color-danger-soft)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-50"
                  onPress={onDiscard}
                >
                  不保存
                </Button>
                <Button
                  isDisabled={busy}
                  className="h-8 rounded-[7px] border border-[var(--itera-color-primary-solid)] bg-[var(--itera-color-primary-solid)] px-3.5 text-[12px] font-medium text-[var(--itera-color-surface)] outline-none hover:bg-[var(--itera-color-primary-dark)] focus-visible:ring-2 focus-visible:ring-[var(--itera-color-primary-solid)] disabled:opacity-50"
                  onPress={onSave}
                >
                  {busy ? "保存中…" : "保存"}
                </Button>
              </div>
            </>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
