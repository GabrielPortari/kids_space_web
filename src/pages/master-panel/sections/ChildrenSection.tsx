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
import { ChildHealthInfoFields } from "../../workspace/components/ChildHealthInfoFields";
import { PAGE_SIZE } from "../../workspace/constants";
import {
  extractId,
  maskCpf,
  maskPhone,
  maskZipCode,
  normalizeDigits,
  parseIdList,
  toChildFormState,
} from "../../workspace/formatter";
import type { ListItem } from "../../workspace/types";
import {
  listChildrenAdmin,
  createChildAdmin,
  updateChildAdmin,
  deleteChildAdmin,
} from "../../../api/modules/adminApi";
import type { ChildAdminFormState } from "../adminPayloads";
import { buildChildAdminPayload } from "../adminPayloads";

function buildInitialForm(): ChildAdminFormState {
  return {
    name: "",
    email: "",
    document: "",
    contact: "",
    birthDate: "",
    parents: "",
    companyId: "",
    healthInfo: {
      dietaryRestrictions: [],
      allergies: [],
      medications: [],
      medicalConditions: [],
      fearsOrSensitivities: [],
    },
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressDistrict: "",
    addressCity: "",
    addressState: "",
    addressZipCode: "",
    addressCountry: "",
  };
}

const INITIAL_FORM = buildInitialForm();

export function ChildrenSection({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ChildAdminFormState>(INITIAL_FORM);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const childrenQuery = useQuery({
    queryKey: ["master", "children", companyId ?? "all"],
    queryFn: () => listChildrenAdmin(companyId),
  });

  const children = childrenQuery.data || [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return children;

    return children.filter((item: ListItem) => {
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const document = String(item.document || "").toLowerCase();
      return (
        name.includes(term) || email.includes(term) || document.includes(term)
      );
    });
  }, [children, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const isLoading = childrenQuery.isLoading;

  useEffect(() => {
    if (isCreateOpen) {
      setForm({ ...buildInitialForm(), companyId: companyId ?? "" });
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
        throw new Error("Company ID e obrigatorio para criar crianca.");
      }

      return createChildAdmin(effectiveCompanyId, buildChildAdminPayload(form));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master", "children"] });
      setIsCreateOpen(false);
      notify("Crianca criada com sucesso.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!selectedItem) {
        throw new Error("Nao foi possivel identificar a crianca.");
      }

      const id = extractId(selectedItem);
      const companyId = String(
        selectedItem.companyId || form.companyId || "",
      ).trim();
      if (!id || !companyId) {
        throw new Error("Company ID e obrigatorio para editar crianca.");
      }

      return updateChildAdmin(companyId, id, buildChildAdminPayload(form));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master", "children"] });
      setIsEditOpen(false);
      setSelectedItem(null);
      notify("Crianca atualizada.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!selectedItem) {
        throw new Error("Nao foi possivel identificar a crianca.");
      }

      const id = extractId(selectedItem);
      const companyId = String(
        selectedItem.companyId || form.companyId || "",
      ).trim();
      if (!id || !companyId) {
        throw new Error("Company ID e obrigatorio para excluir crianca.");
      }

      return deleteChildAdmin(companyId, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master", "children"] });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      notify("Crianca removida com sucesso.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const openCreate = () => {
    setError(null);
    setSelectedItem(null);
    setForm(buildInitialForm());
    setIsCreateOpen(true);
  };

  const openEdit = (item: ListItem) => {
    setError(null);
    setSelectedItem(item);
    setForm({
      ...toChildFormState(item),
      companyId: String(item.companyId || ""),
    } as ChildAdminFormState);
    setIsEditOpen(true);
  };

  const openView = (item: ListItem) => {
    setSelectedItem(item);
    setForm({
      ...toChildFormState(item),
      companyId: String(item.companyId || ""),
    } as ChildAdminFormState);
    setIsViewOpen(true);
  };

  return (
    <>
      <section className="crm-panel">
        <div style={{ marginBottom: 8 }}>
          <StatusMessage message={statusMessage} />
        </div>

        <div className="crm-panel-head">
          <h2>Crianças</h2>
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
                  queryKey: ["master", "children"],
                })
              }
              disabled={isLoading}
              aria-label="Atualizar crianças"
              title="Atualizar crianças"
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
                key={`child-skeleton-${index}`}
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
                      <RecordAvatar name={item.name || "Criança"} />
                      <div className="record-row-copy">
                        <strong>{item.name || "Criança sem nome"}</strong>
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
                <p>Nenhuma crianca encontrada para a busca informada.</p>
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
          title={form.name || "Criança"}
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
                <label>Documento</label>
                <input
                  value={maskCpf(form.document)}
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
                <label>Email</label>
                <input
                  value={form.email || "-"}
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
              <div className="field field-span-12">
                <label>Parents IDs</label>
                <input
                  value={parseIdList(form.parents).join(", ") || "-"}
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

          <ProfileModalSection label="Saúde">
            <ChildHealthInfoFields
              value={form.healthInfo}
              onChange={() => undefined}
              onAddMedication={() => undefined}
              onRemoveMedication={() => undefined}
              disabled
            />
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
          title="Nova Criança"
          subtitle="Cadastre uma nova criança"
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
                <label htmlFor="master-child-name">Nome</label>
                <input
                  id="master-child-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-child-cpf">CPF</label>
                <input
                  id="master-child-cpf"
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
              <div className="field field-span-4">
                <label htmlFor="master-child-contact">Contato</label>
                <input
                  id="master-child-contact"
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
                <label htmlFor="master-child-email">Email</label>
                <input
                  id="master-child-email"
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
              <div className="field field-span-4">
                <label htmlFor="master-child-birth">Nascimento</label>
                <input
                  id="master-child-birth"
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
                <label htmlFor="master-child-company">Company ID</label>
                <input
                  id="master-child-company"
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
              <div className="field field-span-12">
                <label htmlFor="master-child-parents">Parents IDs</label>
                <input
                  id="master-child-parents"
                  value={form.parents}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      parents: e.target.value,
                    }))
                  }
                  placeholder="id1, id2"
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Endereço">
            <div className="profile-form-address-stack">
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label htmlFor="master-child-street">Rua</label>
                  <input
                    id="master-child-street"
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
                  <label htmlFor="master-child-number">Número</label>
                  <input
                    id="master-child-number"
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
                  <label htmlFor="master-child-complement">Complemento</label>
                  <input
                    id="master-child-complement"
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
                  <label htmlFor="master-child-district">Bairro</label>
                  <input
                    id="master-child-district"
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
                  <label htmlFor="master-child-city">Cidade</label>
                  <input
                    id="master-child-city"
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
                  <label htmlFor="master-child-state">Estado</label>
                  <input
                    id="master-child-state"
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
                  <label htmlFor="master-child-zip">CEP</label>
                  <input
                    id="master-child-zip"
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
                  <label htmlFor="master-child-country">País</label>
                  <input
                    id="master-child-country"
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

          <ProfileModalSection label="Saúde">
            <ChildHealthInfoFields
              value={form.healthInfo}
              onChange={(key, value) =>
                setForm((current) => ({ ...current, [key]: value }))
              }
              onAddMedication={(medication) =>
                setForm((current) => ({
                  ...current,
                  healthInfo: {
                    ...current.healthInfo,
                    medications: [
                      ...current.healthInfo.medications,
                      medication,
                    ],
                  },
                }))
              }
              onRemoveMedication={(index) =>
                setForm((current) => ({
                  ...current,
                  healthInfo: {
                    ...current.healthInfo,
                    medications: current.healthInfo.medications.filter(
                      (_, medicationIndex) => medicationIndex !== index,
                    ),
                  },
                }))
              }
            />
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
          title="Editar Criança"
          subtitle="Atualize o cadastro da criança"
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
                <label htmlFor="master-child-edit-name">Nome</label>
                <input
                  id="master-child-edit-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-child-edit-cpf">CPF</label>
                <input
                  id="master-child-edit-cpf"
                  value={maskCpf(form.document)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      document: normalizeDigits(e.target.value).slice(0, 11),
                    }))
                  }
                />
              </div>
              <div className="field field-span-4">
                <label htmlFor="master-child-edit-contact">Contato</label>
                <input
                  id="master-child-edit-contact"
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
                <label htmlFor="master-child-edit-email">Email</label>
                <input
                  id="master-child-edit-email"
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
              <div className="field field-span-4">
                <label htmlFor="master-child-edit-birth">Nascimento</label>
                <input
                  id="master-child-edit-birth"
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
                <label htmlFor="master-child-edit-company">Company ID</label>
                <input
                  id="master-child-edit-company"
                  value={form.companyId}
                  disabled
                  className="field-readonly"
                />
              </div>
              <div className="field field-span-12">
                <label htmlFor="master-child-edit-parents">Parents IDs</label>
                <input
                  id="master-child-edit-parents"
                  value={form.parents}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      parents: e.target.value,
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
                  <label htmlFor="master-child-edit-street">Rua</label>
                  <input
                    id="master-child-edit-street"
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
                  <label htmlFor="master-child-edit-number">Número</label>
                  <input
                    id="master-child-edit-number"
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
                  <label htmlFor="master-child-edit-complement">
                    Complemento
                  </label>
                  <input
                    id="master-child-edit-complement"
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
                  <label htmlFor="master-child-edit-district">Bairro</label>
                  <input
                    id="master-child-edit-district"
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
                  <label htmlFor="master-child-edit-city">Cidade</label>
                  <input
                    id="master-child-edit-city"
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
                  <label htmlFor="master-child-edit-state">Estado</label>
                  <input
                    id="master-child-edit-state"
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
                  <label htmlFor="master-child-edit-zip">CEP</label>
                  <input
                    id="master-child-edit-zip"
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
                  <label htmlFor="master-child-edit-country">País</label>
                  <input
                    id="master-child-edit-country"
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

          <ProfileModalSection label="Saúde">
            <ChildHealthInfoFields
              value={form.healthInfo}
              onChange={(key, value) =>
                setForm((current) => ({ ...current, [key]: value }))
              }
              onAddMedication={(medication) =>
                setForm((current) => ({
                  ...current,
                  healthInfo: {
                    ...current.healthInfo,
                    medications: [
                      ...current.healthInfo.medications,
                      medication,
                    ],
                  },
                }))
              }
              onRemoveMedication={(index) =>
                setForm((current) => ({
                  ...current,
                  healthInfo: {
                    ...current.healthInfo,
                    medications: current.healthInfo.medications.filter(
                      (_, medicationIndex) => medicationIndex !== index,
                    ),
                  },
                }))
              }
            />
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Excluir criança"
        message={`Deseja excluir ${selectedItem?.name || "esta criança"}?`}
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
