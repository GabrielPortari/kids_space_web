import { Link } from "react-router-dom";
import { authRoleLabels } from "../auth/authRoles";
import type { AuthRole } from "../auth/jwt";
import { useAuth } from "../auth/useAuth";

export function RoleWorkspacePage({ role }: { role: AuthRole }) {
  const { logout, session, status } = useAuth();

  return (
    <main className="auth-shell">
      <section className="auth-card placeholder role-workspace">
        <p className="auth-kicker">{authRoleLabels[role]}</p>
        <h1>Painel {authRoleLabels[role]}</h1>
        <p>
          Area autenticada reservada para futuras funcionalidades.
          {session?.email ? ` Usuario atual: ${session.email}` : ""}
        </p>
        <p>
          Sessao: {status}. {session?.userId ? `UID: ${session.userId}.` : ""}
          {session?.companyId ? ` Company: ${session.companyId}.` : ""}
        </p>
        <div className="auth-actions role-actions">
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
      </section>
    </main>
  );
}
