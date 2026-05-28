import { useMasterOverview } from "../hooks/useMasterOverview";

export function OverviewSection() {
  const { counts, isLoading } = useMasterOverview();

  if (isLoading) return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <h2>Visão geral</h2>
      </div>
      <p>Carregando...</p>
    </section>
  );

  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <div>
          <h2>Visão geral</h2>
          <p>Resumo rápido do sistema para o master.</p>
        </div>
      </div>

      <div className="crm-grid">
        <div className="crm-card">
          <strong>{counts.admins}</strong>
          <p>Admins</p>
        </div>

        <div className="crm-card">
          <strong>{counts.companies}</strong>
          <p>Companies</p>
        </div>

        <div className="crm-card">
          <strong>{counts.collaborators}</strong>
          <p>Collaborators</p>
        </div>

        <div className="crm-card">
          <strong>{counts.parents}</strong>
          <p>Parents</p>
        </div>

        <div className="crm-card">
          <strong>{counts.children}</strong>
          <p>Children</p>
        </div>

        <div className="crm-card">
          <strong>{counts.attendances}</strong>
          <p>Attendances</p>
        </div>
      </div>
    </section>
  );
}
