import { useWorkspaceContext } from "../WorkspaceContext";
import { authRoleLabels } from "../../../auth/authRoles";
import { Link } from "react-router-dom";
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
  const { role, session, logout } = useWorkspaceContext();

  return (
    <aside className="crm-sidebar">
      <div>
        <p className="auth-kicker">{authRoleLabels[role]}</p>
        <h1>Painel</h1>
        <p>{session?.email || "Usuario autenticado"}</p>
      </div>

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

      <div className="crm-sidebar-actions">
        <Link to="/" className="btn outline auth-back">
          Voltar para Home
        </Link>

        <button
          type="button"
          className="btn solid"
          onClick={() => {
            void logout();
          }}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
