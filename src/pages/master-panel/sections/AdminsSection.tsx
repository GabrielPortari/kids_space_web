import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAdmins } from "../hooks/useAdmins";
import { createAdmin, updateAdmin, deleteAdmin } from "../../../api/modules/adminApi";
import { useState } from "react";
import { ConfirmDeleteModal } from "../../workspace/components/ConfirmDeleteModal";
import { AdminModal } from "../components/AdminModal";
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
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateAdmin(id, payload),
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
            <button type="button" className="btn outline crm-icon-btn" onClick={() => queryClient.resetQueries({ queryKey: ["master", "admins"] })}>
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
              <article key={`admin-skeleton-${index}`} className="crm-row crm-row-skeleton">
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

              {admins.length === 0 && <p>Nenhum admin encontrado para a busca informada.</p>}
            </>
          )}
        </div>

        <Pagination page={page} totalPages={Math.max(1, Math.ceil((pag?.total || 0) / perPage))} onPageChange={setPage} />
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

      <AdminModal
        isOpen={isEditOpen}
        initial={editTarget ? { id: editTarget.id, name: editTarget.name, email: editTarget.email, active: editTarget.active } : undefined}
        onClose={() => {
          setIsEditOpen(false);
          setEditTarget(null);
          setModalError(null);
        }}
        onSave={(payload) => {
          setModalError(null);
          if (editTarget) {
            return updateMut.mutateAsync({ id: editTarget.id, payload });
          }
          return createMut.mutateAsync(payload);
        }}
        isLoading={createMut.status === "pending" || updateMut.status === "pending"}
        error={modalError}
      />

      <AdminViewModal
        isOpen={isViewOpen}
        admin={editTarget}
        onClose={() => setIsViewOpen(false)}
        onEdit={() => {
          setIsEditOpen(true);
          setIsViewOpen(false);
        }}
        onDelete={() => {
          setIsDeleteOpen(true);
          setIsViewOpen(false);
        }}
        isDeleting={deleteMut.status === "pending"}
      />

      {statusMessage && (
        <div style={{ marginTop: 12 }}>
          <StatusMessage message={statusMessage} />
        </div>
      )}
    </>
  );
}
