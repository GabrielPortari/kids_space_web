import { useMasterOverview } from "../hooks/useMasterOverview";
import { useQueryClient } from "@tanstack/react-query";
import { SkeletonBlock } from "../../workspace/components/WorkspaceSkeleton";

export function OverviewSection() {
  const queryClient = useQueryClient();
  const { counts, isLoading } = useMasterOverview();

  const handleRefresh = () => {
    void queryClient.resetQueries({ queryKey: ["master"] });
  };

  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <div className="crm-panel-title-group">
          <h2>Visão geral</h2>
          <span className="pill">Resumo master</span>
        </div>
        <div className="crm-panel-head-actions">
          <button
            type="button"
            className="btn outline crm-icon-btn"
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Atualizar visão geral"
            title="Atualizar visão geral"
          >
            ↻
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="profile-grid dashboard-metrics-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={`overview-skeleton-${index}`}
              className="profile-card profile-card-skeleton"
            >
              <SkeletonBlock width="42%" height="0.72rem" />
              <SkeletonBlock width="68%" height="1.9rem" />
            </article>
          ))}
        </div>
      ) : (
        <div className="profile-grid dashboard-metrics-grid">
          <article className="profile-card">
            <span>Admins</span>
            <strong>{counts.admins}</strong>
          </article>

          <article className="profile-card">
            <span>Empresas</span>
            <strong>{counts.companies}</strong>
          </article>

          <article className="profile-card">
            <span>Colaboradores</span>
            <strong>{counts.collaborators}</strong>
          </article>

          <article className="profile-card">
            <span>Responsáveis</span>
            <strong>{counts.parents}</strong>
          </article>

          <article className="profile-card">
            <span>Crianças</span>
            <strong>{counts.children}</strong>
          </article>

          <article className="profile-card">
            <span>Atendimentos</span>
            <strong>{counts.attendances}</strong>
          </article>
        </div>
      )}
    </section>
  );
}
