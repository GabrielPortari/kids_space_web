import { Link } from "react-router-dom";

const roleOptions = [
  {
    title: "Master / Admin",
    description: "Acesso com visao global e gestao entre companies.",
    to: "/login/master-admin",
  },
  {
    title: "Company",
    description: "Acesso de gestao da propria empresa e equipe.",
    to: "/login/company",
  },
  {
    title: "Collaborator",
    description: "Acesso operacional para check-in e check-out.",
    to: "/login/collaborator",
  },
];

export function LoginHubPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card wide">
        <h1>Escolha seu tipo de login</h1>
        <p>Selecione abaixo a area de acesso conforme seu role.</p>

        <div className="grid three">
          {roleOptions.map((role) => (
            <article className="card" key={role.title}>
              <h2>{role.title}</h2>
              <p>{role.description}</p>
              <Link to={role.to} className="btn outline">
                Abrir pagina
              </Link>
            </article>
          ))}
        </div>

        <div className="auth-actions">
          <Link to="/" className="btn outline auth-back">
            Voltar para Home
          </Link>
        </div>
      </section>
    </main>
  );
}
