import { Link } from "react-router-dom";
import { authRoleLabels, type AuthRole, useAuth } from "../auth/AuthContext";

export function RoleWorkspacePage({ role }: { role: AuthRole }) {
  const { logout, session } = useAuth();

  return (
    <main className="auth-shell">
      <section className="auth-card placeholder role-workspace">
        <p className="auth-kicker">{authRoleLabels[role]}</p>
        <h1>Painel {authRoleLabels[role]}</h1>
        <p>
          Area autenticada reservada para futuras funcionalidades.
          {session?.email ? ` Usuario atual: ${session.email}` : ""}
        </p>
        <div className="auth-actions role-actions">
          <Link to="/" className="btn outline auth-back">
            Voltar para Home
          </Link>
          <button type="button" className="btn solid" onClick={logout}>
            Sair
          </button>
        </div>
      </section>
    </main>
  );
}
