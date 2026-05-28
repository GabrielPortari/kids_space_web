import { createPortal } from "react-dom";
import { GroupIcon } from "../../workspace/components/WorkspaceVisuals";
import {
  ProfileModal,
  ProfileModalSection,
} from "../../workspace/components/ProfileModal";
import {
  maskByFieldKey,
  maskPhone,
  maskZipCode,
} from "../../workspace/formatter";

type AdminViewModalProps = {
  isOpen: boolean;
  admin: any | null;
  onClose: () => void;
};

export function AdminViewModal({
  isOpen,
  admin,
  onClose,
}: AdminViewModalProps) {
  if (!isOpen || !admin) {
    return null;
  }

  return createPortal(
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      icon={<GroupIcon />}
      title={admin.name || "Admin"}
      subtitle={admin.email || "-"}
      mode="view"
    >
      <ProfileModalSection label="Dados pessoais">
        <div className="profile-form-fields-grid profile-form-personal-grid">
          <div className="field field-span-6">
            <label htmlFor="admin-view-name">Nome</label>
            <input
              id="admin-view-name"
              value={admin.name || "-"}
              disabled
              className="field-readonly"
            />
          </div>

          <div className="field field-span-6">
            <label htmlFor="admin-view-email">Email</label>
            <input
              id="admin-view-email"
              value={admin.email || "-"}
              disabled
              className="field-readonly"
            />
          </div>

          <div className="field field-span-4">
            <label htmlFor="admin-view-document">Documento</label>
            <input
              id="admin-view-document"
              value={maskByFieldKey("document", admin.document || "")}
              disabled
              className="field-readonly"
            />
          </div>

          <div className="field field-span-4">
            <label htmlFor="admin-view-contact">Contato</label>
            <input
              id="admin-view-contact"
              value={maskPhone(admin.contact || "")}
              disabled
              className="field-readonly"
            />
          </div>

          <div className="field field-span-4">
            <label htmlFor="admin-view-active">Status</label>
            <input
              id="admin-view-active"
              value={admin.active ? "Ativo" : "Inativo"}
              disabled
              className="field-readonly"
            />
          </div>
        </div>
      </ProfileModalSection>

      <ProfileModalSection label="Endereço">
        <div className="profile-form-address-stack">
          <div className="profile-form-fields-grid profile-form-address-grid">
            <div className="field field-span-6">
              <label htmlFor="admin-view-street">Rua</label>
              <input
                id="admin-view-street"
                value={admin.address?.street || "-"}
                disabled
                className="field-readonly"
              />
            </div>

            <div className="field field-span-1">
              <label htmlFor="admin-view-number">Número</label>
              <input
                id="admin-view-number"
                value={admin.address?.number || "-"}
                disabled
                className="field-readonly"
              />
            </div>

            <div className="field field-span-2">
              <label htmlFor="admin-view-complement">Complemento</label>
              <input
                id="admin-view-complement"
                value={admin.address?.complement || "-"}
                disabled
                className="field-readonly"
              />
            </div>

            <div className="field field-span-3">
              <label htmlFor="admin-view-district">Bairro</label>
              <input
                id="admin-view-district"
                value={admin.address?.neighborhood || "-"}
                disabled
                className="field-readonly"
              />
            </div>
          </div>

          <div className="profile-form-fields-grid profile-form-address-grid">
            <div className="field field-span-6">
              <label htmlFor="admin-view-city">Cidade</label>
              <input
                id="admin-view-city"
                value={admin.address?.city || "-"}
                disabled
                className="field-readonly"
              />
            </div>

            <div className="field field-span-1">
              <label htmlFor="admin-view-state">Estado</label>
              <input
                id="admin-view-state"
                value={admin.address?.state || "-"}
                disabled
                className="field-readonly"
              />
            </div>

            <div className="field field-span-2">
              <label htmlFor="admin-view-zipcode">CEP</label>
              <input
                id="admin-view-zipcode"
                value={maskZipCode(admin.address?.zipcode || "")}
                disabled
                className="field-readonly"
              />
            </div>

            <div className="field field-span-3">
              <label htmlFor="admin-view-country">País</label>
              <input
                id="admin-view-country"
                value={admin.address?.country || "-"}
                disabled
                className="field-readonly"
              />
            </div>
          </div>
        </div>
      </ProfileModalSection>
    </ProfileModal>,
    document.body,
  );
}
