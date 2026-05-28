import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAdmins } from "../hooks/useAdmins";
import {
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../../../api/modules/adminApi";
import { useState, useEffect } from "react";
import { ConfirmDeleteModal } from "../../workspace/components/ConfirmDeleteModal";
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
  normalizeDigits,
} from "../../workspace/formatter";
import { AdminViewModal } from "../components/AdminViewModal";
import {
  RecordAvatar,
  EditIcon,
  PlusIcon,
  RefreshIcon,
} from "../../workspace/components/WorkspaceVisuals";
import { SkeletonBlock } from "../../workspace/components/WorkspaceSkeleton";
import { StatusMessage } from "../../workspace/components/StatusMessage";
import { Pagination } from "../../workspace/components/Pagination";

export function AdminsSection() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const perPage = 10;

  const adminsQuery = useAdmins(page, perPage, { name: search, email: search });
  const pag = adminsQuery.data;
  const admins = pag?.items || [];
  const isLoading = adminsQuery.isLoading;

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: (payload: any) => createAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "admins"] });
      setIsEditOpen(false);
      setStatusMessage("Admin criado com sucesso.");
      window.setTimeout(() => setStatusMessage(null), 2500);
    },
    onError: (err: any) => setModalError(err?.message || String(err)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateAdmin(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "admins"] });
      setIsEditOpen(false);
      setStatusMessage("Admin atualizado.");
      window.setTimeout(() => setStatusMessage(null), 2500);
    },
    onError: (err: any) => setModalError(err?.message || String(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "admins"] });
      setIsDeleteOpen(false);
      setStatusMessage("Admin removido com sucesso.");
      window.setTimeout(() => setStatusMessage(null), 2500);
    },
    onError: (err: any) => setModalError(err?.message || String(err)),
  });

  type AdminFormState = Omit<any, "document" | "contact" | "address"> & {
    document: string;
    contact: string;
    addressStreet: string;
    addressNumber: string;
    addressComplement: string;
    addressDistrict: string;
    addressCity: string;
    addressState: string;
    addressZipCode: string;
    addressCountry: string;
  };

  function buildAdminFormState(initial?: Partial<any> | null): AdminFormState {
    return {
      name: initial?.name || "",
      email: initial?.email || "",
      document: initial?.document || "",
      contact: initial?.contact || "",
      active: initial?.active ?? true,
      addressStreet: initial?.address?.street || "",
      addressNumber: initial?.address?.number || "",
      addressComplement: initial?.address?.complement || "",
      addressDistrict: initial?.address?.neighborhood || "",
      addressCity: initial?.address?.city || "",
      addressState: initial?.address?.state || "",
      addressZipCode: initial?.address?.zipcode || "",
      addressCountry: initial?.address?.country || "",
    };
  }

  const [form, setForm] = useState<AdminFormState>(
    buildAdminFormState(editTarget),
  );

  // reset form when opening modal or when edit target changes
  useEffect(() => {
    if (isEditOpen) {
      setForm(buildAdminFormState(editTarget));
    }
  }, [editTarget, isEditOpen]);

  const update = (patch: Partial<typeof form>) =>
    setForm((cur: any) => ({ ...cur, ...patch }));

  return (
    <>
      <section className="crm-panel">
        <div style={{ marginBottom: 8 }}>
          <StatusMessage message={statusMessage} />
        </div>

        <div className="crm-panel-head">
          <h2>Admins</h2>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn solid crm-add-button"
              onClick={() => {
                setModalError(null);
                setEditTarget(null);
                setIsEditOpen(true);
              }}
            >
              <PlusIcon />
              Adicionar novo
            </button>
            <button
              type="button"
              className="btn outline crm-icon-btn"
              onClick={() =>
                queryClient.resetQueries({ queryKey: ["master", "admins"] })
              }
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
            placeholder="Buscar por nome ou email"
          />
        </div>

        <div className="crm-table">
          {isLoading && admins.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`admin-skeleton-${index}`}
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
              {admins.map((admin: any) => (
                <article
                  key={String(admin.id || admin.email)}
                  className="crm-row"
                  onClick={() => {
                    setEditTarget(admin);
                    setIsViewOpen(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="record-row-main">
                    <RecordAvatar name={admin.name || "Admin"} />
                    <div className="record-row-copy">
                      <strong>{admin.name || "Admin sem nome"}</strong>
                      <p>{admin.email || "Email nao informado"}</p>
                    </div>
                  </div>
                  <div className="crm-row-actions">
                    <button
                      type="button"
                      className="crm-icon-action"
                      title="Editar"
                      onClick={(event) => {
                        event.stopPropagation();
                        setModalError(null);
                        setEditTarget(admin);
                        setIsEditOpen(true);
                      }}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="crm-remove-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(admin);
                        setIsDeleteOpen(true);
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </article>
              ))}

              {admins.length === 0 && (
                <p>Nenhum admin encontrado para a busca informada.</p>
              )}
            </>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil((pag?.total || 0) / perPage))}
          onPageChange={setPage}
        />
      </section>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Deletar admin"
        message={`Deseja deletar ${deleteTarget?.email || deleteTarget?.name || "este admin"}?`}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        isLoading={deleteMut.status === "pending"}
      />

      {createPortal(
        <ProfileModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditTarget(null);
            setModalError(null);
          }}
          icon={<GroupIcon />}
          title={editTarget?.id ? "Editar Admin" : "Novo Admin"}
          subtitle="Preencha os dados do admin"
          mode={editTarget?.id ? "edit" : "create"}
          onSubmit={(event) => {
            event.preventDefault();
            const payload = {
              name: form.name.trim(),
              email: form.email.trim(),
              document: form.document || undefined,
              contact: form.contact || undefined,
              address: {
                street: form.addressStreet,
                number: form.addressNumber,
                complement: form.addressComplement || undefined,
                neighborhood: form.addressDistrict,
                city: form.addressCity,
                state: form.addressState,
                zipcode: form.addressZipCode || undefined,
                country: form.addressCountry || undefined,
              },
              active: form.active,
            };

            setModalError(null);
            if (editTarget) {
              void updateMut.mutateAsync({ id: editTarget.id, payload });
            } else {
              void createMut.mutateAsync(payload);
            }
          }}
          isPending={
            createMut.status === "pending" || updateMut.status === "pending"
          }
          footerLeft={
            modalError ? (
              <>
                <p style={{ color: "var(--danger)" }}>{modalError}</p>
                {editTarget?.id ? (
                  <p className="profile-modal-hint">
                    🔒 Campos acinzentados são somente leitura
                  </p>
                ) : null}
              </>
            ) : undefined
          }
        >
          <ProfileModalSection label="Dados pessoais">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-12">
                <label htmlFor="admin-name">Nome</label>
                <input
                  id="admin-name"
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="field field-span-4">
                <label htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div className="field field-span-4">
                <label htmlFor="admin-document">CPF/CNPJ</label>
                <input
                  id="admin-document"
                  value={maskByFieldKey("document", form.document)}
                  onChange={(e) =>
                    update({
                      document: normalizeDigits(e.target.value).slice(0, 14),
                    })
                  }
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="field field-span-4">
                <label htmlFor="admin-contact">Contato</label>
                <input
                  id="admin-contact"
                  value={maskPhone(form.contact)}
                  onChange={(e) =>
                    update({
                      contact: normalizeDigits(e.target.value).slice(0, 11),
                    })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </ProfileModalSection>

          <ProfileModalSection label="Endereço">
            <div className="profile-form-address-stack">
              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label htmlFor="admin-address-street">Rua</label>
                  <input
                    id="admin-address-street"
                    value={form.addressStreet}
                    onChange={(e) => update({ addressStreet: e.target.value })}
                  />
                </div>

                <div className="field field-span-1">
                  <label htmlFor="admin-address-number">Número</label>
                  <input
                    id="admin-address-number"
                    value={form.addressNumber}
                    onChange={(e) => update({ addressNumber: e.target.value })}
                  />
                </div>

                <div className="field field-span-2">
                  <label htmlFor="admin-address-complement">Complemento</label>
                  <input
                    id="admin-address-complement"
                    value={form.addressComplement}
                    onChange={(e) =>
                      update({ addressComplement: e.target.value })
                    }
                  />
                </div>

                <div className="field field-span-3">
                  <label htmlFor="admin-address-district">Bairro</label>
                  <input
                    id="admin-address-district"
                    value={form.addressDistrict}
                    onChange={(e) =>
                      update({ addressDistrict: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="profile-form-fields-grid profile-form-address-grid">
                <div className="field field-span-6">
                  <label htmlFor="admin-address-city">Cidade</label>
                  <input
                    id="admin-address-city"
                    value={form.addressCity}
                    onChange={(e) => update({ addressCity: e.target.value })}
                  />
                </div>

                <div className="field field-span-1">
                  <label htmlFor="admin-address-state">Estado</label>
                  <input
                    id="admin-address-state"
                    value={form.addressState}
                    onChange={(e) => update({ addressState: e.target.value })}
                  />
                </div>

                <div className="field field-span-2">
                  <label htmlFor="admin-address-zipcode">CEP</label>
                  <input
                    id="admin-address-zipcode"
                    value={maskZipCode(form.addressZipCode || "")}
                    onChange={(e) =>
                      update({
                        addressZipCode: normalizeDigits(e.target.value).slice(
                          0,
                          8,
                        ),
                      })
                    }
                    placeholder="00000-000"
                  />
                </div>

                <div className="field field-span-3">
                  <label htmlFor="admin-address-country">País</label>
                  <input
                    id="admin-address-country"
                    value={form.addressCountry}
                    onChange={(e) => update({ addressCountry: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}

      <AdminViewModal
        isOpen={isViewOpen}
        admin={editTarget}
        onClose={() => setIsViewOpen(false)}
      />

      {statusMessage && (
        <div style={{ marginTop: 12 }}>
          <StatusMessage message={statusMessage} />
        </div>
      )}
    </>
  );
}
