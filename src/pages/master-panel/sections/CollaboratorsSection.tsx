import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDeleteModal } from "../../workspace/components/ConfirmDeleteModal";
import {
  ProfileModal,
  ProfileModalSection,
} from "../../workspace/components/ProfileModal";
import {
  EditIcon,
  GroupIcon,
  PlusIcon,
  RecordAvatar,
  RefreshIcon,
} from "../../workspace/components/WorkspaceVisuals";
import { Pagination } from "../../workspace/components/Pagination";
import { SkeletonBlock } from "../../workspace/components/WorkspaceSkeleton";
import { StatusMessage } from "../../workspace/components/StatusMessage";
import { PAGE_SIZE } from "../../workspace/constants";
import {
  extractId,
  maskByFieldKey,
  maskPhone,
  maskZipCode,
  normalizeDigits,
  toCollaboratorFormState,
} from "../../workspace/formatter";
import type { ListItem } from "../../workspace/types";
import {
  listCollaboratorsAdmin,
  createCollaboratorAdmin,
  updateCollaboratorAdmin,
  deleteCollaboratorAdmin,
} from "../../../api/modules/adminApi";
import type { CollaboratorAdminFormState } from "../adminPayloads";
import { buildCollaboratorAdminPayload } from "../adminPayloads";

const INITIAL_FORM: CollaboratorAdminFormState = {
  name: "",
  email: "",
  document: "",
  contact: "",
  birthDate: "",
  companyId: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressDistrict: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
  addressCountry: "",
};

export function CollaboratorsSection({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CollaboratorAdminFormState>(INITIAL_FORM);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);

  const collaboratorsQuery = useQuery({
    queryKey: ["master", "collaborators", companyId ?? "all"],
    queryFn: () => listCollaboratorsAdmin(companyId),
  });

  const collaborators = collaboratorsQuery.data || [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return collaborators;

    return collaborators.filter((item: ListItem) => {
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const document = String(item.document || "").toLowerCase();
      return (
        name.includes(term) || email.includes(term) || document.includes(term)
      );
    });
  }, [collaborators, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const isLoading = collaboratorsQuery.isLoading;

  useEffect(() => {
    if (isCreateOpen) {
      setForm({ ...INITIAL_FORM, companyId: companyId ?? "" });
    }
  }, [isCreateOpen, companyId]);

  const notify = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 2500);
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const effectiveCompanyId = (companyId || form.companyId).trim();
      if (!effectiveCompanyId) {
        throw new Error("Company ID e obrigatorio para criar colaborador.");
      }

      return createCollaboratorAdmin(
        effectiveCompanyId,
        buildCollaboratorAdminPayload(form),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["master", "collaborators"],
      });
      setIsCreateOpen(false);
      notify("Colaborador criado com sucesso.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!selectedItem) {
        throw new Error("Nao foi possivel identificar o colaborador.");
      }

      const id = extractId(selectedItem);
      const companyId = String(
        selectedItem.companyId || form.companyId || "",
      ).trim();
      if (!id || !companyId) {
        throw new Error("Company ID e obrigatorio para editar colaborador.");
      }

      return updateCollaboratorAdmin(
        companyId,
        id,
        buildCollaboratorAdminPayload(form),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["master", "collaborators"],
      });
      setIsEditOpen(false);
      setSelectedItem(null);
      notify("Colaborador atualizado.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!selectedItem) {
        throw new Error("Nao foi possivel identificar o colaborador.");
      }

      const id = extractId(selectedItem);
      const companyId = String(
        selectedItem.companyId || form.companyId || "",
      ).trim();
      if (!id || !companyId) {
        throw new Error("Company ID e obrigatorio para excluir colaborador.");
      }

      return deleteCollaboratorAdmin(companyId, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["master", "collaborators"],
      });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      notify("Colaborador removido com sucesso.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const openCreate = () => {
    setError(null);
    setSelectedItem(null);
    setForm(INITIAL_FORM);
    setIsCreateOpen(true);
  };

  const openEdit = (item: ListItem) => {
    setError(null);
    setSelectedItem(item);
    setForm({
      ...toCollaboratorFormState(item),
      companyId: String(item.companyId || ""),
    });
    setIsEditOpen(true);
  };

  const openView = (item: ListItem) => {
    setSelectedItem(item);
    setForm({
      ...toCollaboratorFormState(item),
      companyId: String(item.companyId || ""),
    });
    setIsViewOpen(true);
  };

  return (
    <>
      <section className="crm-panel">
        <div style={{ marginBottom: 8 }}>
          <StatusMessage message={statusMessage} />
        </div>

        <div className="crm-panel-head">
          <h2>Colaboradores</h2>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn solid crm-add-button"
              onClick={openCreate}
            >
              <PlusIcon />
              Adicionar novo
            </button>
            <button
              type="button"
              className="btn outline crm-icon-btn"
              onClick={() =>
                void queryClient.resetQueries({
                  queryKey: ["master", "collaborators"],
                })
              }
              disabled={isLoading}
              aria-label="Atualizar colaboradores"
              title="Atualizar colaboradores"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        <div className="crm-panel-head">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, email ou documento"
          />
        </div>

        <div className="crm-table">
          {isLoading && paged.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`collaborator-skeleton-${index}`}
                className="crm-row crm-row-skeleton"
              >
                <div className="workspace-skeleton-stack">
                  <SkeletonBlock width="44%" height="1rem" />
                  <SkeletonBlock width="66%" height="0.8rem" />
                </div>
                <div className="crm-row-actions">
                  <SkeletonBlock width="2.4rem" height="2.4rem" />
                  <SkeletonBlock width="5rem" height="2.4rem" />
                </div>
              </article>
            ))
          ) : (
            <>
              {paged.map((item) => {
                const id = extractId(item);
                return (
                  <article
                    key={id || JSON.stringify(item)}
                    className="crm-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => openView(item)}
                  >
                    <div className="record-row-main">
                      <RecordAvatar name={item.name || "Colaborador"} />
                      <div className="record-row-copy">
                        <strong>{item.name || "Colaborador sem nome"}</strong>
                        <p>{item.email || "Email nao informado"}</p>
                      </div>
                    </div>
                    <div className="crm-row-actions">
                      <button
                        type="button"
                        className="crm-icon-action"
                        title="Editar"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(item);
                        }}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="crm-remove-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedItem(item);
                          setIsDeleteOpen(true);
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </article>
                );
              })}

              {paged.length === 0 && (
                <p>Nenhum colaborador encontrado para a busca informada.</p>
              )}
            </>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>

      {createPortal(
        <ProfileModal
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedItem(null);
          }}
          icon={<GroupIcon />}
          title={form.name || "Colaborador"}
          subtitle={form.email || "-"}
          mode="view"
        >
          <ProfileModalSection label="Dados pessoais">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label>Nome</label>
                <input value={form.name} disabled className="field-readonly" />
              </div>
              <div className="field field-span-4">
                <label>Email</label>
                <input value={form.email} disabled className="field-readonly" />
              </div>
              <div className="field field-span-4">
                <label>Documento</label>
                <input
                  value={maskByFieldKey("document", form.document)}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-4">
                <label>Contato</label>
                <input
                  value={maskPhone(form.contact)}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-4">
                <label>Nascimento</label>
                <input
                  value={form.birthDate || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-4">
                <label>Company ID</label>
                <input
                  value={form.companyId || "-"}
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
                  <label>Rua</label>
                  <input
                    value={form.addressStreet}
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-1">
                  <label>Número</label>
                  <input
                    value={form.addressNumber}
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-2">
                  <label>Complemento</label>
                  <input
                    value={form.addressComplement}
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-3">
                  <label>Bairro</label>
                  <input
                    value={form.addressDistrict}
                    disabled
                    className="field-readonly"
                  />
                </div>
              </div>
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label>Cidade</label>
                  <input
                    value={form.addressCity}
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-1">
                  <label>Estado</label>
                  <input
                    value={form.addressState}
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-2">
                  <label>CEP</label>
                  <input
                    value={maskZipCode(form.addressZipCode || "")}
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-3">
                  <label>País</label>
                  <input
                    value={form.addressCountry}
                    disabled
                    className="field-readonly"
                  />
                </div>
              </div>
            </div>
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}

      {createPortal(
        <ProfileModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setError(null);
          }}
          icon={<GroupIcon />}
          title="Novo Colaborador"
          subtitle="Cadastre um novo colaborador"
          mode="create"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            void createMut.mutateAsync();
          }}
          isPending={createMut.isPending}
          footerLeft={
            error ? (
              <p style={{ color: "var(--danger)" }}>{error}</p>
            ) : undefined
          }
        >
          <ProfileModalSection label="Dados pessoais">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label htmlFor="master-collab-name">Nome</label>
                <input
                  id="master-collab-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-email">Email</label>
                <input
                  id="master-collab-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      email: e.target.value,
                    }))
                  }
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-document">Documento</label>
                <input
                  id="master-collab-document"
                  value={maskByFieldKey("document", form.document)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      document: normalizeDigits(e.target.value).slice(0, 14),
                    }))
                  }
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-contact">Contato</label>
                <input
                  id="master-collab-contact"
                  value={maskPhone(form.contact)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      contact: normalizeDigits(e.target.value).slice(0, 11),
                    }))
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-birth">Nascimento</label>
                <input
                  id="master-collab-birth"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      birthDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-company">Company ID</label>
                <input
                  id="master-collab-company"
                  value={companyId ?? form.companyId}
                  onChange={
                    companyId
                      ? undefined
                      : (e) =>
                          setForm((current) => ({
                            ...current,
                            companyId: e.target.value,
                          }))
                  }
                  placeholder="ID da company"
                  required
                  readOnly={!!companyId}
                  className={companyId ? "field-readonly" : ""}
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Endereço">
            <div className="profile-form-address-stack">
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label htmlFor="master-collab-street">Rua</label>
                  <input
                    id="master-collab-street"
                    value={form.addressStreet}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressStreet: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-1">
                  <label htmlFor="master-collab-number">Número</label>
                  <input
                    id="master-collab-number"
                    value={form.addressNumber}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-2">
                  <label htmlFor="master-collab-complement">Complemento</label>
                  <input
                    id="master-collab-complement"
                    value={form.addressComplement}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressComplement: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-3">
                  <label htmlFor="master-collab-district">Bairro</label>
                  <input
                    id="master-collab-district"
                    value={form.addressDistrict}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressDistrict: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label htmlFor="master-collab-city">Cidade</label>
                  <input
                    id="master-collab-city"
                    value={form.addressCity}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressCity: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-1">
                  <label htmlFor="master-collab-state">Estado</label>
                  <input
                    id="master-collab-state"
                    value={form.addressState}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressState: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-2">
                  <label htmlFor="master-collab-zip">CEP</label>
                  <input
                    id="master-collab-zip"
                    value={maskZipCode(form.addressZipCode || "")}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressZipCode: normalizeDigits(e.target.value).slice(
                          0,
                          8,
                        ),
                      }))
                    }
                    placeholder="00000-000"
                  />
                </div>
                <div className="field field-span-3">
                  <label htmlFor="master-collab-country">País</label>
                  <input
                    id="master-collab-country"
                    value={form.addressCountry}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressCountry: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}

      {createPortal(
        <ProfileModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedItem(null);
            setError(null);
          }}
          icon={<GroupIcon />}
          title="Editar Colaborador"
          subtitle="Atualize o cadastro do colaborador"
          mode="edit"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            void updateMut.mutateAsync();
          }}
          isPending={updateMut.isPending}
          footerLeft={
            error ? (
              <p style={{ color: "var(--danger)" }}>{error}</p>
            ) : undefined
          }
        >
          <ProfileModalSection label="Dados pessoais">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label htmlFor="master-collab-edit-name">Nome</label>
                <input
                  id="master-collab-edit-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-edit-email">Email</label>
                <input
                  id="master-collab-edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      email: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-edit-document">Documento</label>
                <input
                  id="master-collab-edit-document"
                  value={maskByFieldKey("document", form.document)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      document: normalizeDigits(e.target.value).slice(0, 14),
                    }))
                  }
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-edit-contact">Contato</label>
                <input
                  id="master-collab-edit-contact"
                  value={maskPhone(form.contact)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      contact: normalizeDigits(e.target.value).slice(0, 11),
                    }))
                  }
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-edit-birth">Nascimento</label>
                <input
                  id="master-collab-edit-birth"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      birthDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-collab-edit-company">Company ID</label>
                <input
                  id="master-collab-edit-company"
                  value={form.companyId}
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
                  <label htmlFor="master-collab-edit-street">Rua</label>
                  <input
                    id="master-collab-edit-street"
                    value={form.addressStreet}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressStreet: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-1">
                  <label htmlFor="master-collab-edit-number">Número</label>
                  <input
                    id="master-collab-edit-number"
                    value={form.addressNumber}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-2">
                  <label htmlFor="master-collab-edit-complement">
                    Complemento
                  </label>
                  <input
                    id="master-collab-edit-complement"
                    value={form.addressComplement}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressComplement: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-3">
                  <label htmlFor="master-collab-edit-district">Bairro</label>
                  <input
                    id="master-collab-edit-district"
                    value={form.addressDistrict}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressDistrict: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label htmlFor="master-collab-edit-city">Cidade</label>
                  <input
                    id="master-collab-edit-city"
                    value={form.addressCity}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressCity: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-1">
                  <label htmlFor="master-collab-edit-state">Estado</label>
                  <input
                    id="master-collab-edit-state"
                    value={form.addressState}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressState: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field field-span-2">
                  <label htmlFor="master-collab-edit-zip">CEP</label>
                  <input
                    id="master-collab-edit-zip"
                    value={maskZipCode(form.addressZipCode || "")}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressZipCode: normalizeDigits(e.target.value).slice(
                          0,
                          8,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="field field-span-3">
                  <label htmlFor="master-collab-edit-country">País</label>
                  <input
                    id="master-collab-edit-country"
                    value={form.addressCountry}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        addressCountry: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Excluir colaborador"
        message={`Deseja excluir ${selectedItem?.name || "este colaborador"}?`}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={() => void deleteMut.mutateAsync()}
        isLoading={deleteMut.isPending}
      />
    </>
  );
}
