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
  if (!isOpen) {
    return null;
  }

  return (
    <div className="crm-modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="crm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="crm-modal-actions">
          <button
            type="button"
            className="btn outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Carregando..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
