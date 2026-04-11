import { Link } from "react-router-dom";

export function CompanySignupPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Cadastro de company</h1>
        <p>
          Tela inicial de cadastro da empresa. A integracao com API sera
          implementada nas proximas etapas.
        </p>
        <form className="stack" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="company-name">Nome da empresa</label>
          <input id="company-name" placeholder="Espaco Kids Alegria" />

          <label htmlFor="company-email">Email de acesso</label>
          <input
            id="company-email"
            type="email"
            placeholder="contato@empresa.com"
          />

          <label htmlFor="company-password">Senha</label>
          <input id="company-password" type="password" placeholder="******" />

          <button type="submit" className="btn solid">
            Criar conta company
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
