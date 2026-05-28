import { createPortal } from "react-dom";
import { useState } from "react";
import { ModalIconWrap, GroupIcon } from "../../workspace/components/WorkspaceVisuals";
import { maskByFieldKey, maskPhone, maskZipCode, normalizeDigits } from "../../workspace/formatter";

type AdminModalProps = {
  isOpen: boolean;
  initial?: any;
  onClose: () => void;
  onSave: (payload: any) => Promise<any> | void;
  isLoading?: boolean;
  error?: string | null;
};

export function AdminModal({ isOpen, initial, onClose, onSave, isLoading = false, error }: AdminModalProps) {
  const [form, setForm] = useState<any>({
    name: initial?.name || "",
    email: initial?.email || "",
    document: initial?.document || "",
    contact: initial?.contact || "",
    addressStreet: initial?.address?.street || "",
    addressNumber: initial?.address?.number || "",
    addressComplement: initial?.address?.complement || "",
    addressDistrict: initial?.address?.neighborhood || "",
    addressCity: initial?.address?.city || "",
    addressState: initial?.address?.state || "",
    addressZipCode: initial?.address?.zipcode || "",
    addressCountry: initial?.address?.country || "",
    active: initial?.active ?? true,
  });

  if (!isOpen) return null;

  const update = (patch: Partial<typeof form>) => setForm((cur: any) => ({ ...cur, ...patch }));

  return createPortal(
    <div className="crm-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="crm-modal crm-modal-wide profile-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} aria-label={initial?.id ? "Editar admin" : "Adicionar admin"}>
        <div className="profile-modal-header">
          <div className="profile-modal-header-left">
            <ModalIconWrap>
              <GroupIcon />
            </ModalIconWrap>
            <div>
              <p className="profile-modal-title">{initial?.id ? "Editar Admin" : "Novo Admin"}</p>
              <p className="profile-modal-subtitle">Preencha os dados do admin</p>
            </div>
          </div>
          <button className="profile-modal-close" type="button" aria-label="Fechar" onClick={onClose}>
            ✕
          </button>
        </div>

        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            const payload = {
              name: form.name.trim(),
              email: form.email.trim(),
              document: form.document || undefined,
              contact: form.contact || undefined,
              address: {
                street: form.addressStreet || undefined,
                number: form.addressNumber || undefined,
                complement: form.addressComplement || undefined,
                neighborhood: form.addressDistrict || undefined,
                city: form.addressCity || undefined,
                state: form.addressState || undefined,
                zipcode: form.addressZipCode || undefined,
                country: form.addressCountry || undefined,
              },
              active: form.active,
            };

            onSave(payload);
          }}
        >
          <div className="profile-form-body">
            <div className="profile-form-section">
              <div className="profile-form-section-header">
                <span className="profile-form-section-label">Dados pessoais</span>
                <div className="profile-form-section-line" />
              </div>

              <div className="profile-form-fields-grid profile-form-personal-grid">
                <div className="field field-span-12">
                  <label htmlFor="admin-name">Nome</label>
                  <input id="admin-name" value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Nome completo" required />
                </div>

                <div className="field field-span-4">
                  <label htmlFor="admin-email">Email</label>
                  <input id="admin-email" type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="email@exemplo.com" required />
                </div>

                <div className="field field-span-4">
                  <label htmlFor="admin-document">CPF/CNPJ</label>
                  <input id="admin-document" value={maskByFieldKey("document", form.document)} onChange={(e) => update({ document: normalizeDigits(e.target.value).slice(0, 14) })} placeholder="000.000.000-00" />
                </div>

                <div className="field field-span-4">
                  <label htmlFor="admin-contact">Contato</label>
                  <input id="admin-contact" value={maskPhone(form.contact)} onChange={(e) => update({ contact: normalizeDigits(e.target.value).slice(0, 11) })} placeholder="(00) 00000-0000" />
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
                    <label htmlFor="admin-address-street">Rua</label>
                    <input id="admin-address-street" value={form.addressStreet} onChange={(e) => update({ addressStreet: e.target.value })} />
                  </div>

                  <div className="field field-span-1">
                    <label htmlFor="admin-address-number">Número</label>
                    <input id="admin-address-number" value={form.addressNumber} onChange={(e) => update({ addressNumber: e.target.value })} />
                  </div>

                  <div className="field field-span-2">
                    <label htmlFor="admin-address-complement">Complemento</label>
                    <input id="admin-address-complement" value={form.addressComplement} onChange={(e) => update({ addressComplement: e.target.value })} />
                  </div>

                  <div className="field field-span-3">
                    <label htmlFor="admin-address-district">Bairro</label>
                    <input id="admin-address-district" value={form.addressDistrict} onChange={(e) => update({ addressDistrict: e.target.value })} />
                  </div>
                </div>

                <div className="profile-form-fields-grid profile-form-address-grid">
                  <div className="field field-span-6">
                    <label htmlFor="admin-address-city">Cidade</label>
                    <input id="admin-address-city" value={form.addressCity} onChange={(e) => update({ addressCity: e.target.value })} />
                  </div>

                  <div className="field field-span-1">
                    <label htmlFor="admin-address-state">Estado</label>
                    <input id="admin-address-state" value={form.addressState} onChange={(e) => update({ addressState: e.target.value })} />
                  </div>

                  <div className="field field-span-2">
                    <label htmlFor="admin-address-zipcode">CEP</label>
                    <input id="admin-address-zipcode" value={maskZipCode(form.addressZipCode || "")} onChange={(e) => update({ addressZipCode: normalizeDigits(e.target.value).slice(0, 8) })} placeholder="00000-000" />
                  </div>

                  <div className="field field-span-3">
                    <label htmlFor="admin-address-country">País</label>
                    <input id="admin-address-country" value={form.addressCountry} onChange={(e) => update({ addressCountry: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-modal-footer">
            <div className="profile-modal-footer-actions">
              <button type="button" className="btn outline" onClick={onClose} disabled={isLoading}>Cancelar</button>
              <button type="submit" className="btn solid" disabled={isLoading}>{isLoading ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>

          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        </form>
      </section>
    </div>,
    document.body,
  );
}
