import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card placeholder">
        <h1>404</h1>
        <p>Pagina nao encontrada.</p>
        <Link to="/" className="btn outline">
          Voltar para Home
        </Link>
      </section>
    </main>
  );
}
