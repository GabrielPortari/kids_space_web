import { useState } from "react";
import { Link } from "react-router-dom";
import { authRoleLabels } from "../../../auth/authRoles";
import { useAuth } from "../../../auth/useAuth";
import type { CompanyOption } from "../MasterPanelPage";
import type { MasterSectionId } from "../types";

type CrmSidebarProps = {
  sections: { id: MasterSectionId; label: string }[];
  activeSection: MasterSectionId;
  onSelect: (section: MasterSectionId) => void;
  companies: CompanyOption[];
  selectedCompany: CompanyOption | null;
  onSelectCompany: (company: CompanyOption) => void;
  onClearCompany: () => void;
};

export function CrmSidebar({
  sections,
  activeSection,
  onSelect,
  companies,
  selectedCompany,
  onSelectCompany,
  onClearCompany,
}: CrmSidebarProps) {
  const { session, logout } = useAuth();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const filteredCompanies = pickerSearch.trim()
    ? companies.filter((c) =>
        c.name.toLowerCase().includes(pickerSearch.trim().toLowerCase()),
      )
    : companies;

  function closePicker() {
    setIsPickerOpen(false);
    setPickerSearch("");
  }

  return (
    <aside className="crm-sidebar">
      <div>
        <p className="auth-kicker">{authRoleLabels.master}</p>
        <h1>Painel Master</h1>
        <p>{session?.email || "Usuário autenticado"}</p>
      </div>

      <div className="crm-scope">
        <label>Escopo</label>

        <div className="crm-scope-display">
          <span
            className="crm-scope-value"
            title={selectedCompany?.id ?? "Global"}
          >
            {selectedCompany ? selectedCompany.name : "Global"}
          </span>
          {selectedCompany && (
            <button
              type="button"
              className="crm-scope-clear"
              onClick={() => {
                onClearCompany();
                closePicker();
              }}
            >
              Limpar
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn outline crm-scope-btn"
          onClick={() => {
            setIsPickerOpen((v) => !v);
            setPickerSearch("");
          }}
        >
          {selectedCompany ? "Trocar empresa" : "Selecionar empresa"}
        </button>

        {isPickerOpen && (
          <div className="crm-scope-picker">
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              autoFocus
            />
            <ul className="crm-scope-picker-list">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <li key={company.id}>
                    <button
                      type="button"
                      className={
                        selectedCompany?.id === company.id ? "active" : ""
                      }
                      onClick={() => {
                        onSelectCompany(company);
                        closePicker();
                      }}
                    >
                      {company.name}
                    </button>
                  </li>
                ))
              ) : (
                <li className="crm-scope-picker-empty">
                  Nenhuma empresa encontrada
                </li>
              )}
            </ul>
          </div>
        )}
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
