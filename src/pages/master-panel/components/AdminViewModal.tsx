import { createPortal } from "react-dom";
import { ModalIconWrap, GroupIcon } from "../../workspace/components/WorkspaceVisuals";

type AdminViewModalProps = {
  isOpen: boolean;
  admin: any | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
};

export function AdminViewModal({ isOpen, admin, onClose, onEdit, onDelete, isDeleting = false }: AdminViewModalProps) {
  if (!isOpen || !admin) return null;

  return createPortal(
    <div className="crm-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="crm-modal crm-modal-wide profile-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div className="profile-modal-header-left">
            <ModalIconWrap>
              <GroupIcon />
            </ModalIconWrap>
            <div>
              <p className="profile-modal-title">{admin.name || "Admin"}</p>
              <p className="profile-modal-subtitle">{admin.email}</p>
            </div>
          </div>

          <div className="profile-modal-footer-actions">
            <button type="button" className="btn outline" onClick={onEdit}>Editar</button>
            <button type="button" className="btn danger outline" onClick={onDelete} disabled={isDeleting}>{isDeleting ? "Deletando..." : "Deletar"}</button>
            <button type="button" className="profile-modal-close" onClick={onClose}>Fechar</button>
          </div>
        </div>

        <div className="profile-form-body">
          <div className="profile-form-section">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-6">
                <label>Nome</label>
                <div>{admin.name || "-"}</div>
              </div>
              <div className="field field-span-6">
                <label>Email</label>
                <div>{admin.email || "-"}</div>
              </div>
              <div className="field field-span-4">
                <label>Documento</label>
                <div>{admin.document || "-"}</div>
              </div>
              <div className="field field-span-4">
                <label>Contato</label>
                <div>{admin.contact || "-"}</div>
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="profile-form-section-header">
              <span className="profile-form-section-label">Endereço</span>
              <div className="profile-form-section-line" />
            </div>

            <div className="profile-form-address-stack">
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label>Rua</label>
                  <div>{admin.address?.street || "-"}</div>
                </div>
                <div className="field field-span-1">
                  <label>Número</label>
                  <div>{admin.address?.number || "-"}</div>
                </div>
                <div className="field field-span-2">
                  <label>Complemento</label>
                  <div>{admin.address?.complement || "-"}</div>
                </div>
                <div className="field field-span-3">
                  <label>Bairro</label>
                  <div>{admin.address?.neighborhood || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
