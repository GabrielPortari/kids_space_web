import { Link } from "react-router-dom";

type RoleLoginPageProps = {
  roleName: string;
};

export function RoleLoginPage({ roleName }: RoleLoginPageProps) {
  return (
    <main className="auth-shell">
      <section className="auth-card placeholder">
        <h1>Login {roleName}</h1>
        <p>Pagina em branco reservada para implementacao futura.</p>
        <Link to="/login" className="btn outline">
          Voltar para selecao de login
        </Link>
      </section>
    </main>
  );
}
