import { useCollaborators } from "../hooks/useCollaborators";
import { useWorkspaceContext } from "../WorkspaceContext";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { Pagination } from "../components/Pagination";
import { SkeletonBlock } from "../components/WorkspaceSkeleton";
import {
  EditIcon,
  GroupIcon,
  ModalIconWrap,
  PlusIcon,
  RecordAvatar,
  RefreshIcon,
} from "../components/WorkspaceVisuals";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import {
  extractId,
  maskByFieldKey,
  maskPhone,
  maskZipCode,
  normalizeDigits,
} from "../formatter";
import type { ListItem } from "../types";

export function CollaboratorsSection() {
  const queryClient = useQueryClient();
  const {
    pagedCollection,
    totalPages,
    collaboratorsQuery,
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
    openCollaboratorCreateModal,
  } = useCollaborators();
  const { page, setPage, search, setSearch } = useWorkspaceContext();
  const isLoading = collaboratorsQuery.isLoading;
  const handleRefresh = () => {
    void queryClient.resetQueries({ queryKey: ["collaborators"] });
  };

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Colaboradores</h2>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn solid crm-add-button"
              onClick={openCollaboratorCreateModal}
            >
              <PlusIcon />
              Adicionar novo
            </button>
            <button
              type="button"
              className="btn outline crm-icon-btn"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Atualizar colaboradores"
              title="Atualizar colaboradores"
            >
              <RefreshIcon />
            </button>
          </div>
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
          {isLoading && pagedCollection.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`collaborator-skeleton-${index}`}
                className="crm-row crm-row-skeleton"
              >
                <div className="workspace-skeleton-stack">
                  <SkeletonBlock width="44%" height="1rem" />
                  <SkeletonBlock width="66%" height="0.8rem" />
                </div>
                <div className="crm-row-actions">
                  <SkeletonBlock width="2.4rem" height="2.4rem" />
                  <SkeletonBlock width="5rem" height="2.4rem" />
                </div>
              </article>
            ))
          ) : (
            <>
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
                    <div className="record-row-main">
                      <RecordAvatar name={typed.name || "Colaborador"} />
                      <div className="record-row-copy">
                        <strong>{typed.name || "Colaborador sem nome"}</strong>
                        <p>{typed.email || "Email nao informado"}</p>
                      </div>
                    </div>
                    <div className="crm-row-actions">
                      <button
                        type="button"
                        className="crm-icon-action"
                        title="Editar"
                        onClick={(event) => {
                          event.stopPropagation();
                          openCollaboratorEditModal(typed);
                        }}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="crm-remove-action"
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
            </>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>

      {isCollaboratorCreateModalOpen &&
        createPortal(
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => setIsCollaboratorCreateModalOpen(false)}
          >
            <section
              className="crm-modal crm-modal-wide profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Adicionar colaborador"
              onClick={(event) => event.stopPropagation()}
            >
            <div className="profile-modal-header">
              <div className="profile-modal-header-left">
                <ModalIconWrap>
                  <GroupIcon />
                </ModalIconWrap>
                <div>
                  <p className="profile-modal-title">Novo Colaborador</p>
                  <p className="profile-modal-subtitle">
                    Crie um novo colaborador
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Fechar"
                onClick={() => setIsCollaboratorCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="profile-form" onSubmit={onCreateCollaboratorModal}>
              <div className="profile-form-body">
                <div className="profile-form-section">
                  <div className="profile-form-section-header">
                    <span className="profile-form-section-label">
                      Dados pessoais
                    </span>
                    <div className="profile-form-section-line" />
                  </div>

                  <div className="profile-form-fields-grid profile-form-personal-grid">
                    <div className="field field-span-12">
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

                    <div className="field field-span-4">
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

                    <div className="field field-span-4">
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

                    <div className="field field-span-4">
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
                </div>

                <div className="profile-form-section">
                  <div className="profile-form-section-header">
                    <span className="profile-form-section-label">Endereço</span>
                    <div className="profile-form-section-line" />
                  </div>

                  <div className="profile-form-address-stack">
                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="col-address-street">Rua</label>
                        <input
                          id="col-address-street"
                          value={collaboratorForm.addressStreet}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressStreet: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="col-address-number">Número</label>
                        <input
                          id="col-address-number"
                          value={collaboratorForm.addressNumber}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressNumber: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="col-address-complement">
                          Complemento
                        </label>
                        <input
                          id="col-address-complement"
                          value={collaboratorForm.addressComplement}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressComplement: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="col-address-district">Bairro</label>
                        <input
                          id="col-address-district"
                          value={collaboratorForm.addressDistrict}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressDistrict: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="col-address-city">Cidade</label>
                        <input
                          id="col-address-city"
                          value={collaboratorForm.addressCity}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressCity: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="col-address-state">Estado</label>
                        <input
                          id="col-address-state"
                          value={collaboratorForm.addressState}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressState: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="col-address-zipcode">CEP</label>
                        <input
                          id="col-address-zipcode"
                          value={maskZipCode(
                            collaboratorForm.addressZipCode || "",
                          )}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressZipCode: normalizeDigits(
                                event.target.value,
                              ).slice(0, 8),
                            }))
                          }
                          placeholder="00000-000"
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="col-address-country">País</label>
                        <input
                          id="col-address-country"
                          value={collaboratorForm.addressCountry}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressCountry: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-modal-footer">
                <p className="profile-modal-hint">
                  🔒 Campos acinzentados são somente leitura
                </p>
                <div className="profile-modal-footer-actions">
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
              </div>
            </form>
          </section>
          </div>,
          document.body,
        )}

      {isCollaboratorEditModalOpen &&
        createPortal(
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => setIsCollaboratorEditModalOpen(false)}
          >
            <section
              className="crm-modal crm-modal-wide profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Editar colaborador"
              onClick={(event) => event.stopPropagation()}
            >
            <div className="profile-modal-header">
              <div className="profile-modal-header-left">
                <ModalIconWrap>
                  <GroupIcon />
                </ModalIconWrap>
                <div>
                  <p className="profile-modal-title">Editar Colaborador</p>
                  <p className="profile-modal-subtitle">
                    Atualize o cadastro do colaborador
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Fechar"
                onClick={() => setIsCollaboratorEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="profile-form" onSubmit={onUpdateCollaboratorModal}>
              <div className="profile-form-body">
                <div className="profile-form-section">
                  <div className="profile-form-section-header">
                    <span className="profile-form-section-label">
                      Dados pessoais
                    </span>
                    <div className="profile-form-section-line" />
                  </div>

                  <div className="profile-form-fields-grid profile-form-personal-grid">
                    <div className="field field-span-12">
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

                    <div className="field field-span-4">
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

                    <div className="field field-span-4">
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

                    <div className="field field-span-4">
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
                </div>

                <div className="profile-form-section">
                  <div className="profile-form-section-header">
                    <span className="profile-form-section-label">Endereço</span>
                    <div className="profile-form-section-line" />
                  </div>

                  <div className="profile-form-address-stack">
                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="col-edit-address-street">Rua</label>
                        <input
                          id="col-edit-address-street"
                          value={collaboratorForm.addressStreet}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressStreet: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="col-edit-address-number">Número</label>
                        <input
                          id="col-edit-address-number"
                          value={collaboratorForm.addressNumber}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressNumber: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="col-edit-address-complement">
                          Complemento
                        </label>
                        <input
                          id="col-edit-address-complement"
                          value={collaboratorForm.addressComplement}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressComplement: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="col-edit-address-district">
                          Bairro
                        </label>
                        <input
                          id="col-edit-address-district"
                          value={collaboratorForm.addressDistrict}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressDistrict: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="col-edit-address-city">Cidade</label>
                        <input
                          id="col-edit-address-city"
                          value={collaboratorForm.addressCity}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressCity: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="col-edit-address-state">Estado</label>
                        <input
                          id="col-edit-address-state"
                          value={collaboratorForm.addressState}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressState: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="col-edit-address-zipcode">CEP</label>
                        <input
                          id="col-edit-address-zipcode"
                          value={maskZipCode(
                            collaboratorForm.addressZipCode || "",
                          )}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressZipCode: normalizeDigits(
                                event.target.value,
                              ).slice(0, 8),
                            }))
                          }
                          placeholder="00000-000"
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="col-edit-address-country">País</label>
                        <input
                          id="col-edit-address-country"
                          value={collaboratorForm.addressCountry}
                          onChange={(event) =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              addressCountry: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-modal-footer">
                <p className="profile-modal-hint">
                  🔒 Campos acinzentados são somente leitura
                </p>
                <div className="profile-modal-footer-actions">
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
              </div>
            </form>
          </section>
          </div>,
          document.body,
        )}

      {isCollaboratorViewModalOpen && viewingCollaboratorId &&
        createPortal(
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => setIsCollaboratorViewModalOpen(false)}
          >
            <section
              className="crm-modal crm-modal-wide profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Visualizar colaborador"
              onClick={(event) => event.stopPropagation()}
            >
            <div className="profile-modal-header">
              <div className="profile-modal-header-left">
                <ModalIconWrap>
                  <GroupIcon />
                </ModalIconWrap>
                <div>
                  <p className="profile-modal-title">Detalhes do Colaborador</p>
                  <p className="profile-modal-subtitle">
                    Visualize as informações do colaborador
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Fechar"
                onClick={() => setIsCollaboratorViewModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="profile-form">
              <div className="profile-form-body">
                <section className="profile-section">
                  <h3>Dados pessoais</h3>
                  <div className="profile-form-fields-grid profile-form-personal-grid">
                    <div className="field field-span-12">
                      <label htmlFor="collaborator-view-name">Nome</label>
                      <input
                        id="collaborator-view-name"
                        value={collaboratorForm.name}
                        disabled
                        className="field-readonly"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="collaborator-view-email">Email</label>
                      <input
                        id="collaborator-view-email"
                        type="email"
                        value={collaboratorForm.email}
                        disabled
                        className="field-readonly"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="collaborator-view-document">
                        CPF/CNPJ
                      </label>
                      <input
                        id="collaborator-view-document"
                        value={maskByFieldKey(
                          "document",
                          collaboratorForm.document,
                        )}
                        disabled
                        className="field-readonly"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="collaborator-view-contact">Contato</label>
                      <input
                        id="collaborator-view-contact"
                        value={maskPhone(collaboratorForm.contact)}
                        disabled
                        className="field-readonly"
                      />
                    </div>
                  </div>
                </section>

                <section className="profile-section">
                  <h3>Endereço</h3>
                  <div className="profile-form-address-stack">
                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="collaborator-view-address-street">
                          Rua
                        </label>
                        <input
                          id="collaborator-view-address-street"
                          value={collaboratorForm.addressStreet}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="collaborator-view-address-number">
                          Número
                        </label>
                        <input
                          id="collaborator-view-address-number"
                          value={collaboratorForm.addressNumber}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="collaborator-view-address-complement">
                          Complemento
                        </label>
                        <input
                          id="collaborator-view-address-complement"
                          value={collaboratorForm.addressComplement}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="collaborator-view-address-district">
                          Bairro
                        </label>
                        <input
                          id="collaborator-view-address-district"
                          value={collaboratorForm.addressDistrict}
                          disabled
                          className="field-readonly"
                        />
                      </div>
                    </div>

                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="collaborator-view-address-city">
                          Cidade
                        </label>
                        <input
                          id="collaborator-view-address-city"
                          value={collaboratorForm.addressCity}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="collaborator-view-address-state">
                          Estado
                        </label>
                        <input
                          id="collaborator-view-address-state"
                          value={collaboratorForm.addressState}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="collaborator-view-address-zipcode">
                          CEP
                        </label>
                        <input
                          id="collaborator-view-address-zipcode"
                          value={maskZipCode(
                            collaboratorForm.addressZipCode || "",
                          )}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="collaborator-view-address-country">
                          País
                        </label>
                        <input
                          id="collaborator-view-address-country"
                          value={collaboratorForm.addressCountry}
                          disabled
                          className="field-readonly"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="profile-modal-footer">
              <p className="profile-modal-hint">
                🔒 Campos acinzentados são somente leitura
              </p>
              <div className="profile-modal-footer-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsCollaboratorViewModalOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </section>
          </div>,
          document.body,
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
