import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  authRoleLabels,
  authRolePaths,
  type AuthRole,
  useAuth,
} from "../auth/AuthContext";

const roleOptions: AuthRole[] = ["master-admin", "company", "collaborator"];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, session } = useAuth();

  if (session) {
    return <Navigate to={authRolePaths[session.role]} replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const role = String(formData.get("role") || "company") as AuthRole;

    login({ email, role });
    navigate(authRolePaths[role], { replace: true });
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="auth-kicker">Acesso unico</p>
        <h1>Entre com seu perfil</h1>
        <p>
          Uma tela de login so, com separacao automatica por role apos a
          autenticacao.
        </p>

        <form className="stack login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="operacao@empresa.com"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="******"
            required
          />

          <label htmlFor="role">Perfil de acesso</label>
          <select id="role" name="role" defaultValue="company">
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {authRoleLabels[role]}
              </option>
            ))}
          </select>

          <button type="submit" className="btn solid">
            Entrar
          </button>
        </form>

        <div className="auth-actions">
          <Link to="/" className="btn outline auth-back">
            Voltar para Home
          </Link>
        </div>
      </section>
    </main>
  );
}
