import { useCompanies } from "../hooks/useCompanies";
import { useWorkspaceContext } from "../WorkspaceContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { Pagination } from "../components/Pagination";
import { extractId } from "../formatter";
import type { ListItem } from "../types";

export function CompaniesSection() {
  const {
    pagedCollection,
    totalPages,
    companyForm,
    setCompanyForm,
    isCompanyCreateModalOpen,
    setIsCompanyCreateModalOpen,
    isCompanyEditModalOpen,
    setIsCompanyEditModalOpen,
    isCompanyDeleteModalOpen,
    setIsCompanyDeleteModalOpen,
    onCreateCompanyModal,
    onUpdateCompanyModal,
    openCompanyEditModal,
    onDeleteCompany,
    deleteCompanyMut,
    createCompanyMut,
    updateCompanyMut,
    pendingDeleteCompanyId,
  } = useCompanies();
  const { page, setPage, search, setSearch } = useWorkspaceContext();

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Empresas</h2>
          <button
            type="button"
            className="btn solid"
            onClick={() => {
              setIsCompanyCreateModalOpen(true);
            }}
          >
            Adicionar
          </button>
        </div>

        <div className="crm-panel-head">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou ID"
          />
        </div>

        <div className="crm-table">
          {pagedCollection.map((item) => {
            const typed = item as ListItem;
            const id = extractId(typed);

            return (
              <article key={id || JSON.stringify(item)} className="crm-row">
                <div>
                  <strong>{typed.name || "Empresa sem nome"}</strong>
                  <p>{id || "ID nao informado"}</p>
                </div>
                <div className="crm-row-actions">
                  <button
                    type="button"
                    className="btn outline"
                    title="Editar"
                    onClick={() => openCompanyEditModal(typed)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      if (!id) return;
                      setIsCompanyDeleteModalOpen(true);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })}

          {pagedCollection.length === 0 && (
            <p>Nenhuma empresa encontrada para a busca informada.</p>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>

      {isCompanyCreateModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsCompanyCreateModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide company-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar empresa"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Nova Empresa</h2>
            <form
              className="crm-form-grid company-form"
              onSubmit={onCreateCompanyModal}
            >
              <section className="profile-section">
                <h3>Dados da empresa</h3>
                <div className="company-section-grid">
                  <div className="field">
                    <label htmlFor="company-name">Nome da empresa</label>
                    <input
                      id="company-name"
                      value={companyForm.name}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="company-email">Email</label>
                    <input
                      id="company-email"
                      type="email"
                      value={companyForm.email}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="email@empresa.com"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="company-contact">Contato</label>
                    <input
                      id="company-contact"
                      value={companyForm.contact}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          contact: event.target.value,
                        }))
                      }
                      placeholder="Telefone ou contato"
                    />
                  </div>
                </div>
              </section>

              <AddressFormFields
                values={{
                  addressStreet: companyForm.addressStreet,
                  addressNumber: companyForm.addressNumber,
                  addressDistrict: companyForm.addressDistrict,
                  addressCity: companyForm.addressCity,
                  addressState: companyForm.addressState,
                  addressZipCode: companyForm.addressZipCode,
                  addressComplement: companyForm.addressComplement,
                  addressCountry: companyForm.addressCountry,
                }}
                onChange={(key, value) =>
                  setCompanyForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsCompanyCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={createCompanyMut.isPending}
                >
                  {createCompanyMut.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isCompanyEditModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsCompanyEditModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide company-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar empresa"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Editar Empresa</h2>
            <form
              className="crm-form-grid company-form"
              onSubmit={onUpdateCompanyModal}
            >
              <section className="profile-section">
                <h3>Dados da empresa</h3>
                <div className="company-section-grid">
                  <div className="field">
                    <label htmlFor="company-edit-name">Nome da empresa</label>
                    <input
                      id="company-edit-name"
                      value={companyForm.name}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="company-edit-email">Email</label>
                    <input
                      id="company-edit-email"
                      type="email"
                      value={companyForm.email}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="email@empresa.com"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="company-edit-contact">Contato</label>
                    <input
                      id="company-edit-contact"
                      value={companyForm.contact}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          contact: event.target.value,
                        }))
                      }
                      placeholder="Telefone ou contato"
                    />
                  </div>
                </div>
              </section>

              <AddressFormFields
                values={{
                  addressStreet: companyForm.addressStreet,
                  addressNumber: companyForm.addressNumber,
                  addressDistrict: companyForm.addressDistrict,
                  addressCity: companyForm.addressCity,
                  addressState: companyForm.addressState,
                  addressZipCode: companyForm.addressZipCode,
                  addressComplement: companyForm.addressComplement,
                  addressCountry: companyForm.addressCountry,
                }}
                onChange={(key, value) =>
                  setCompanyForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsCompanyEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={updateCompanyMut.isPending}
                >
                  {updateCompanyMut.isPending
                    ? "Salvando..."
                    : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isCompanyDeleteModalOpen}
        title="Confirmar exclusao"
        message="Quer mesmo excluir esta empresa?"
        onConfirm={async () => {
          if (pendingDeleteCompanyId) {
            await onDeleteCompany(pendingDeleteCompanyId);
          }
          setIsCompanyDeleteModalOpen(false);
        }}
        onCancel={() => setIsCompanyDeleteModalOpen(false)}
        isLoading={deleteCompanyMut.isPending}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </>
  );
}
