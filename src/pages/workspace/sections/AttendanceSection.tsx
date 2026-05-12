import { useAttendance } from "../hooks/useAttendance";
import { useWorkspaceContext } from "../WorkspaceContext";
import { Pagination } from "../components/Pagination";
import { extractId, formatTimestamp } from "../formatter";

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
  const { page, setPage, search, setSearch } = useWorkspaceContext();

  const {
    pagedCollection,
    onDeleteAttendance,
    isAttendanceViewModalOpen,
    setIsAttendanceViewModalOpen,
    viewingAttendance,
    openAttendanceViewModal,
  } = useAttendance();

  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(pagedCollection.length / PAGE_SIZE) || 1;

  return (
    <>
      <section className="crm-panel">
        <h2>Presenca</h2>

        <div className="crm-panel-head">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou ID"
          />
        </div>

        <div className="crm-table">
          {pagedCollection.map((item) => {
            const typed = item as any;
            const id = extractId(typed);
            const attendanceType = getAttendanceType(typed);
            const typeLabel = getAttendanceTypeLabel(typed);

            return (
              <article
                key={id || JSON.stringify(item)}
                className="crm-row"
                onClick={() => openAttendanceViewModal(typed)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <strong>
                    {(typed as any).childSnapshot?.name ||
                      typed.childName ||
                      "Crianca sem nome"}
                  </strong>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor:
                          attendanceType === "checkin" ? "#4caf50" : "#ff9800",
                        color: "white",
                      }}
                    >
                      {typeLabel}
                    </span>
                    {typed.checkInTime && (
                      <p style={{ margin: 0, fontSize: "14px" }}>
                        Entrada: {formatTimestamp(typed.checkInTime)}
                      </p>
                    )}
                    {typed.checkOutTime && (
                      <p style={{ margin: 0, fontSize: "14px" }}>
                        Saída: {formatTimestamp(typed.checkOutTime)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="crm-row-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!id) return;
                      onDeleteAttendance(id);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })}

          {pagedCollection.length === 0 && (
            <p>
              Nenhum registro de presenca encontrado para a busca informada.
            </p>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>

      {isAttendanceViewModalOpen && viewingAttendance && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsAttendanceViewModalOpen(false)}
        >
          <section
            className="crm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Detalhes de presenca"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Detalhes de Presenca</h2>
            <div className="collaborator-view-content">
              <section className="profile-section">
                <h3>Informacoes gerais</h3>
                <div className="profile-grid">
                  <article className="profile-card">
                    <span>Crianca</span>
                    <strong>
                      {(viewingAttendance as any).childSnapshot?.name ||
                        (viewingAttendance as any).childName ||
                        "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Tipo</span>
                    <strong>{getAttendanceTypeLabel(viewingAttendance)}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Hora de entrada</span>
                    <strong>
                      {(viewingAttendance as any).checkInTime
                        ? formatTimestamp(
                            (viewingAttendance as any).checkInTime,
                          )
                        : "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Hora de saida</span>
                    <strong>
                      {(viewingAttendance as any).checkOutTime
                        ? formatTimestamp(
                            (viewingAttendance as any).checkOutTime,
                          )
                        : "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Tempo de permanencia (segundos)</span>
                    <strong>
                      {(viewingAttendance as any).timeCheckedInSeconds || "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Responsavel de entrada</span>
                    <strong>
                      {(viewingAttendance as any).responsibleCheckedInSnapshot
                        ?.name ||
                        (viewingAttendance as any)
                          .responsibleIdWhoCheckedInId ||
                        "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Responsavel de saida</span>
                    <strong>
                      {(viewingAttendance as any).responsibleCheckedOutSnapshot
                        ?.name ||
                        (viewingAttendance as any)
                          .responsibleIdWhoCheckedOutId ||
                        "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Colaborador de entrada</span>
                    <strong>
                      {(viewingAttendance as any).collaboratorCheckedInSnapshot
                        ?.name ||
                        (viewingAttendance as any).collaboratorWhoCheckedInId ||
                        "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Colaborador de saida</span>
                    <strong>
                      {(viewingAttendance as any).collaboratorCheckedOutSnapshot
                        ?.name ||
                        (viewingAttendance as any)
                          .collaboratorWhoCheckedOutId ||
                        "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Observacoes</span>
                    <strong>{(viewingAttendance as any).notes || "-"}</strong>
                  </article>
                </div>
              </section>
            </div>

            <div className="crm-modal-actions">
              <button
                type="button"
                className="btn outline"
                onClick={() => setIsAttendanceViewModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
