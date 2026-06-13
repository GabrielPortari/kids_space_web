import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useCompanies } from "../hooks/useCompanies";
import {
  createCompany,
  updateCompany,
  deleteCompany,
} from "../../../api/modules/companyApi";
import {
  ProfileModal,
  ProfileModalSection,
} from "../../workspace/components/ProfileModal";
import { GroupIcon } from "../../workspace/components/WorkspaceVisuals";
import { Pagination } from "../../workspace/components/Pagination";
import { SkeletonBlock } from "../../workspace/components/WorkspaceSkeleton";
import {
  EditIcon,
  PlusIcon,
  RefreshIcon,
  RecordAvatar,
} from "../../workspace/components/WorkspaceVisuals";
import { AddressFormFields } from "../../workspace/components/AddressFormFields";
import {
  extractId,
  maskPhone,
  normalizeDigits,
} from "../../workspace/formatter";

export function CompaniesSection() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const perPage = 10;

  const companiesQ = useCompanies(page, perPage, { name: search });
  const pag = companiesQ.data;
  const companies = pag?.items || [];
  const totalPages = pag ? Math.max(1, Math.ceil(pag.total / perPage)) : 1;
  const isLoading = companiesQ.isLoading;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [viewTarget, setViewTarget] = useState<any | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    contact: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressDistrict: "",
    addressCity: "",
    addressState: "",
    addressZipCode: "",
    addressCountry: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditOpen && editTarget) {
      setForm({
        name: editTarget.name || "",
        email: editTarget.email || "",
        contact: editTarget.contact || "",
        addressStreet: editTarget.address?.street || "",
        addressNumber: editTarget.address?.number || "",
        addressComplement: editTarget.address?.complement || "",
        addressDistrict: editTarget.address?.neighborhood || "",
        addressCity: editTarget.address?.city || "",
        addressState: editTarget.address?.state || "",
        addressZipCode: editTarget.address?.zipcode || "",
        addressCountry: editTarget.address?.country || "",
      });
    }
  }, [isEditOpen, editTarget]);

  useEffect(() => {
    if (isCreateOpen) {
      setForm({
        name: "",
        email: "",
        contact: "",
        addressStreet: "",
        addressNumber: "",
        addressComplement: "",
        addressDistrict: "",
        addressCity: "",
        addressState: "",
        addressZipCode: "",
        addressCountry: "",
      });
    }
  }, [isCreateOpen]);

  const createMut = useMutation({
    mutationFn: (payload: any) => createCompany(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["master", "companies"] });
      setIsCreateOpen(false);
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateCompany(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["master", "companies"] });
      setIsEditOpen(false);
      setEditTarget(null);
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["master", "companies"] });
      setIsDeleteOpen(false);
      setPendingDeleteId(null);
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const handleRefresh = () =>
    void queryClient.resetQueries({ queryKey: ["master", "companies"] });

  const updateForm = (patch: Partial<any>) =>
    setForm((cur: any) => ({ ...cur, ...patch }));

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setError(null);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditTarget(null);
    setError(null);
  };

  const closeViewModal = () => {
    setIsViewOpen(false);
    setViewTarget(null);
  };

  const openCreateModal = () => {
    setError(null);
    setEditTarget(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (company: any) => {
    setError(null);
    setEditTarget(company);
    setIsEditOpen(true);
  };

  const openViewModal = (company: any) => {
    setViewTarget(company);
    setIsViewOpen(true);
  };

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Companies</h2>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn solid crm-add-button"
              onClick={openCreateModal}
            >
              <PlusIcon />
              Adicionar novo
            </button>
            <button
              type="button"
              className="btn outline crm-icon-btn"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Atualizar companies"
              title="Atualizar companies"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        <div className="crm-panel-head">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome"
          />
        </div>

        <div className="crm-table">
          {isLoading && companies.length === 0 ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <article
                key={`company-skel-${idx}`}
                className="crm-row crm-row-skeleton"
              >
                <div className="workspace-skeleton-stack">
                  <SkeletonBlock width="40%" height="1rem" />
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
              {companies.map((c: any) => {
                const id = extractId(c);
                return (
                  <article
                    key={id || c.name}
                    className="crm-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => openViewModal(c)}
                  >
                    <div className="record-row-main">
                      <RecordAvatar name={c.name || "Company"} />
                      <div className="record-row-copy">
                        <strong>{c.name || "Sem nome"}</strong>
                        <p>{id || "ID nao informado"}</p>
                      </div>
                    </div>
                    <div className="crm-row-actions">
                      <button
                        type="button"
                        className="crm-icon-action"
                        title="Editar"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(c);
                        }}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="crm-remove-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          const cid = extractId(c);
                          if (cid) {
                            setPendingDeleteId(cid);
                            setIsDeleteOpen(true);
                          }
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </article>
                );
              })}

              {companies.length === 0 && (
                <p>Nenhuma company encontrada para a busca informada.</p>
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
          isOpen={isCreateOpen}
          onClose={closeCreateModal}
          icon={<GroupIcon />}
          title="Nova Company"
          subtitle="Cadastre a company"
          mode="create"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            void createMut.mutateAsync({
              name: form.name,
              email: form.email,
              contact: form.contact,
              address: {
                street: form.addressStreet,
                number: form.addressNumber,
                complement: form.addressComplement,
                neighborhood: form.addressDistrict,
                city: form.addressCity,
                state: form.addressState,
                zipcode: form.addressZipCode,
                country: form.addressCountry,
              },
            });
          }}
          isPending={createMut.status === "pending"}
          footerLeft={
            error ? (
              <p style={{ color: "var(--danger)" }}>{error}</p>
            ) : undefined
          }
        >
          <ProfileModalSection label="Dados da company">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label htmlFor="company-name">Nome</label>
                <input
                  id="company-name"
                  value={form.name || ""}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="Nome da company"
                  required
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="company-email">Email</label>
                <input
                  id="company-email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="company-contact">Contato</label>
                <input
                  id="company-contact"
                  value={maskPhone(form.contact || "")}
                  onChange={(e) =>
                    updateForm({
                      contact: normalizeDigits(e.target.value).slice(0, 11),
                    })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Endereço">
            <AddressFormFields
              values={{
                addressStreet: form.addressStreet || "",
                addressNumber: form.addressNumber || "",
                addressDistrict: form.addressDistrict || "",
                addressCity: form.addressCity || "",
                addressState: form.addressState || "",
                addressZipCode: form.addressZipCode || "",
                addressComplement: form.addressComplement || "",
                addressCountry: form.addressCountry || "",
              }}
              onChange={(key, value) => updateForm({ [key]: value })}
            />
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}

      {createPortal(
        <ProfileModal
          isOpen={isEditOpen}
          onClose={closeEditModal}
          icon={<GroupIcon />}
          title="Editar Company"
          subtitle="Atualize os dados"
          mode="edit"
          onSubmit={(e) => {
            e.preventDefault();
            if (!editTarget) return;
            setError(null);
            void updateMut.mutateAsync({
              id: extractId(editTarget),
              payload: {
                name: form.name,
                email: form.email,
                contact: form.contact,
                address: {
                  street: form.addressStreet,
                  number: form.addressNumber,
                  complement: form.addressComplement,
                  neighborhood: form.addressDistrict,
                  city: form.addressCity,
                  state: form.addressState,
                  zipcode: form.addressZipCode,
                  country: form.addressCountry,
                },
              },
            });
          }}
          isPending={updateMut.status === "pending"}
          footerLeft={
            error ? (
              <p style={{ color: "var(--danger)" }}>{error}</p>
            ) : undefined
          }
        >
          <ProfileModalSection label="Dados da company">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label htmlFor="company-edit-name">Nome</label>
                <input
                  id="company-edit-name"
                  value={form.name || ""}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  required
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="company-edit-email">Email</label>
                <input
                  id="company-edit-email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => updateForm({ email: e.target.value })}
                />
              </div>

              <div className="field field-span-6">
                <label htmlFor="company-edit-contact">Contato</label>
                <input
                  id="company-edit-contact"
                  value={maskPhone(form.contact || "")}
                  onChange={(e) =>
                    updateForm({
                      contact: normalizeDigits(e.target.value).slice(0, 11),
                    })
                  }
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Endereço">
            <AddressFormFields
              values={{
                addressStreet: form.addressStreet || "",
                addressNumber: form.addressNumber || "",
                addressDistrict: form.addressDistrict || "",
                addressCity: form.addressCity || "",
                addressState: form.addressState || "",
                addressZipCode: form.addressZipCode || "",
                addressComplement: form.addressComplement || "",
                addressCountry: form.addressCountry || "",
              }}
              onChange={(key, value) => updateForm({ [key]: value })}
            />
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}

      {createPortal(
        <ProfileModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setPendingDeleteId(null);
          }}
          icon={<></>}
          title="Deletar Company"
          subtitle="Confirme exclusão"
          mode="create"
          submitLabel="Excluir"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pendingDeleteId) {
              await deleteMut.mutateAsync(pendingDeleteId);
            }
          }}
          footerLeft={
            error ? (
              <p style={{ color: "var(--danger)" }}>{error}</p>
            ) : undefined
          }
        >
          <div>
            <p>Deseja realmente excluir esta company?</p>
          </div>
        </ProfileModal>,
        document.body,
      )}

      {createPortal(
        <ProfileModal
          isOpen={isViewOpen}
          onClose={closeViewModal}
          icon={<GroupIcon />}
          title={viewTarget?.name || "Company"}
          subtitle={extractId(viewTarget) || "ID nao informado"}
          mode="view"
        >
          <ProfileModalSection label="Dados da company">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label>Nome</label>
                <input
                  value={viewTarget?.name || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>

              <div className="field field-span-6">
                <label>Email</label>
                <input
                  value={viewTarget?.email || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>

              <div className="field field-span-6">
                <label>Contato</label>
                <input
                  value={maskPhone(viewTarget?.contact || "")}
                  disabled
                  className="field-readonly"
                />
              </div>

              <div className="field field-span-12">
                <label>CNPJ</label>
                <input
                  value={viewTarget?.cnpj || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Endereço">
            <AddressFormFields
              values={{
                addressStreet: viewTarget?.address?.street || "",
                addressNumber: viewTarget?.address?.number || "",
                addressDistrict: viewTarget?.address?.neighborhood || "",
                addressCity: viewTarget?.address?.city || "",
                addressState: viewTarget?.address?.state || "",
                addressZipCode: viewTarget?.address?.zipcode || "",
                addressComplement: viewTarget?.address?.complement || "",
                addressCountry: viewTarget?.address?.country || "",
              }}
              onChange={() => undefined}
              disabled
            />
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}
    </>
  );
}
