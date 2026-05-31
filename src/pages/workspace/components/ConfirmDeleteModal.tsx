import { createPortal } from "react-dom";
import { ProfileModal } from "./ProfileModal";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function ConfirmDeleteModal({
  isOpen,
  title = "Confirmar exclusão",
  message = "Quer mesmo excluir este item?",
  onConfirm,
  onCancel,
  isLoading = false,
  confirmLabel = "Excluir",
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <ProfileModal
      isOpen={isOpen}
      onClose={onCancel}
      icon={<></>}
      title={title}
      mode="create"
      onSubmit={(e) => {
        e.preventDefault();
        void Promise.resolve(onConfirm());
      }}
      submitLabel={confirmLabel}
      isPending={isLoading}
      modalClassName="crm-modal-sm"
    >
      <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.9375rem" }}>
        {message}
      </p>
    </ProfileModal>,
    document.body,
  );
}
