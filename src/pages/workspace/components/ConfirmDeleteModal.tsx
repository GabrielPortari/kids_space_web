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
  title = "Confirmar exclusao",
  message = "Quer mesmo excluir este item?",
  onConfirm,
  onCancel,
  isLoading = false,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  void cancelLabel;

  return createPortal(
    <ProfileModal
      isOpen={isOpen}
      onClose={onCancel}
      icon={<></>}
      title={title}
      subtitle={undefined}
      mode="create"
      onSubmit={(e) => {
        e.preventDefault();
        void Promise.resolve(onConfirm());
      }}
      submitLabel={confirmLabel}
      isPending={isLoading}
      footerLeft={undefined}
    >
      <div>
        <p>{message}</p>
      </div>
    </ProfileModal>,
    document.body,
  );
}
