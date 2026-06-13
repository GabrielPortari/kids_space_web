import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDeleteModal } from "../../workspace/components/ConfirmDeleteModal";
import {
  ProfileModal,
  ProfileModalSection,
} from "../../workspace/components/ProfileModal";
import {
  AttendanceIcon,
  EditIcon,
  PlusIcon,
  RecordAvatar,
  RefreshIcon,
} from "../../workspace/components/WorkspaceVisuals";
import { Pagination } from "../../workspace/components/Pagination";
import { SkeletonBlock } from "../../workspace/components/WorkspaceSkeleton";
import { StatusMessage } from "../../workspace/components/StatusMessage";
import { PAGE_SIZE } from "../../workspace/constants";
import { extractId, formatTimestamp } from "../../workspace/formatter";
import type { ListItem } from "../../workspace/types";
import {
  createAttendanceAdmin,
  deleteAttendanceAdmin,
  listAttendancesAdmin,
  updateAttendanceAdmin,
} from "../../../api/modules/adminApi";

type AttendanceAdminFormState = {
  companyId: string;
  childId: string;
  responsibleIdWhoCheckedInId: string;
  notes: string;
};

const INITIAL_FORM: AttendanceAdminFormState = {
  companyId: "",
  childId: "",
  responsibleIdWhoCheckedInId: "",
  notes: "",
};

function getAttendanceType(item: Record<string, unknown>): string {
  if ((item as any).checkInTime && !(item as any).checkOutTime) {
    return "Entrada";
  }

  if ((item as any).checkOutTime) {
    return "Saída";
  }

  return "Desconhecido";
}

export function AttendanceSection({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AttendanceAdminFormState>(INITIAL_FORM);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const attendancesQuery = useQuery({
    queryKey: ["master", "attendances", companyId ?? "all"],
    queryFn: () => listAttendancesAdmin(companyId),
  });

  const attendances = attendancesQuery.data || [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return attendances;

    return attendances.filter((item: ListItem) => {
      const childName = String(
        (item as any).childSnapshot?.name || item.childName || "",
      ).toLowerCase();
      const childId = String(item.childId || "").toLowerCase();
      const companyId = String(item.companyId || "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();
      return (
        childName.includes(term) ||
        childId.includes(term) ||
        companyId.includes(term) ||
        notes.includes(term)
      );
    });
  }, [attendances, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const isLoading = attendancesQuery.isLoading;

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
      if (!effectiveCompanyId || !form.childId.trim()) {
        throw new Error("Company ID e Child ID sao obrigatorios.");
      }

      return createAttendanceAdmin(effectiveCompanyId, {
        childId: form.childId.trim(),
        responsibleIdWhoCheckedInId:
          form.responsibleIdWhoCheckedInId.trim() || undefined,
        notes: form.notes.trim() || undefined,
        companyId: effectiveCompanyId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["master", "attendances"],
      });
      setIsCreateOpen(false);
      notify("Atendimento criado com sucesso.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!selectedItem) {
        throw new Error("Nao foi possivel identificar o atendimento.");
      }

      const id = extractId(selectedItem);
      const companyId = String(
        selectedItem.companyId || form.companyId || "",
      ).trim();
      if (!id || !companyId) {
        throw new Error("Company ID e obrigatorio para editar atendimento.");
      }

      return updateAttendanceAdmin(companyId, id, {
        childId: form.childId.trim() || undefined,
        responsibleIdWhoCheckedInId:
          form.responsibleIdWhoCheckedInId.trim() || undefined,
        notes: form.notes.trim() || undefined,
        companyId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["master", "attendances"],
      });
      setIsEditOpen(false);
      setSelectedItem(null);
      notify("Atendimento atualizado.");
    },
    onError: (err: any) => setError(err?.message || String(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!selectedItem) {
        throw new Error("Nao foi possivel identificar o atendimento.");
      }

      const id = extractId(selectedItem);
      const companyId = String(
        selectedItem.companyId || form.companyId || "",
      ).trim();
      if (!id || !companyId) {
        throw new Error("Company ID e obrigatorio para excluir atendimento.");
      }

      return deleteAttendanceAdmin(companyId, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["master", "attendances"],
      });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      notify("Atendimento removido com sucesso.");
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
      companyId: String(item.companyId || ""),
      childId: String(item.childId || ""),
      responsibleIdWhoCheckedInId: String(
        item.responsibleIdWhoCheckedInId || "",
      ),
      notes: String(item.notes || ""),
    });
    setIsEditOpen(true);
  };

  const openView = (item: ListItem) => {
    setSelectedItem(item);
    setForm({
      companyId: String(item.companyId || ""),
      childId: String(item.childId || ""),
      responsibleIdWhoCheckedInId: String(
        item.responsibleIdWhoCheckedInId || "",
      ),
      notes: String(item.notes || ""),
    });
    setIsViewOpen(true);
  };

  const attendanceDetails = selectedItem
    ? [
        {
          label: "Crianca",
          value:
            (selectedItem as any).childSnapshot?.name ||
            (selectedItem as any).childName ||
            selectedItem.childId ||
            "-",
        },
        {
          label: "Tipo",
          value: getAttendanceType(selectedItem),
        },
        {
          label: "Hora de entrada",
          value: (selectedItem as any).checkInTime
            ? formatTimestamp((selectedItem as any).checkInTime)
            : "-",
        },
        {
          label: "Hora de saida",
          value: (selectedItem as any).checkOutTime
            ? formatTimestamp((selectedItem as any).checkOutTime)
            : "-",
        },
        {
          label: "Responsavel de entrada",
          value:
            (selectedItem as any).responsibleCheckedInSnapshot?.name ||
            selectedItem.responsibleIdWhoCheckedInId ||
            "-",
        },
        {
          label: "Colaborador de entrada",
          value:
            (selectedItem as any).collaboratorCheckedInSnapshot?.name ||
            (selectedItem as any).collaboratorWhoCheckedInId ||
            "-",
        },
        {
          label: "Company ID",
          value: selectedItem.companyId || "-",
        },
        {
          label: "Observacoes",
          value: selectedItem.notes || "-",
        },
      ]
    : [];

  return (
    <>
      <section className="crm-panel">
        <div style={{ marginBottom: 8 }}>
          <StatusMessage message={statusMessage} />
        </div>

        <div className="crm-panel-head">
          <h2>Atendimentos</h2>
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
                  queryKey: ["master", "attendances"],
                })
              }
              disabled={isLoading}
              aria-label="Atualizar atendimentos"
              title="Atualizar atendimentos"
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
            placeholder="Buscar por criança, notes ou company"
          />
        </div>

        <div className="crm-table">
          {isLoading && paged.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`attendance-skeleton-${index}`}
                className="crm-row crm-row-skeleton"
              >
                <div className="workspace-skeleton-stack">
                  <SkeletonBlock width="43%" height="1rem" />
                  <SkeletonBlock width="34%" height="0.85rem" />
                  <SkeletonBlock width="62%" height="0.85rem" />
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
                const typeLabel = getAttendanceType(item);
                return (
                  <article
                    key={id || JSON.stringify(item)}
                    className="crm-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => openView(item)}
                  >
                    <div className="record-row-main">
                      <RecordAvatar
                        name={
                          (item as any).childSnapshot?.name ||
                          (item as any).childName ||
                          "Crianca"
                        }
                      />
                      <div className="record-row-copy">
                        <strong>
                          {(item as any).childSnapshot?.name ||
                            (item as any).childName ||
                            "Crianca sem nome"}
                        </strong>
                        <div className="record-row-meta">
                          <span className="pill">{typeLabel}</span>
                          <p style={{ margin: 0 }}>
                            Company: {item.companyId || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            Entrada:{" "}
                            {(item as any).checkInTime
                              ? formatTimestamp((item as any).checkInTime)
                              : "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            Saída:{" "}
                            {(item as any).checkOutTime
                              ? formatTimestamp((item as any).checkOutTime)
                              : "-"}
                          </p>
                        </div>
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
                <p>Nenhum atendimento encontrado para a busca informada.</p>
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
          icon={<AttendanceIcon />}
          title="Detalhes de Atendimento"
          subtitle="Visualize as informações do atendimento"
          mode="view"
        >
          <ProfileModalSection label="Informacoes gerais">
            <div className="profile-grid">
              {attendanceDetails.map((detail) => (
                <article key={detail.label} className="profile-card">
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </article>
              ))}
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
          icon={<AttendanceIcon />}
          title="Novo Atendimento"
          subtitle="Cadastre um atendimento"
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
          <ProfileModalSection label="Dados do atendimento">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-6">
                <label htmlFor="master-att-company">Company ID</label>
                <input
                  id="master-att-company"
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
              <div className="field field-span-6">
                <label htmlFor="master-att-child">Child ID</label>
                <input
                  id="master-att-child"
                  value={form.childId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      childId: e.target.value,
                    }))
                  }
                  placeholder="ID da crianca"
                  required
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-att-responsible">
                  Responsável de entrada
                </label>
                <input
                  id="master-att-responsible"
                  value={form.responsibleIdWhoCheckedInId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      responsibleIdWhoCheckedInId: e.target.value,
                    }))
                  }
                  placeholder="ID do responsavel"
                />
              </div>
              <div className="field field-span-12">
                <label htmlFor="master-att-notes">Observações</label>
                <textarea
                  id="master-att-notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  rows={4}
                />
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
          icon={<AttendanceIcon />}
          title="Editar Atendimento"
          subtitle="Atualize o atendimento"
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
          <ProfileModalSection label="Dados do atendimento">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-6">
                <label htmlFor="master-att-edit-company">Company ID</label>
                <input
                  id="master-att-edit-company"
                  value={form.companyId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      companyId: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-att-edit-child">Child ID</label>
                <input
                  id="master-att-edit-child"
                  value={form.childId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      childId: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="field field-span-6">
                <label htmlFor="master-att-edit-responsible">
                  Responsável de entrada
                </label>
                <input
                  id="master-att-edit-responsible"
                  value={form.responsibleIdWhoCheckedInId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      responsibleIdWhoCheckedInId: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field field-span-12">
                <label htmlFor="master-att-edit-notes">Observações</label>
                <textarea
                  id="master-att-edit-notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
            </div>
          </ProfileModalSection>
        </ProfileModal>,
        document.body,
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Excluir atendimento"
        message={`Deseja excluir ${(selectedItem as any)?.childSnapshot?.name || (selectedItem as any)?.childName || "este atendimento"}?`}
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
