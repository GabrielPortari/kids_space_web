import { Navigate, Outlet } from "react-router-dom";
import { authRolePaths } from "../auth/authRoles";
import type { AuthRole } from "../auth/jwt";
import { useAuth } from "../auth/useAuth";

export function ProtectedRoute({ allowedRole }: { allowedRole?: AuthRole }) {
  const { session, status } = useAuth();

  if (status === "loading") {
    return (
      <main className="auth-shell">
        <section className="auth-card placeholder">
          <h1>Carregando sessao</h1>
          <p>Validando autenticacao e permissoes...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && session.role !== allowedRole) {
    return <Navigate to={authRolePaths[session.role]} replace />;
  }

  return <Outlet />;
}
