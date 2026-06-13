import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bootstrapAdmin } from "../../../api/modules/adminApi";
import {
  ProfileModal,
  ProfileModalSection,
} from "../../workspace/components/ProfileModal";
import { StatusMessage } from "../../workspace/components/StatusMessage";
import {
  GroupIcon,
  PlusIcon,
  RefreshIcon,
} from "../../workspace/components/WorkspaceVisuals";

type BootstrapFormState = {
  bootstrapKey: string;
  name: string;
  email: string;
  document: string;
  contact: string;
  active: boolean;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
};

const INITIAL_FORM: BootstrapFormState = {
  bootstrapKey: "",
  name: "",
  email: "",
  document: "",
  contact: "",
  active: true,
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
  addressCountry: "",
};

type BootstrapResult = Awaited<ReturnType<typeof bootstrapAdmin>>;

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function hasAddressData(form: BootstrapFormState): boolean {
  return [
    form.addressStreet,
    form.addressNumber,
    form.addressComplement,
    form.addressNeighborhood,
    form.addressCity,
    form.addressState,
    form.addressZipCode,
    form.addressCountry,
  ].some((value) => value.trim().length > 0);
}

function buildBootstrapPayload(form: BootstrapFormState) {
  const addressPresent = hasAddressData(form);

  if (
    addressPresent &&
    (!form.addressStreet.trim() ||
      !form.addressNumber.trim() ||
      !form.addressNeighborhood.trim() ||
      !form.addressCity.trim() ||
      !form.addressState.trim())
  ) {
    throw new Error(
      "Se preencher endereço, informe rua, número, bairro, cidade e estado.",
    );
  }

  return {
    bootstrapKey: form.bootstrapKey.trim(),
    name: form.name.trim(),
    email: form.email.trim(),
    document: trimOrUndefined(form.document),
    contact: trimOrUndefined(form.contact),
    active: form.active,
    ...(addressPresent
      ? {
          address: {
            street: form.addressStreet.trim(),
            number: form.addressNumber.trim(),
            complement: trimOrUndefined(form.addressComplement),
            neighborhood: form.addressNeighborhood.trim(),
            city: form.addressCity.trim(),
            state: form.addressState.trim(),
            zipcode: trimOrUndefined(form.addressZipCode),
            country: trimOrUndefined(form.addressCountry),
          },
        }
      : {}),
  };
}

export function BootstrapSection() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BootstrapFormState>(INITIAL_FORM);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bootstrapResult, setBootstrapResult] =
    useState<BootstrapResult | null>(null);

  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const payload = buildBootstrapPayload(form);
      if (!payload.bootstrapKey) {
        throw new Error("A bootstrap key é obrigatória.");
      }
      if (!payload.name || !payload.email) {
        throw new Error("Nome e email são obrigatórios.");
      }

      return bootstrapAdmin(payload);
    },
    onSuccess: async (result) => {
      setBootstrapResult(result);
      setForm(INITIAL_FORM);
      setErrorMessage(null);
      setStatusMessage("Bootstrap do primeiro master concluído com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["master", "admins"] });
      window.setTimeout(() => setStatusMessage(null), 3000);
    },
    onError: (error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    },
  });

  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <div className="crm-panel-title-group">
          <h2>Bootstrap master</h2>
          <span className="pill">Init</span>
        </div>
        <div className="crm-panel-head-actions">
          <button
            type="button"
            className="btn solid crm-add-button"
            onClick={() => {
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon />
            Adicionar novo
          </button>
          <button
            type="button"
            className="btn outline crm-icon-btn"
            onClick={() => {
              setForm(INITIAL_FORM);
              setErrorMessage(null);
            }}
            title="Limpar formulário"
            aria-label="Limpar formulário"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <StatusMessage message={statusMessage} />

      <p className="operation-hint">
        Clique em <strong>Adicionar novo</strong> para abrir o modal de criação.
      </p>

      {bootstrapResult ? (
        <article className="profile-card" style={{ marginTop: 16 }}>
          <span>Master criado</span>
          <strong>{bootstrapResult.name}</strong>
          <p style={{ margin: "0.35rem 0 0" }}>
            Email: {bootstrapResult.email}
          </p>
          <p style={{ margin: 0 }}>ID: {bootstrapResult.id}</p>
        </article>
      ) : null}

      {createPortal(
        <ProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          icon={<GroupIcon />}
          title="Novo master"
          subtitle="Use a bootstrap key para criar o primeiro administrador master"
          mode="create"
          submitLabel="Adicionar master"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);
            setBootstrapResult(null);
            void bootstrapMutation.mutateAsync().then(() => {
              setIsModalOpen(false);
            });
          }}
          isPending={bootstrapMutation.isPending}
          footerLeft={
            errorMessage ? <p className="auth-error">{errorMessage}</p> : null
          }
        >
          <ProfileModalSection label="Dados do master">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label htmlFor="bootstrap-key">Bootstrap key</label>
                <input
                  id="bootstrap-key"
                  value={form.bootstrapKey}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bootstrapKey: event.target.value,
                    }))
                  }
                  placeholder="Chave do bootstrap"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="bootstrap-name">Nome</label>
                <input
                  id="bootstrap-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nome do master"
                  required
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="bootstrap-email">Email</label>
                <input
                  id="bootstrap-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="bootstrap-document">Documento</label>
                <input
                  id="bootstrap-document"
                  value={form.document}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      document: event.target.value,
                    }))
                  }
                  placeholder="CPF ou documento"
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="bootstrap-contact">Contato</label>
                <input
                  id="bootstrap-contact"
                  value={form.contact}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contact: event.target.value,
                    }))
                  }
                  placeholder="Telefone ou contato"
                />
              </div>

              <div className="field field-span-12">
                <label htmlFor="bootstrap-active">Ativo</label>
                <select
                  id="bootstrap-active"
                  value={form.active ? "true" : "false"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="profile-form-section-label">
                Endereço opcional
              </span>
              <span className="profile-form-section-line" />
            </div>

            <div className="profile-form-fields-grid profile-form-address-grid">
              <div className="field field-span-6">
                <label htmlFor="bootstrap-street">Rua</label>
                <input
                  id="bootstrap-street"
                  value={form.addressStreet}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressStreet: event.target.value,
                    }))
                  }
                  placeholder="Rua"
                />
              </div>

              <div className="field field-span-3">
                <label htmlFor="bootstrap-number">Número</label>
                <input
                  id="bootstrap-number"
                  value={form.addressNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressNumber: event.target.value,
                    }))
                  }
                  placeholder="123"
                />
              </div>

              <div className="field field-span-3">
                <label htmlFor="bootstrap-complement">Complemento</label>
                <input
                  id="bootstrap-complement"
                  value={form.addressComplement}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressComplement: event.target.value,
                    }))
                  }
                  placeholder="Apto, bloco, etc."
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="bootstrap-neighborhood">Bairro</label>
                <input
                  id="bootstrap-neighborhood"
                  value={form.addressNeighborhood}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressNeighborhood: event.target.value,
                    }))
                  }
                  placeholder="Bairro"
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="bootstrap-city">Cidade</label>
                <input
                  id="bootstrap-city"
                  value={form.addressCity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressCity: event.target.value,
                    }))
                  }
                  placeholder="Cidade"
                />
              </div>

              <div className="field field-span-4">
                <label htmlFor="bootstrap-state">Estado</label>
                <input
                  id="bootstrap-state"
                  value={form.addressState}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressState: event.target.value,
                    }))
                  }
                  placeholder="UF"
                />
              </div>

              <div className="field field-span-4">
                <label htmlFor="bootstrap-zipcode">CEP</label>
                <input
                  id="bootstrap-zipcode"
                  value={form.addressZipCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressZipCode: event.target.value,
                    }))
                  }
                  placeholder="00000-000"
                />
              </div>

              <div className="field field-span-4">
                <label htmlFor="bootstrap-country">País</label>
                <input
                  id="bootstrap-country"
                  value={form.addressCountry}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressCountry: event.target.value,
                    }))
                  }
                  placeholder="Brasil"
                />
              </div>
            </div>
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}
    </section>
  );
}
