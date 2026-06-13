import { type FormEvent, type ReactNode } from "react";
import { ModalIconWrap } from "./WorkspaceVisuals";

export type ProfileModalMode = "view" | "create" | "edit";

export type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  mode?: ProfileModalMode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  isPending?: boolean;
  children: ReactNode;
  footerLeft?: ReactNode;
  hideFooter?: boolean;
  headerActions?: ReactNode;
  modalClassName?: string;
};

export function ProfileModal({
  isOpen,
  onClose,
  icon,
  title,
  subtitle,
  mode = "create",
  onSubmit,
  submitLabel,
  isPending = false,
  children,
  footerLeft,
  hideFooter,
  headerActions,
  modalClassName,
}: ProfileModalProps) {
  if (!isOpen) {
    return null;
  }

  const defaultSubmitLabel =
    submitLabel ?? (mode === "edit" ? "Salvar alterações" : "Salvar");
  const showFooter = !hideFooter && mode !== "view";
  const defaultFooterLeft =
    mode === "edit" ? (
      <p className="profile-modal-hint">
        🔒 Campos acinzentados são somente leitura
      </p>
    ) : null;
  const resolvedFooterLeft =
    footerLeft !== undefined ? footerLeft : defaultFooterLeft;

  const header = (
    <div className="profile-modal-header">
      <div className="profile-modal-header-left">
        <ModalIconWrap>{icon}</ModalIconWrap>
        <div>
          <p className="profile-modal-title">{title}</p>
          {subtitle && <p className="profile-modal-subtitle">{subtitle}</p>}
        </div>
      </div>

      {headerActions ? (
        <div className="profile-modal-footer-actions">{headerActions}</div>
      ) : (
        <button
          type="button"
          className="profile-modal-close"
          aria-label="Fechar"
          onClick={onClose}
        >
          ✕
        </button>
      )}
    </div>
  );

  const footer = showFooter && (
    <div className="profile-modal-footer">
      {resolvedFooterLeft}
      <div className="profile-modal-footer-actions">
        <button
          type="button"
          className="btn outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancelar
        </button>
        <button type="submit" className="btn solid" disabled={isPending}>
          {isPending ? "Salvando..." : defaultSubmitLabel}
        </button>
      </div>
    </div>
  );

  const body =
    mode === "view" ? (
      <div className="profile-form">
        <div className="profile-form-body">{children}</div>
      </div>
    ) : (
      <form className="profile-form" onSubmit={onSubmit}>
        <div className="profile-form-body">{children}</div>
        {footer}
      </form>
    );

  const shell = (
    <div className="crm-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className={`crm-modal crm-modal-wide profile-modal${modalClassName ? ` ${modalClassName}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        {header}
        {body}
      </section>
    </div>
  );

  return shell;
}

export function ProfileModalSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="profile-form-section">
      <div className="profile-form-section-header">
        <span className="profile-form-section-label">{label}</span>
        <div className="profile-form-section-line" />
      </div>
      {children}
    </div>
  );
}
