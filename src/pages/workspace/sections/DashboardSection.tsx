import { EntitySearchList } from "../components/EntitySearchList";
import { useDashboard } from "../hooks/useDashboard";
import { useWorkspaceContext } from "../WorkspaceContext";
import { maskCpf, normalizeDigits } from "../formatter";

export function DashboardSection() {
  const { role } = useWorkspaceContext();
  const {
    childrenQuery,
    parentsQuery,
    collaboratorsQuery,
    activeAttendancesQuery,
    checkinMut,
    checkoutMut,
    checkinChildSearch,
    setCheckinChildSearch,
    selectedCheckinChildId,
    toggleCheckinChildSelection,
    isCheckinModalOpen,
    checkinResponsibleSearch,
    setCheckinResponsibleSearch,
    selectedCheckinResponsibleId,
    toggleCheckinResponsibleSelection,
    checkinNotes,
    setCheckinNotes,
    childOptions,
    responsibleOptions,
    dashboardMetrics,
    dashboardAttendances,
    isCheckoutModalOpen,
    selectedCheckoutAttendance,
    checkoutResponsibleDocument,
    setCheckoutResponsibleDocument,
    openCheckinModal,
    closeCheckinModal,
    openCheckoutModal,
    closeCheckoutModal,
    onCheckinSubmit,
    onCheckoutSubmit,
  } = useDashboard();

  const dashboardQueries = [
    childrenQuery,
    parentsQuery,
    collaboratorsQuery,
    activeAttendancesQuery,
  ];

  const isDashboardLoading = dashboardQueries.some((query) => query.isLoading);
  const dashboardError = dashboardQueries.find((query) => query.error);
  const dashboardErrorMessage =
    dashboardError && dashboardError.error instanceof Error
      ? dashboardError.error.message
      : "";

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Dashboard</h2>
          <span className="pill">Visao geral</span>
        </div>

        {isDashboardLoading && (
          <p className="operation-hint">Carregando dashboard...</p>
        )}

        {dashboardErrorMessage && !isDashboardLoading && (
          <p className="operation-hint">{dashboardErrorMessage}</p>
        )}

        <div className="profile-grid">
          <article className="profile-card">
            <span>👶 Criancas cadastradas</span>
            <strong>{dashboardMetrics.totalChildren}</strong>
          </article>
          <article className="profile-card">
            <span>👨‍👩‍👧 Responsaveis cadastrados</span>
            <strong>{dashboardMetrics.totalParents}</strong>
          </article>
          {role === "company" && (
            <article className="profile-card">
              <span>👷 Colaboradores</span>
              <strong>{dashboardMetrics.totalCollaborators}</strong>
            </article>
          )}
          <article className="profile-card">
            <span>✅ Criancas no espaco agora</span>
            <strong>{dashboardMetrics.totalActiveAttendances}</strong>
            <span
              className="pill"
              style={{
                backgroundColor:
                  dashboardMetrics.totalActiveAttendances > 0
                    ? "#d4edda"
                    : "#e9ecef",
                color:
                  dashboardMetrics.totalActiveAttendances > 0
                    ? "#155724"
                    : "#495057",
                marginTop: "0.5rem",
              }}
            >
              {dashboardMetrics.totalActiveAttendances > 0
                ? "Em tempo real"
                : "Nenhuma crianca no momento"}
            </span>
          </article>
        </div>
      </section>

      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Criancas no espaco agora</h2>
          <span className="pill">Atualizado automaticamente</span>
          <button
            type="button"
            className="btn solid"
            onClick={openCheckinModal}
            disabled={childrenQuery.isLoading}
          >
            Registrar Check-in
          </button>
        </div>

        <div className="crm-table">
          {dashboardAttendances.map((attendance) => (
            <article
              key={String(
                attendance.id || attendance.childId || attendance.checkInEpoch,
              )}
              className="crm-row"
            >
              <div>
                <strong>{attendance.childDisplayName}</strong>
                <p>Check-in: {attendance.checkInLabel || "-"}</p>
                <p>Colaborador: {attendance.collaboratorDisplayName}</p>
              </div>
              <div className="crm-row-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => openCheckoutModal(attendance)}
                >
                  Fazer Check-out
                </button>
              </div>
            </article>
          ))}

          {dashboardAttendances.length === 0 && (
            <p>Nenhuma crianca está no espaco no momento.</p>
          )}
        </div>
      </section>

      {isCheckinModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={closeCheckinModal}
        >
          <section
            className="crm-modal crm-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-label="Registrar check-in"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Registrar Check-in</h2>

            <form className="crm-form-grid checkin-modal-form" onSubmit={onCheckinSubmit}>
              <EntitySearchList
                label="Crianca"
                searchValue={checkinChildSearch}
                onSearchChange={setCheckinChildSearch}
                options={childOptions}
                selectedIds={selectedCheckinChildId}
                onToggle={toggleCheckinChildSelection}
                isLoading={childrenQuery.isLoading}
                placeholder="Buscar por nome ou ID"
                mode="radio"
              />

              {selectedCheckinChildId && (
                <EntitySearchList
                  label="Responsavel"
                  searchValue={checkinResponsibleSearch}
                  onSearchChange={setCheckinResponsibleSearch}
                  options={responsibleOptions}
                  selectedIds={selectedCheckinResponsibleId}
                  onToggle={toggleCheckinResponsibleSelection}
                  isLoading={parentsQuery.isLoading}
                  placeholder="Buscar por nome ou ID"
                  mode="radio"
                />
              )}

              <div className="field">
                <label htmlFor="checkin-notes">Observacoes</label>
                <textarea
                  id="checkin-notes"
                  className="checkin-notes-field"
                  value={checkinNotes}
                  onChange={(event) => setCheckinNotes(event.target.value)}
                  placeholder="Adicione observacoes do check-in"
                  rows={4}
                />
              </div>

              {checkinMut.isPending && (
                <p className="operation-hint">Processando check-in...</p>
              )}

              {checkinMut.error && !checkinMut.isPending && (
                <p className="operation-hint">{checkinMut.error.message}</p>
              )}

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={closeCheckinModal}
                  disabled={checkinMut.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={checkinMut.isPending}
                >
                  {checkinMut.isPending
                    ? "Registrando..."
                    : "Confirmar Check-in"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isCheckoutModalOpen && selectedCheckoutAttendance && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={closeCheckoutModal}
        >
          <section
            className="crm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Fazer check-out"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Fazer Check-out</h2>

            <div className="profile-section">
              <div className="profile-grid">
                <article className="profile-card">
                  <span>Crianca</span>
                  <strong>{selectedCheckoutAttendance.childDisplayName}</strong>
                </article>
                <article className="profile-card">
                  <span>Check-in</span>
                  <strong>
                    {selectedCheckoutAttendance.checkInLabel || "-"}
                  </strong>
                </article>
              </div>
            </div>

            <form className="crm-form-grid" onSubmit={onCheckoutSubmit}>
              <div className="field">
                <label htmlFor="checkout-responsible-document">
                  CPF do responsavel
                </label>
                <input
                  id="checkout-responsible-document"
                  value={maskCpf(checkoutResponsibleDocument)}
                  onChange={(event) =>
                    setCheckoutResponsibleDocument(
                      normalizeDigits(event.target.value).slice(0, 11),
                    )
                  }
                  placeholder="000.000.000-00"
                />
              </div>

              {checkoutMut.isPending && (
                <p className="operation-hint">Processando check-out...</p>
              )}

              {checkoutMut.error && !checkoutMut.isPending && (
                <p className="operation-hint">{checkoutMut.error.message}</p>
              )}

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={closeCheckoutModal}
                  disabled={checkoutMut.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={checkoutMut.isPending}
                >
                  {checkoutMut.isPending
                    ? "Confirmando..."
                    : "Confirmar Check-out"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
