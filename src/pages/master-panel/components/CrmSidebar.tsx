import { Link } from "react-router-dom";
import { authRoleLabels } from "../../../auth/authRoles";
import { useAuth } from "../../../auth/useAuth";
import type { MasterSectionId } from "../types";

type CrmSidebarProps = {
  sections: { id: MasterSectionId; label: string }[];
  activeSection: MasterSectionId;
  onSelect: (section: MasterSectionId) => void;
};

export function CrmSidebar({
  sections,
  activeSection,
  onSelect,
}: CrmSidebarProps) {
  const { session, logout } = useAuth();

  return (
    <aside className="crm-sidebar">
      <div>
        <p className="auth-kicker">{authRoleLabels.master}</p>
        <h1>Painel Master</h1>
        <p>{session?.email || "Usuário autenticado"}</p>
      </div>

      <div className="crm-scope">
        <label htmlFor="master-scope">Escopo</label>
        <input
          id="master-scope"
          value="Global"
          readOnly
          aria-readonly="true"
        />
      </div>

      <nav className="crm-menu">
        {sections.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`crm-menu-item ${activeSection === item.id ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="crm-sidebar-actions">
        <hr className="crm-divider" />

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