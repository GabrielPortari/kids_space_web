import { useWorkspaceContext } from "../WorkspaceContext";
import { authRoleLabels } from "../../../auth/authRoles";
import type { CrmSection } from "../types";

type SectionNavProps = {
  sections: { id: CrmSection; label: string }[];
  activeSection: CrmSection;
  onSelect: (s: CrmSection) => void;
};

export function SectionNav({
  sections,
  activeSection,
  onSelect,
}: SectionNavProps) {
  const { role, session, isAdminOrMaster, companyScope, setCompanyScope } =
    useWorkspaceContext();

  return (
    <aside className="crm-sidebar">
      <div>
        <p className="auth-kicker">{authRoleLabels[role]}</p>
        <h1>Painel CRM</h1>
        <p>{session?.email || "Usuario autenticado"}</p>
      </div>

      {isAdminOrMaster && (
        <div className="crm-scope">
          <label htmlFor="company-scope">Filtro company (opcional)</label>
          <input
            id="company-scope"
            value={companyScope}
            onChange={(event) => setCompanyScope(event.target.value.trim())}
            placeholder="Digite companyId"
          />
        </div>
      )}

      <nav className="crm-menu">
        {sections.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`crm-menu-item ${
              activeSection === item.id ? "active" : ""
            }`}
            onClick={() => {
              onSelect(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="crm-sidebar-actions"></div>
    </aside>
  );
}
