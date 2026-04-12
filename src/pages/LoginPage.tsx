import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authRolePaths } from "../auth/authRoles";
import { useAuth } from "../auth/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, session, status } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    return <Navigate to={authRolePaths[session.role]} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      await login({ email, password });
      navigate("/app", { replace: true });
    } catch {
      setError("Falha ao autenticar. Verifique credenciais e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled = isSubmitting || status === "loading";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="auth-kicker">Acesso unico</p>
        <h1>Entre com seu perfil</h1>
        <p>
          Uma tela de login unica com roteamento automatico por role apos
          autenticacao JWT.
        </p>

        <form className="stack login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="operacao@empresa.com"
            required
            disabled={disabled}
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="******"
            required
            disabled={disabled}
          />

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="btn solid" disabled={disabled}>
            {disabled ? "Autenticando..." : "Entrar"}
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
