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
  PersonIcon,
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
  maskCpf,
  maskPhone,
  maskZipCode,
  normalizeDigits,
  parseIdList,
  toParentFormState,
} from "../../workspace/formatter";
import type { ListItem } from "../../workspace/types";
import {
  listParentsAdmin,
  createParentAdmin,
  updateParentAdmin,
  deleteParentAdmin,
} from "../../../api/modules/adminApi";
import type { ParentAdminFormState } from "../adminPayloads";
import { buildParentAdminPayload } from "../adminPayloads";

const INITIAL_FORM: ParentAdminFormState = {
  name: "",
  email: "",
  document: "",
  contact: "",
  birthDate: "",
  children: "",
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

export function ParentsSection({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ParentAdminFormState>(INITIAL_FORM);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const parentsQuery = useQuery({
    queryKey: ["master", "parents", companyId ?? "all"],
    queryFn: () => listParentsAdmin(companyId),
  });

  const parents = parentsQuery.data || [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return parents;

    return parents.filter((item: ListItem) => {
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const document = String(item.document || "").toLowerCase();
      return (
        name.includes(term) || email.includes(term) || document.includes(term)
      );
    });
  }, [parents, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const isLoading = parentsQuery.isLoading;

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
        throw new Error("Company ID e obrigatorio para criar responsavel.");
      }

      return createParentAdmin(
        effectiveCompanyId,
        buildParentAdminPayload(form),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master", "parents"] });
      setIsCreateOpen(false);
      notify("Responsavel criado com sucesso.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!selectedItem) {
        throw new Error("Nao foi possivel identificar o responsavel.");
      }

      const id = extractId(selectedItem);
      const companyId = String(
        selectedItem.companyId || form.companyId || "",
      ).trim();
      if (!id || !companyId) {
        throw new Error("Company ID e obrigatorio para editar responsavel.");
      }

      return updateParentAdmin(companyId, id, buildParentAdminPayload(form));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master", "parents"] });
      setIsEditOpen(false);
      setSelectedItem(null);
      notify("Responsavel atualizado.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!selectedItem) {
        throw new Error("Nao foi possivel identificar o responsavel.");
      }

      const id = extractId(selectedItem);
      const companyId = String(
        selectedItem.companyId || form.companyId || "",
      ).trim();
      if (!id || !companyId) {
        throw new Error("Company ID e obrigatorio para excluir responsavel.");
      }

      return deleteParentAdmin(companyId, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master", "parents"] });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      notify("Responsavel removido com sucesso.");
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
      ...toParentFormState(item),
      companyId: String(item.companyId || ""),
    });
    setIsEditOpen(true);
  };

  const openView = (item: ListItem) => {
    setSelectedItem(item);
    setForm({
      ...toParentFormState(item),
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
          <h2>Responsáveis</h2>
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
                  queryKey: ["master", "parents"],
                })
              }
              disabled={isLoading}
              aria-label="Atualizar responsáveis"
              title="Atualizar responsáveis"
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
            placeholder="Buscar por nome, email ou CPF"
          />
        </div>

        <div className="crm-table">
          {isLoading && paged.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`parent-skeleton-${index}`}
                className="crm-row crm-row-skeleton"
              >
                <div className="workspace-skeleton-stack">
                  <SkeletonBlock width="42%" height="1rem" />
                  <SkeletonBlock width="58%" height="0.8rem" />
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
                      <RecordAvatar name={item.name || "Responsavel"} />
                      <div className="record-row-copy">
                        <strong>{item.name || "Responsavel sem nome"}</strong>
                        <p>
                          {maskCpf(item.document || "") || "CPF nao informado"}
                        </p>
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
                <p>Nenhum responsavel encontrado para a busca informada.</p>
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
          icon={<PersonIcon />}
          title={form.name || "Responsável"}
          subtitle={form.email || "-"}
          mode="view"
        >
          <ProfileModalSection label="Dados pessoais">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label>Nome</label>
                <input value={form.name} disabled className="field-readonly" />
              </div>
              <div className="field field-span-6">
                <label>CPF</label>
                <input
                  value={maskCpf(form.document)}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-6">
                <label>Contato</label>
                <input
                  value={maskPhone(form.contact)}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-6">
                <label>Email</label>
                <input
                  value={form.email || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-6">
                <label>Nascimento</label>
                <input
                  value={form.birthDate || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-6">
                <label>Company ID</label>
                <input
                  value={form.companyId || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Filhos">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label>IDs vinculados</label>
                <input
                  value={parseIdList(form.children).join(", ") || "-"}
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
          icon={<PersonIcon />}
          title="Novo Responsável"
          subtitle="Cadastre um novo responsável"
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
                <label htmlFor="master-parent-name">Nome</label>
                <input
                  id="master-parent-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-parent-cpf">CPF</label>
                <input
                  id="master-parent-cpf"
                  value={maskCpf(form.document)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      document: normalizeDigits(e.target.value).slice(0, 11),
                    }))
                  }
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-parent-contact">Contato</label>
                <input
                  id="master-parent-contact"
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
              <div className="field field-span-6">
                <label htmlFor="master-parent-email">Email</label>
                <input
                  id="master-parent-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      email: e.target.value,
                    }))
                  }
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-parent-birth">Nascimento</label>
                <input
                  id="master-parent-birth"
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
              <div className="field field-span-6">
                <label htmlFor="master-parent-company">Company ID</label>
                <input
                  id="master-parent-company"
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
                  readOnly={!!companyId}
                  className={companyId ? "field-readonly" : ""}
                  required
                />
              </div>
              <div className="field field-span-12">
                <label htmlFor="master-parent-children">Children IDs</label>
                <input
                  id="master-parent-children"
                  value={form.children}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      children: e.target.value,
                    }))
                  }
                  placeholder="id1, id2, id3"
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Endereço">
            <div className="profile-form-address-stack">
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label htmlFor="master-parent-street">Rua</label>
                  <input
                    id="master-parent-street"
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
                  <label htmlFor="master-parent-number">Número</label>
                  <input
                    id="master-parent-number"
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
                  <label htmlFor="master-parent-complement">Complemento</label>
                  <input
                    id="master-parent-complement"
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
                  <label htmlFor="master-parent-district">Bairro</label>
                  <input
                    id="master-parent-district"
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
                  <label htmlFor="master-parent-city">Cidade</label>
                  <input
                    id="master-parent-city"
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
                  <label htmlFor="master-parent-state">Estado</label>
                  <input
                    id="master-parent-state"
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
                  <label htmlFor="master-parent-zip">CEP</label>
                  <input
                    id="master-parent-zip"
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
                  <label htmlFor="master-parent-country">País</label>
                  <input
                    id="master-parent-country"
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
          icon={<PersonIcon />}
          title="Editar Responsável"
          subtitle="Atualize o cadastro do responsável"
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
                <label htmlFor="master-parent-edit-name">Nome</label>
                <input
                  id="master-parent-edit-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-parent-edit-cpf">CPF</label>
                <input
                  id="master-parent-edit-cpf"
                  value={maskCpf(form.document)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      document: normalizeDigits(e.target.value).slice(0, 11),
                    }))
                  }
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-parent-edit-contact">Contato</label>
                <input
                  id="master-parent-edit-contact"
                  value={maskPhone(form.contact)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      contact: normalizeDigits(e.target.value).slice(0, 11),
                    }))
                  }
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-parent-edit-email">Email</label>
                <input
                  id="master-parent-edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-parent-edit-birth">Nascimento</label>
                <input
                  id="master-parent-edit-birth"
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
              <div className="field field-span-6">
                <label htmlFor="master-parent-edit-company">Company ID</label>
                <input
                  id="master-parent-edit-company"
                  value={form.companyId}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-12">
                <label htmlFor="master-parent-edit-children">
                  Children IDs
                </label>
                <input
                  id="master-parent-edit-children"
                  value={form.children}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      children: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Endereço">
            <div className="profile-form-address-stack">
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label htmlFor="master-parent-edit-street">Rua</label>
                  <input
                    id="master-parent-edit-street"
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
                  <label htmlFor="master-parent-edit-number">Número</label>
                  <input
                    id="master-parent-edit-number"
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
                  <label htmlFor="master-parent-edit-complement">
                    Complemento
                  </label>
                  <input
                    id="master-parent-edit-complement"
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
                  <label htmlFor="master-parent-edit-district">Bairro</label>
                  <input
                    id="master-parent-edit-district"
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
                  <label htmlFor="master-parent-edit-city">Cidade</label>
                  <input
                    id="master-parent-edit-city"
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
                  <label htmlFor="master-parent-edit-state">Estado</label>
                  <input
                    id="master-parent-edit-state"
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
                  <label htmlFor="master-parent-edit-zip">CEP</label>
                  <input
                    id="master-parent-edit-zip"
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
                  <label htmlFor="master-parent-edit-country">País</label>
                  <input
                    id="master-parent-edit-country"
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
        title="Excluir responsável"
        message={`Deseja excluir ${selectedItem?.name || "este responsável"}?`}
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
