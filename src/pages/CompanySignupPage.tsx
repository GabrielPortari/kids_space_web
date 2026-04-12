import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authRolePaths } from "../auth/authRoles";
import { useAuth } from "../auth/useAuth";

export function CompanySignupPage() {
  const navigate = useNavigate();
  const { signupCompany, session, status } = useAuth();
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

    const payload = {
      name: String(formData.get("name") || "").trim(),
      legalName: String(formData.get("legalName") || "").trim(),
      cnpj: String(formData.get("cnpj") || "").replace(/\D/g, ""),
      address: {
        street: String(formData.get("street") || "").trim(),
        number: String(formData.get("number") || "").trim(),
        district: String(formData.get("district") || "").trim(),
        city: String(formData.get("city") || "").trim(),
        state: String(formData.get("state") || "").trim(),
        zipCode: String(formData.get("zipCode") || "").replace(/\D/g, ""),
        complement:
          String(formData.get("complement") || "").trim() || undefined,
      },
      contact: String(formData.get("contact") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    try {
      await signupCompany(payload);
      navigate("/app", { replace: true });
    } catch {
      setError(
        "Falha ao cadastrar company. Revise os dados e tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled = isSubmitting || status === "loading";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Cadastro de company</h1>
        <p>
          Crie a conta da sua empresa para acessar o painel com autenticacao JWT
          e redirecionamento automatico por role.
        </p>
        <form className="stack" onSubmit={handleSubmit}>
          <label htmlFor="company-name">Nome fantasia</label>
          <input
            id="company-name"
            name="name"
            placeholder="Espaco Kids Alegria"
            required
            disabled={disabled}
          />

          <label htmlFor="company-legal-name">Razao social</label>
          <input
            id="company-legal-name"
            name="legalName"
            placeholder="Espaco Kids Alegria LTDA"
            required
            disabled={disabled}
          />

          <label htmlFor="company-cnpj">CNPJ</label>
          <input
            id="company-cnpj"
            name="cnpj"
            placeholder="00.000.000/0000-00"
            required
            disabled={disabled}
          />

          <label htmlFor="company-contact">Telefone</label>
          <input
            id="company-contact"
            name="contact"
            placeholder="(11) 98888-7777"
            required
            disabled={disabled}
          />

          <label htmlFor="address-street">Rua</label>
          <input
            id="address-street"
            name="street"
            placeholder="Rua das Flores"
            required
            disabled={disabled}
          />

          <label htmlFor="address-number">Numero</label>
          <input
            id="address-number"
            name="number"
            placeholder="120"
            required
            disabled={disabled}
          />

          <label htmlFor="address-district">Bairro</label>
          <input
            id="address-district"
            name="district"
            placeholder="Centro"
            required
            disabled={disabled}
          />

          <label htmlFor="address-city">Cidade</label>
          <input
            id="address-city"
            name="city"
            placeholder="Sao Paulo"
            required
            disabled={disabled}
          />

          <label htmlFor="address-state">Estado (UF)</label>
          <input
            id="address-state"
            name="state"
            placeholder="SP"
            maxLength={2}
            required
            disabled={disabled}
          />

          <label htmlFor="address-zip">CEP</label>
          <input
            id="address-zip"
            name="zipCode"
            placeholder="00000-000"
            required
            disabled={disabled}
          />

          <label htmlFor="address-complement">Complemento (opcional)</label>
          <input
            id="address-complement"
            name="complement"
            placeholder="Sala 4"
            disabled={disabled}
          />

          <label htmlFor="company-email">Email de acesso</label>
          <input
            id="company-email"
            name="email"
            type="email"
            placeholder="contato@empresa.com"
            required
            disabled={disabled}
          />

          <label htmlFor="company-password">Senha</label>
          <input
            id="company-password"
            name="password"
            type="password"
            placeholder="******"
            minLength={6}
            required
            disabled={disabled}
          />

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="btn solid" disabled={disabled}>
            {disabled ? "Criando conta..." : "Criar conta company"}
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
