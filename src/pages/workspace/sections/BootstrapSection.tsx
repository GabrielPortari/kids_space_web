import { useState } from "react";
import { useCompanies } from "../hooks/useCompanies";

export function BootstrapSection() {
  const { onBootstrapAdmin, bootstrapAdminMut } = useCompanies();
  const [bootstrapForm, setBootstrapForm] = useState({
    bootstrapKey: "",
    name: "",
    email: "",
    password: "",
  });

  return (
    <section className="crm-panel">
      <h2>Bootstrap Admin</h2>
      <form
        className="crm-form-grid bootstrap-form"
        onSubmit={async (event) => {
          event.preventDefault();
          await onBootstrapAdmin(bootstrapForm);
        }}
      >
        <div className="field">
          <label htmlFor="bootstrap-key">Chave de bootstrap</label>
          <input
            id="bootstrap-key"
            name="bootstrapKey"
            type="password"
            value={bootstrapForm.bootstrapKey}
            onChange={(event) =>
              setBootstrapForm((current) => ({
                ...current,
                bootstrapKey: event.target.value,
              }))
            }
            placeholder="Chave de bootstrap"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="bootstrap-name">Nome da empresa</label>
          <input
            id="bootstrap-name"
            name="name"
            value={bootstrapForm.name}
            onChange={(event) =>
              setBootstrapForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Nome da empresa"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="bootstrap-email">Email do admin</label>
          <input
            id="bootstrap-email"
            name="email"
            type="email"
            value={bootstrapForm.email}
            onChange={(event) =>
              setBootstrapForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="admin@empresa.com"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="bootstrap-password">Senha do admin</label>
          <input
            id="bootstrap-password"
            name="password"
            type="password"
            value={bootstrapForm.password}
            onChange={(event) =>
              setBootstrapForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder="Senha do admin"
            required
          />
        </div>

        <div className="crm-modal-actions">
          <button
            type="submit"
            className="btn solid"
            disabled={bootstrapAdminMut.isPending}
          >
            {bootstrapAdminMut.isPending ? "Processando..." : "Criar admin"}
          </button>
        </div>
      </form>
    </section>
  );
}
