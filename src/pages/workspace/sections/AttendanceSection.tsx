import { useAttendance } from "../hooks/useAttendance";
import { useWorkspaceContext } from "../WorkspaceContext";
import { Pagination } from "../components/Pagination";
import { SkeletonBlock } from "../components/WorkspaceSkeleton";
import {
  AttendanceIcon,
  RecordAvatar,
  RefreshIcon,
} from "../components/WorkspaceVisuals";
import {
  ProfileModal,
  ProfileModalSection,
} from "../components/ProfileModal";
import { extractId, formatTimestamp } from "../formatter";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";

function getAttendanceType(item: Record<string, unknown>): string {
  if ((item as any).checkInTime && !(item as any).checkOutTime) {
    return "checkin";
  }
  if ((item as any).checkOutTime) {
    return "checkout";
  }
  return "unknown";
}

function getAttendanceTypeLabel(item: Record<string, unknown>): string {
  const type = getAttendanceType(item);
  if (type === "checkin") return "Entrada";
  if (type === "checkout") return "Saída";
  return "Desconhecido";
}

export function AttendanceSection() {
  const queryClient = useQueryClient();
  const { page, setPage, search, setSearch } = useWorkspaceContext();

  const {
    pagedCollection,
    attendancesQuery,
    isAttendanceViewModalOpen,
    setIsAttendanceViewModalOpen,
    viewingAttendance,
    openAttendanceViewModal,
  } = useAttendance();
  const isLoading = attendancesQuery.isLoading;
  const handleRefresh = () => {
    void queryClient.resetQueries({ queryKey: ["attendances"] });
  };

  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(pagedCollection.length / PAGE_SIZE) || 1;
  const attendanceDetails = viewingAttendance
    ? [
        {
          label: "Crianca",
          value:
            (viewingAttendance as any).childSnapshot?.name ||
            (viewingAttendance as any).childName ||
            "-",
        },
        {
          label: "Tipo",
          value: getAttendanceTypeLabel(viewingAttendance),
        },
        {
          label: "Hora de entrada",
          value: (viewingAttendance as any).checkInTime
            ? formatTimestamp((viewingAttendance as any).checkInTime)
            : "-",
        },
        {
          label: "Hora de saida",
          value: (viewingAttendance as any).checkOutTime
            ? formatTimestamp((viewingAttendance as any).checkOutTime)
            : "-",
        },
        {
          label: "Tempo de permanencia (segundos)",
          value: (viewingAttendance as any).timeCheckedInSeconds || "-",
        },
        {
          label: "Responsavel de entrada",
          value:
            (viewingAttendance as any).responsibleCheckedInSnapshot?.name ||
            (viewingAttendance as any).responsibleIdWhoCheckedInId ||
            "-",
        },
        {
          label: "Responsavel de saida",
          value:
            (viewingAttendance as any).responsibleCheckedOutSnapshot?.name ||
            (viewingAttendance as any).responsibleIdWhoCheckedOutId ||
            "-",
        },
        {
          label: "Colaborador de entrada",
          value:
            (viewingAttendance as any).collaboratorCheckedInSnapshot?.name ||
            (viewingAttendance as any).collaboratorWhoCheckedInId ||
            "-",
        },
        {
          label: "Colaborador de saida",
          value:
            (viewingAttendance as any).collaboratorCheckedOutSnapshot?.name ||
            (viewingAttendance as any).collaboratorWhoCheckedOutId ||
            "-",
        },
        {
          label: "Observacoes",
          value: (viewingAttendance as any).notes || "-",
        },
      ]
    : [];

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Atendimentos</h2>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn outline crm-icon-btn"
              onClick={handleRefresh}
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
            placeholder="Buscar por nome"
          />
        </div>

        <div className="crm-table">
          {isLoading && pagedCollection.length === 0 ? (
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
              </article>
            ))
          ) : (
            <>
              {pagedCollection.map((item) => {
                const typed = item as any;
                const id = extractId(typed);
                const typeLabel = getAttendanceTypeLabel(typed);

                return (
                  <article
                    key={id || JSON.stringify(item)}
                    className="crm-row"
                    onClick={() => openAttendanceViewModal(typed)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="record-row-main">
                      <RecordAvatar
                        name={
                          (typed as any).childSnapshot?.name ||
                          typed.childName ||
                          "Crianca"
                        }
                      />
                      <div className="record-row-copy">
                        <strong>
                          {(typed as any).childSnapshot?.name ||
                            typed.childName ||
                            "Crianca sem nome"}
                        </strong>
                        <div className="record-row-meta">
                          <span className="pill">{typeLabel}</span>
                          {typed.checkInTime && (
                            <p style={{ margin: 0 }}>
                              Entrada: {formatTimestamp(typed.checkInTime)}
                            </p>
                          )}
                          {typed.checkOutTime && (
                            <p style={{ margin: 0 }}>
                              Saída: {formatTimestamp(typed.checkOutTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {pagedCollection.length === 0 && (
                <p>
                  Nenhum registro de atendimento encontrado para a busca
                  informada.
                </p>
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

      {isAttendanceViewModalOpen &&
        viewingAttendance &&
        createPortal(
          <ProfileModal
            isOpen={isAttendanceViewModalOpen}
            onClose={() => setIsAttendanceViewModalOpen(false)}
            icon={<AttendanceIcon />}
            title="Detalhes do Atendimento"
            subtitle={
              (viewingAttendance as any).childSnapshot?.name ||
              (viewingAttendance as any).childName ||
              "Atendimento"
            }
            mode="view"
          >
            <ProfileModalSection label="Criança e tipo">
              <div className="profile-form-fields-grid profile-form-personal-grid">
                <div className="field field-span-6">
                  <label>Criança</label>
                  <input
                    value={
                      (viewingAttendance as any).childSnapshot?.name ||
                      (viewingAttendance as any).childName ||
                      "-"
                    }
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-6">
                  <label>Tipo</label>
                  <input
                    value={getAttendanceTypeLabel(viewingAttendance)}
                    disabled
                    className="field-readonly"
                  />
                </div>
              </div>
            </ProfileModalSection>

            <ProfileModalSection label="Horários">
              <div className="profile-form-fields-grid profile-form-personal-grid">
                <div className="field field-span-6">
                  <label>Entrada</label>
                  <input
                    value={
                      (viewingAttendance as any).checkInTime
                        ? formatTimestamp((viewingAttendance as any).checkInTime)
                        : "-"
                    }
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-6">
                  <label>Saída</label>
                  <input
                    value={
                      (viewingAttendance as any).checkOutTime
                        ? formatTimestamp(
                            (viewingAttendance as any).checkOutTime,
                          )
                        : "-"
                    }
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-12">
                  <label>Tempo de permanência (segundos)</label>
                  <input
                    value={
                      (viewingAttendance as any).timeCheckedInSeconds || "-"
                    }
                    disabled
                    className="field-readonly"
                  />
                </div>
              </div>
            </ProfileModalSection>

            <ProfileModalSection label="Responsáveis e colaboradores">
              <div className="profile-form-fields-grid profile-form-personal-grid">
                <div className="field field-span-6">
                  <label>Responsável — entrada</label>
                  <input
                    value={
                      (viewingAttendance as any).responsibleCheckedInSnapshot
                        ?.name ||
                      (viewingAttendance as any).responsibleIdWhoCheckedInId ||
                      "-"
                    }
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-6">
                  <label>Responsável — saída</label>
                  <input
                    value={
                      (viewingAttendance as any).responsibleCheckedOutSnapshot
                        ?.name ||
                      (viewingAttendance as any).responsibleIdWhoCheckedOutId ||
                      "-"
                    }
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-6">
                  <label>Colaborador — entrada</label>
                  <input
                    value={
                      (viewingAttendance as any).collaboratorCheckedInSnapshot
                        ?.name ||
                      (viewingAttendance as any).collaboratorWhoCheckedInId ||
                      "-"
                    }
                    disabled
                    className="field-readonly"
                  />
                </div>
                <div className="field field-span-6">
                  <label>Colaborador — saída</label>
                  <input
                    value={
                      (viewingAttendance as any).collaboratorCheckedOutSnapshot
                        ?.name ||
                      (viewingAttendance as any).collaboratorWhoCheckedOutId ||
                      "-"
                    }
                    disabled
                    className="field-readonly"
                  />
                </div>
              </div>
            </ProfileModalSection>

            <ProfileModalSection label="Observações">
              <div className="field">
                <textarea
                  value={(viewingAttendance as any).notes || "-"}
                  disabled
                  className="field-readonly"
                  rows={3}
                />
              </div>
            </ProfileModalSection>
          </ProfileModal>,
          document.body,
        )}
    </>
  );
}
