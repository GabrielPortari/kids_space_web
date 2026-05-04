import { useCollaborators } from "../hooks/useCollaborators";
import { useWorkspaceContext } from "../WorkspaceContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { Pagination } from "../components/Pagination";
import {
  extractId,
  maskByFieldKey,
  maskPhone,
  normalizeDigits,
} from "../formatter";
import type { ListItem } from "../types";

export function CollaboratorsSection() {
  const {
    pagedCollection,
    totalPages,
    isCollaboratorCreateModalOpen,
    setIsCollaboratorCreateModalOpen,
    isCollaboratorViewModalOpen,
    setIsCollaboratorViewModalOpen,
    isCollaboratorEditModalOpen,
    setIsCollaboratorEditModalOpen,
    isCollaboratorDeleteModalOpen,
    setIsCollaboratorDeleteModalOpen,
    collaboratorForm,
    setCollaboratorForm,
    viewingCollaboratorId,
    pendingDeleteCollaboratorId,
    onCreateCollaboratorModal,
    onUpdateCollaboratorModal,
    openCollaboratorViewModal,
    openCollaboratorEditModal,
    onDeleteCollaborator,
    deleteCollaboratorMut,
    createCollaboratorMut,
    updateCollaboratorMut,
  } = useCollaborators();
  const { page, setPage, search, setSearch } = useWorkspaceContext();

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Colaboradores</h2>
          <button
            type="button"
            className="btn solid"
            onClick={() => {
              setIsCollaboratorCreateModalOpen(true);
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
            placeholder="Buscar por nome ou email"
          />
        </div>

        <div className="crm-table">
          {pagedCollection.map((item) => {
            const typed = item as ListItem;
            const id = extractId(typed);

            return (
              <article
                key={id || JSON.stringify(item)}
                className="crm-row"
                onClick={() => openCollaboratorViewModal(typed)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <strong>{typed.name || "Colaborador sem nome"}</strong>
                  <p>{typed.email || "Email nao informado"}</p>
                </div>
                <div className="crm-row-actions">
                  <button
                    type="button"
                    className="btn outline"
                    title="Editar"
                    onClick={(event) => {
                      event.stopPropagation();
                      openCollaboratorEditModal(typed);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!id) {
                        return;
                      }
                      setIsCollaboratorDeleteModalOpen(true);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })}

          {pagedCollection.length === 0 && (
            <p>Nenhum colaborador encontrado para a busca informada.</p>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>

      {isCollaboratorCreateModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsCollaboratorCreateModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide collaborator-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar colaborador"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Novo Colaborador</h2>
            <form
              className="crm-form-grid collaborator-form"
              onSubmit={onCreateCollaboratorModal}
            >
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="collaborator-section-grid">
                  <div className="field">
                    <label htmlFor="col-name">Nome</label>
                    <input
                      id="col-name"
                      value={collaboratorForm.name}
                      onChange={(event) =>
                        setCollaboratorForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="col-email">Email</label>
                    <input
                      id="col-email"
                      type="email"
                      value={collaboratorForm.email}
                      onChange={(event) =>
                        setCollaboratorForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="col-document">CPF/CNPJ</label>
                    <input
                      id="col-document"
                      value={maskByFieldKey(
                        "document",
                        collaboratorForm.document,
                      )}
                      onChange={(event) =>
                        setCollaboratorForm((current) => ({
                          ...current,
                          document: normalizeDigits(event.target.value).slice(
                            0,
                            14,
                          ),
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="col-contact">Contato</label>
                    <input
                      id="col-contact"
                      value={maskPhone(collaboratorForm.contact)}
                      onChange={(event) =>
                        setCollaboratorForm((current) => ({
                          ...current,
                          contact: normalizeDigits(event.target.value).slice(
                            0,
                            11,
                          ),
                        }))
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </section>

              <AddressFormFields
                values={{
                  addressStreet: collaboratorForm.addressStreet,
                  addressNumber: collaboratorForm.addressNumber,
                  addressDistrict: collaboratorForm.addressDistrict,
                  addressCity: collaboratorForm.addressCity,
                  addressState: collaboratorForm.addressState,
                  addressZipCode: collaboratorForm.addressZipCode,
                  addressComplement: collaboratorForm.addressComplement,
                  addressCountry: collaboratorForm.addressCountry,
                }}
                onChange={(key, value) =>
                  setCollaboratorForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsCollaboratorCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={createCollaboratorMut.isPending}
                >
                  {createCollaboratorMut.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isCollaboratorEditModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsCollaboratorEditModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide collaborator-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar colaborador"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Editar Colaborador</h2>
            <form
              className="crm-form-grid collaborator-form"
              onSubmit={onUpdateCollaboratorModal}
            >
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="collaborator-section-grid">
                  <div className="field">
                    <label htmlFor="col-edit-name">Nome</label>
                    <input
                      id="col-edit-name"
                      value={collaboratorForm.name}
                      onChange={(event) =>
                        setCollaboratorForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="col-edit-email">Email</label>
                    <input
                      id="col-edit-email"
                      type="email"
                      value={collaboratorForm.email}
                      onChange={(event) =>
                        setCollaboratorForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="col-edit-document">CPF/CNPJ</label>
                    <input
                      id="col-edit-document"
                      value={maskByFieldKey(
                        "document",
                        collaboratorForm.document,
                      )}
                      onChange={(event) =>
                        setCollaboratorForm((current) => ({
                          ...current,
                          document: normalizeDigits(event.target.value).slice(
                            0,
                            14,
                          ),
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="col-edit-contact">Contato</label>
                    <input
                      id="col-edit-contact"
                      value={maskPhone(collaboratorForm.contact)}
                      onChange={(event) =>
                        setCollaboratorForm((current) => ({
                          ...current,
                          contact: normalizeDigits(event.target.value).slice(
                            0,
                            11,
                          ),
                        }))
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </section>

              <AddressFormFields
                values={{
                  addressStreet: collaboratorForm.addressStreet,
                  addressNumber: collaboratorForm.addressNumber,
                  addressDistrict: collaboratorForm.addressDistrict,
                  addressCity: collaboratorForm.addressCity,
                  addressState: collaboratorForm.addressState,
                  addressZipCode: collaboratorForm.addressZipCode,
                  addressComplement: collaboratorForm.addressComplement,
                  addressCountry: collaboratorForm.addressCountry,
                }}
                onChange={(key, value) =>
                  setCollaboratorForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsCollaboratorEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={updateCollaboratorMut.isPending}
                >
                  {updateCollaboratorMut.isPending
                    ? "Salvando..."
                    : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isCollaboratorViewModalOpen && viewingCollaboratorId && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsCollaboratorViewModalOpen(false)}
        >
          <section
            className="crm-modal collaborator-view-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Visualizar colaborador"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Detalhes do Colaborador</h2>
            <div className="collaborator-view-content">
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="profile-grid">
                  <article className="profile-card">
                    <span>Nome</span>
                    <strong>{collaboratorForm.name || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Email</span>
                    <strong>{collaboratorForm.email || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>CPF/CNPJ</span>
                    <strong>
                      {maskByFieldKey("document", collaboratorForm.document) ||
                        "-"}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Contato</span>
                    <strong>
                      {maskPhone(collaboratorForm.contact) || "-"}
                    </strong>
                  </article>
                </div>
              </section>

              <section className="profile-section">
                <h3>Endereco</h3>
                <div className="profile-grid">
                  <article className="profile-card">
                    <span>Rua</span>
                    <strong>{collaboratorForm.addressStreet || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Numero</span>
                    <strong>{collaboratorForm.addressNumber || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Bairro</span>
                    <strong>{collaboratorForm.addressDistrict || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Cidade</span>
                    <strong>{collaboratorForm.addressCity || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Estado</span>
                    <strong>{collaboratorForm.addressState || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>CEP</span>
                    <strong>{collaboratorForm.addressZipCode || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Complemento</span>
                    <strong>{collaboratorForm.addressComplement || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Pais</span>
                    <strong>{collaboratorForm.addressCountry || "-"}</strong>
                  </article>
                </div>
              </section>
            </div>

            <div className="crm-modal-actions">
              <button
                type="button"
                className="btn outline"
                onClick={() => setIsCollaboratorViewModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isCollaboratorDeleteModalOpen}
        title="Confirmar exclusao"
        message="Quer mesmo excluir este colaborador?"
        onConfirm={async () => {
          if (pendingDeleteCollaboratorId) {
            await onDeleteCollaborator();
          }
          setIsCollaboratorDeleteModalOpen(false);
        }}
        onCancel={() => setIsCollaboratorDeleteModalOpen(false)}
        isLoading={deleteCollaboratorMut.isPending}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </>
  );
}
