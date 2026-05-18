import { EntitySearchList } from "../components/EntitySearchList";
import { SkeletonBlock } from "../components/WorkspaceSkeleton";
import { useDashboard } from "../hooks/useDashboard";
import { useWorkspaceContext } from "../WorkspaceContext";
import { maskCpf, normalizeDigits } from "../formatter";
import { useQueryClient } from "@tanstack/react-query";

function getAttendanceKindIcon(item: {
  checkOutLabel?: string;
  checkInLabel?: string;
}): { icon: string; label: string } {
  if (item.checkOutLabel) {
    return { icon: "↗", label: "Check-out" };
  }

  if (item.checkInLabel) {
    return { icon: "↘", label: "Check-in" };
  }

  return { icon: "•", label: "Atendimento" };
}

export function DashboardSection() {
  const queryClient = useQueryClient();
  const { role } = useWorkspaceContext();
  const {
    childrenQuery,
    parentsQuery,
    collaboratorsQuery,
    activeAttendancesQuery,
    latestCheckinAndCheckoutQuery,
    last10AttendancesQuery,
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
    latestCheckinCard,
    latestCheckoutCard,
    last10AttendanceCards,
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
    latestCheckinAndCheckoutQuery,
    last10AttendancesQuery,
  ];

  const isDashboardLoading = dashboardQueries.some((query) => query.isLoading);
  const dashboardError = dashboardQueries.find((query) => query.error);
  const dashboardErrorMessage =
    dashboardError && dashboardError.error instanceof Error
      ? dashboardError.error.message
      : "";

  const handleRefresh = () => {
    void queryClient.resetQueries({ queryKey: ["dashboard"] });
  };

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Dashboard</h2>
          <div className="crm-panel-head-actions">
            <span className="pill">Visao geral</span>
            <button
              type="button"
              className="btn outline"
              onClick={handleRefresh}
              disabled={isDashboardLoading}
            >
              Atualizar
            </button>
          </div>
        </div>

        {dashboardErrorMessage && !isDashboardLoading && (
          <p className="operation-hint">{dashboardErrorMessage}</p>
        )}

        {isDashboardLoading ? (
          <div className="profile-grid dashboard-metrics-grid">
            {Array.from({ length: role === "company" ? 4 : 3 }).map(
              (_, index) => (
                <article
                  key={`dashboard-metric-skeleton-${index}`}
                  className="profile-card profile-card-skeleton"
                >
                  <SkeletonBlock width="42%" height="0.72rem" />
                  <SkeletonBlock width="68%" height="1.9rem" />
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="profile-grid dashboard-metrics-grid">
            <article className="profile-card">
              <span>👶 Crianças</span>
              <strong>{dashboardMetrics.totalChildren}</strong>
            </article>
            <article className="profile-card">
              <span>👨‍👩‍👧 Responsáveis</span>
              <strong>{dashboardMetrics.totalParents}</strong>
            </article>
            {role === "company" && (
              <article className="profile-card">
                <span>👷 Colaboradores</span>
                <strong>{dashboardMetrics.totalCollaborators}</strong>
              </article>
            )}
            <article className="profile-card">
              <span>✅ No espaço agora</span>
              <strong>{dashboardMetrics.totalActiveAttendances}</strong>
            </article>
          </div>
        )}
      </section>

      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Movimento recente</h2>
          <span className="pill">Ultimos eventos da empresa</span>
        </div>

        {isDashboardLoading ? (
          <div className="dashboard-movement-layout">
            <div className="dashboard-movement-stack">
              {Array.from({ length: 2 }).map((_, index) => (
                <article
                  key={`dashboard-movement-skeleton-${index}`}
                  className="profile-card profile-card-skeleton"
                >
                  <SkeletonBlock width="38%" height="0.72rem" />
                  <SkeletonBlock width="72%" height="1.25rem" />
                  <SkeletonBlock width="88%" height="0.8rem" />
                </article>
              ))}
            </div>

            <article className="profile-card dashboard-recent-card profile-card-skeleton">
              <SkeletonBlock width="48%" height="0.72rem" />
              <SkeletonBlock width="22%" height="1.85rem" />
              <ul className="dashboard-recent-list dashboard-recent-list-skeleton">
                {Array.from({ length: 6 }).map((_, index) => (
                  <li key={`dashboard-recent-skeleton-${index}`}>
                    <span className="dashboard-recent-item-label">
                      <SkeletonBlock
                        className="workspace-skeleton-pill"
                        width="1.05rem"
                        height="1.05rem"
                      />
                      <SkeletonBlock width="9.5rem" height="0.78rem" />
                    </span>
                    <SkeletonBlock width="4.2rem" height="0.72rem" />
                  </li>
                ))}
              </ul>
            </article>
          </div>
        ) : (
          <div className="dashboard-movement-layout">
            <div className="dashboard-movement-stack">
              <article className="profile-card">
                <span>Ultimo check-in</span>
                <strong>{latestCheckinCard?.childDisplayName || "-"}</strong>
                <p className="dashboard-card-meta">
                  {latestCheckinCard
                    ? `${latestCheckinCard.checkInLabel || "Sem horario"} • ${latestCheckinCard.collaboratorDisplayName}`
                    : "Nenhum check-in localizado."}
                </p>
              </article>

              <article className="profile-card">
                <span>Ultimo check-out</span>
                <strong>{latestCheckoutCard?.childDisplayName || "-"}</strong>
                <p className="dashboard-card-meta">
                  {latestCheckoutCard
                    ? `${latestCheckoutCard.checkOutLabel || "Sem horario"} • ${latestCheckoutCard.collaboratorDisplayName}`
                    : "Nenhum check-out localizado."}
                </p>
              </article>
            </div>

            <article className="profile-card dashboard-recent-card">
              <span>Ultimos 10 atendimentos</span>
              <strong>{last10AttendanceCards.length}</strong>
              <ul className="dashboard-recent-list">
                {last10AttendanceCards.slice(0, 10).map((item) => {
                  const kind = getAttendanceKindIcon(item);

                  return (
                    <li
                      key={`${item.id || item.childDisplayName}-${item.sortEpoch}`}
                    >
                      <span className="dashboard-recent-item-label">
                        <span
                          className={`dashboard-recent-kind dashboard-recent-kind-${kind.label.toLowerCase()}`}
                          title={kind.label}
                          aria-label={kind.label}
                        >
                          {kind.icon}
                        </span>
                        {item.childDisplayName}
                      </span>
                      <small>
                        {item.checkInLabel || item.checkOutLabel || "-"}
                      </small>
                    </li>
                  );
                })}
              </ul>
            </article>
          </div>
        )}
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
          {isDashboardLoading && dashboardAttendances.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`dashboard-attendance-skeleton-${index}`}
                className="crm-row crm-row-skeleton"
              >
                <div className="workspace-skeleton-stack">
                  <SkeletonBlock width="42%" height="1rem" />
                  <SkeletonBlock width="70%" height="0.8rem" />
                  <SkeletonBlock width="55%" height="0.8rem" />
                </div>
                <div className="crm-row-actions">
                  <SkeletonBlock width="8.5rem" height="2.4rem" />
                </div>
              </article>
            ))
          ) : (
            <>
              {dashboardAttendances.map((attendance) => (
                <article
                  key={String(
                    attendance.id ||
                      attendance.childId ||
                      attendance.checkInEpoch,
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
            </>
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

            <form
              className="crm-form-grid checkin-modal-form"
              onSubmit={onCheckinSubmit}
            >
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
