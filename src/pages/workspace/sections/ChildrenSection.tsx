import { useChildren } from "../hooks/useChildren";
import { useWorkspaceContext } from "../WorkspaceContext";
import { ChildHealthInfoFields } from "../components/ChildHealthInfoFields";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { EntitySearchList } from "../components/EntitySearchList";
import { Pagination } from "../components/Pagination";
import { SkeletonBlock } from "../components/WorkspaceSkeleton";
import {
  extractId,
  maskZipCode,
  normalizeDigits,
  toParentFormState,
} from "../formatter";
import type { ListItem } from "../types";
import { useQueryClient } from "@tanstack/react-query";

export function ChildrenSection() {
  const queryClient = useQueryClient();
  const { page, setPage, search, setSearch } = useWorkspaceContext();

  const childrenHook = useChildren();
  const isLoading =
    childrenHook.childrenQuery.isLoading ||
    childrenHook.parentsQuery.isLoading ||
    childrenHook.activeAttendancesQuery.isLoading;
  const handleRefresh = () => {
    void queryClient.resetQueries({ queryKey: ["children"] });
    void queryClient.resetQueries({ queryKey: ["parents"] });
  };

  const {
    pagedCollection,
    totalPages,
    onCreateChildModal,
    openChildCreateModal,
    onUpdateChildModal,
    openChildViewModal,
    openChildEditModal,
    onDeleteChild,
    openChildAssignParentsModal,
    onAssignParentsToChild,
    toggleAssignChildParentSelection,
    deleteChildMut,
    createChildMut,
    updateChildMut,
    assignParentsMut,
    childForm,
    setChildForm,
    childCreateParentSearch,
    setChildCreateParentSearch,
    childCreateParentOptions,
    isChildCreateModalOpen,
    setIsChildCreateModalOpen,
    isChildViewModalOpen,
    setIsChildViewModalOpen,
    isChildEditModalOpen,
    setIsChildEditModalOpen,
    isChildDeleteModalOpen,
    setIsChildDeleteModalOpen,
    isChildAssignParentsModalOpen,
    setIsChildAssignParentsModalOpen,
    childParentsSearch,
    setChildParentsSearch,
    assigningChildParentIds,
    assigningChildParentOptions,
    pendingDeleteChildId,
    parents: childParents,
    activeChildIds,
  } = childrenHook;

  function applyInheritedParentAddress(parentId: string) {
    const selectedParent = childParents.find(
      (item: ListItem) => extractId(item) === parentId,
    );

    if (!selectedParent) {
      return;
    }

    const parentFormState = toParentFormState(selectedParent);

    setChildForm((current) => ({
      ...current,
      addressStreet: parentFormState.addressStreet,
      addressNumber: parentFormState.addressNumber,
      addressDistrict: parentFormState.addressDistrict,
      addressCity: parentFormState.addressCity,
      addressState: parentFormState.addressState,
      addressZipCode: parentFormState.addressZipCode,
      addressComplement: parentFormState.addressComplement,
      addressCountry: parentFormState.addressCountry,
    }));
  }

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Criancas</h2>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn solid"
              onClick={openChildCreateModal}
            >
              Adicionar novo
            </button>
            <button
              type="button"
              className="btn outline crm-icon-btn"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Atualizar crianças"
              title="Atualizar crianças"
            >
              ↻
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
            placeholder="Buscar por nome ou ID"
          />
        </div>

        <div className="crm-table">
          {isLoading && pagedCollection.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`child-skeleton-${index}`}
                className="crm-row crm-row-skeleton"
              >
                <div className="workspace-skeleton-stack">
                  <SkeletonBlock width="45%" height="1rem" />
                  <SkeletonBlock width="64%" height="0.8rem" />
                </div>
                <div className="crm-row-actions">
                  <SkeletonBlock width="2.4rem" height="2.4rem" />
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
                    onClick={() => openChildViewModal(typed)}
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <div className="child-row-title">
                        <strong>{typed.name || "Crianca sem nome"}</strong>
                        {id && activeChildIds.has(id) && (
                          <span
                            className="child-status-dot"
                            title="Check-in ativo"
                            aria-label="Check-in ativo"
                          />
                        )}
                      </div>
                      <p>{typed.email || "Email nao informado"}</p>
                    </div>
                    <div className="crm-row-actions">
                      <button
                        type="button"
                        className="btn outline"
                        title="Vincular responsaveis"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!id) return;
                          openChildAssignParentsModal(id);
                        }}
                      >
                        🔗
                      </button>
                      <button
                        type="button"
                        className="btn outline"
                        title="Editar"
                        onClick={(event) => {
                          event.stopPropagation();
                          openChildEditModal(typed);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!id) return;
                          childrenHook.setPendingDeleteChildId(id);
                          setIsChildDeleteModalOpen(true);
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </article>
                );
              })}

              {pagedCollection.length === 0 && (
                <p>Nenhuma crianca encontrada para a busca informada.</p>
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

      {isChildViewModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsChildViewModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Visualizar crianca"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div className="profile-modal-header-left">
                <div className="profile-modal-avatar">
                  <span>👶</span>
                </div>
                <div>
                  <p className="profile-modal-title">Detalhes da Criança</p>
                  <p className="profile-modal-subtitle">
                    Visualize as informações da criança
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Fechar"
                onClick={() => setIsChildViewModalOpen(false)}
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
                      <label htmlFor="child-view-name">Nome</label>
                      <input
                        id="child-view-name"
                        value={childForm.name}
                        disabled
                        className="field-readonly"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="child-view-email">Email</label>
                      <input
                        id="child-view-email"
                        type="email"
                        value={childForm.email}
                        disabled
                        className="field-readonly"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="child-view-document">CPF/ID</label>
                      <input
                        id="child-view-document"
                        value={childForm.document}
                        disabled
                        className="field-readonly"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="child-view-contact">Contato</label>
                      <input
                        id="child-view-contact"
                        value={childForm.contact}
                        disabled
                        className="field-readonly"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="child-view-birthDate">
                        Data de nascimento
                      </label>
                      <input
                        id="child-view-birthDate"
                        type="date"
                        value={childForm.birthDate || ""}
                        disabled
                        className="field-readonly"
                      />
                    </div>
                  </div>
                </section>

                <section className="profile-section">
                  <h3>Responsável</h3>
                  <div className="child-section-grid">
                    <EntitySearchList
                      label="Responsável para vínculo direto"
                      searchValue={childCreateParentSearch}
                      onSearchChange={() => undefined}
                      options={childCreateParentOptions}
                      selectedIds={childForm.parents}
                      onToggle={() => undefined}
                      isLoading={childrenHook.parentsQuery.isLoading}
                      placeholder="Buscar por nome ou ID"
                      mode="radio"
                      disabled
                    />

                    <div className="field child-inherit-address-field">
                      <label className="child-inherit-address-toggle">
                        <input
                          type="checkbox"
                          checked={childForm.inheritParentAddress}
                          disabled
                        />
                        <span>Herdar endereco do responsavel selecionado</span>
                      </label>
                    </div>
                  </div>
                </section>

                <section className="profile-section">
                  <h3>Endereço</h3>
                  <div className="profile-form-address-stack">
                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="child-view-address-street">Rua</label>
                        <input
                          id="child-view-address-street"
                          value={childForm.addressStreet}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="child-view-address-number">
                          Número
                        </label>
                        <input
                          id="child-view-address-number"
                          value={childForm.addressNumber}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="child-view-address-complement">
                          Complemento
                        </label>
                        <input
                          id="child-view-address-complement"
                          value={childForm.addressComplement}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="child-view-address-district">
                          Bairro
                        </label>
                        <input
                          id="child-view-address-district"
                          value={childForm.addressDistrict}
                          disabled
                          className="field-readonly"
                        />
                      </div>
                    </div>

                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="child-view-address-city">Cidade</label>
                        <input
                          id="child-view-address-city"
                          value={childForm.addressCity}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="child-view-address-state">Estado</label>
                        <input
                          id="child-view-address-state"
                          value={childForm.addressState}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="child-view-address-zipcode">CEP</label>
                        <input
                          id="child-view-address-zipcode"
                          value={maskZipCode(childForm.addressZipCode || "")}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="child-view-address-country">País</label>
                        <input
                          id="child-view-address-country"
                          value={childForm.addressCountry}
                          disabled
                          className="field-readonly"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="profile-section">
                  <h3>Saude</h3>
                  <ChildHealthInfoFields
                    value={childForm.healthInfo}
                    onChange={() => undefined}
                    onAddMedication={() => undefined}
                    onRemoveMedication={() => undefined}
                    disabled
                  />
                </section>
              </div>

              <div className="profile-modal-footer">
                <p className="profile-modal-hint">
                  🔒 Campos acinzentados são somente leitura
                </p>
                <div className="profile-modal-footer-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => setIsChildViewModalOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {isChildCreateModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsChildCreateModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar crianca"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div className="profile-modal-header-left">
                <div className="profile-modal-avatar">
                  <span>👶</span>
                </div>
                <div>
                  <p className="profile-modal-title">Nova Criança</p>
                  <p className="profile-modal-subtitle">
                    Crie um novo cadastro de criança
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Fechar"
                onClick={() => setIsChildCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="profile-form" onSubmit={onCreateChildModal}>
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
                      <label htmlFor="child-name">Nome</label>
                      <input
                        id="child-name"
                        value={childForm.name}
                        onChange={(event) =>
                          setChildForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Nome completo"
                        required
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="child-email">Email</label>
                      <input
                        id="child-email"
                        type="email"
                        value={childForm.email}
                        onChange={(event) =>
                          setChildForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="child-document">CPF/ID</label>
                      <input
                        id="child-document"
                        value={childForm.document}
                        onChange={(event) =>
                          setChildForm((current) => ({
                            ...current,
                            document: event.target.value,
                          }))
                        }
                        placeholder="ID ou CPF"
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-form-section">
                  <div className="profile-form-section-header">
                    <span className="profile-form-section-label">
                      Responsável
                    </span>
                    <div className="profile-form-section-line" />
                  </div>
                  <div className="child-section-grid">
                    <EntitySearchList
                      label="Responsável para vínculo direto"
                      searchValue={childCreateParentSearch}
                      onSearchChange={setChildCreateParentSearch}
                      options={childCreateParentOptions}
                      selectedIds={childForm.parents}
                      onToggle={(parentId) =>
                        setChildForm((current) => {
                          const nextParentId =
                            current.parents === parentId ? "" : parentId;

                          if (
                            current.inheritParentAddress &&
                            nextParentId &&
                            nextParentId !== current.parents
                          ) {
                            applyInheritedParentAddress(nextParentId);
                          }

                          return {
                            ...current,
                            parents: nextParentId,
                          };
                        })
                      }
                      isLoading={childrenHook.parentsQuery.isLoading}
                      placeholder="Buscar por nome ou ID"
                      mode="radio"
                    />

                    <div className="field child-inherit-address-field">
                      <label className="child-inherit-address-toggle">
                        <input
                          type="checkbox"
                          checked={childForm.inheritParentAddress}
                          onChange={(event) =>
                            setChildForm((current) => {
                              const nextState = {
                                ...current,
                                inheritParentAddress: event.target.checked,
                              };

                              if (event.target.checked && current.parents) {
                                const selectedParent = childParents.find(
                                  (item: ListItem) =>
                                    extractId(item) === current.parents,
                                );

                                if (selectedParent) {
                                  const parentFormState =
                                    toParentFormState(selectedParent);

                                  return {
                                    ...nextState,
                                    addressStreet:
                                      parentFormState.addressStreet,
                                    addressNumber:
                                      parentFormState.addressNumber,
                                    addressDistrict:
                                      parentFormState.addressDistrict,
                                    addressCity: parentFormState.addressCity,
                                    addressState: parentFormState.addressState,
                                    addressZipCode:
                                      parentFormState.addressZipCode,
                                    addressComplement:
                                      parentFormState.addressComplement,
                                    addressCountry:
                                      parentFormState.addressCountry,
                                  };
                                }
                              }

                              return nextState;
                            })
                          }
                        />
                        <span>Herdar endereco do responsavel selecionado</span>
                      </label>
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
                        <label htmlFor="child-address-street">Rua</label>
                        <input
                          id="child-address-street"
                          value={childForm.addressStreet}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressStreet: event.target.value,
                            }))
                          }
                          disabled={childForm.inheritParentAddress}
                          className={
                            childForm.inheritParentAddress
                              ? "field-readonly"
                              : ""
                          }
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="child-address-number">Número</label>
                        <input
                          id="child-address-number"
                          value={childForm.addressNumber}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressNumber: event.target.value,
                            }))
                          }
                          disabled={childForm.inheritParentAddress}
                          className={
                            childForm.inheritParentAddress
                              ? "field-readonly"
                              : ""
                          }
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="child-address-complement">
                          Complemento
                        </label>
                        <input
                          id="child-address-complement"
                          value={childForm.addressComplement}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressComplement: event.target.value,
                            }))
                          }
                          disabled={childForm.inheritParentAddress}
                          className={
                            childForm.inheritParentAddress
                              ? "field-readonly"
                              : ""
                          }
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="child-address-district">Bairro</label>
                        <input
                          id="child-address-district"
                          value={childForm.addressDistrict}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressDistrict: event.target.value,
                            }))
                          }
                          disabled={childForm.inheritParentAddress}
                          className={
                            childForm.inheritParentAddress
                              ? "field-readonly"
                              : ""
                          }
                        />
                      </div>
                    </div>

                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="child-address-city">Cidade</label>
                        <input
                          id="child-address-city"
                          value={childForm.addressCity}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressCity: event.target.value,
                            }))
                          }
                          disabled={childForm.inheritParentAddress}
                          className={
                            childForm.inheritParentAddress
                              ? "field-readonly"
                              : ""
                          }
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="child-address-state">Estado</label>
                        <input
                          id="child-address-state"
                          value={childForm.addressState}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressState: event.target.value,
                            }))
                          }
                          disabled={childForm.inheritParentAddress}
                          className={
                            childForm.inheritParentAddress
                              ? "field-readonly"
                              : ""
                          }
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="child-address-zipcode">CEP</label>
                        <input
                          id="child-address-zipcode"
                          value={maskZipCode(childForm.addressZipCode || "")}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressZipCode: normalizeDigits(
                                event.target.value,
                              ).slice(0, 8),
                            }))
                          }
                          placeholder="00000-000"
                          disabled={childForm.inheritParentAddress}
                          className={
                            childForm.inheritParentAddress
                              ? "field-readonly"
                              : ""
                          }
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="child-address-country">País</label>
                        <input
                          id="child-address-country"
                          value={childForm.addressCountry}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressCountry: event.target.value,
                            }))
                          }
                          disabled={childForm.inheritParentAddress}
                          className={
                            childForm.inheritParentAddress
                              ? "field-readonly"
                              : ""
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-form-section">
                  <div className="profile-form-section-header">
                    <span className="profile-form-section-label">Saude</span>
                    <div className="profile-form-section-line" />
                  </div>

                  <ChildHealthInfoFields
                    value={childForm.healthInfo}
                    onChange={(key, value) =>
                      setChildForm((current) => ({
                        ...current,
                        healthInfo: {
                          ...current.healthInfo,
                          [key]: value,
                        },
                      }))
                    }
                    onAddMedication={(medication) =>
                      setChildForm((current) => ({
                        ...current,
                        healthInfo: {
                          ...current.healthInfo,
                          medications: [
                            ...current.healthInfo.medications,
                            medication,
                          ],
                        },
                      }))
                    }
                    onRemoveMedication={(index) =>
                      setChildForm((current) => ({
                        ...current,
                        healthInfo: {
                          ...current.healthInfo,
                          medications: current.healthInfo.medications.filter(
                            (_medication, medicationIndex) =>
                              medicationIndex !== index,
                          ),
                        },
                      }))
                    }
                  />
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
                    onClick={() => setIsChildCreateModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn solid"
                    disabled={createChildMut.isPending}
                  >
                    {createChildMut.isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {isChildEditModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsChildEditModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar crianca"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div className="profile-modal-header-left">
                <div className="profile-modal-avatar">
                  <span>👶</span>
                </div>
                <div>
                  <p className="profile-modal-title">Editar Criança</p>
                  <p className="profile-modal-subtitle">
                    Atualize o cadastro da criança
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Fechar"
                onClick={() => setIsChildEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="profile-form" onSubmit={onUpdateChildModal}>
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
                      <label htmlFor="child-edit-name">Nome</label>
                      <input
                        id="child-edit-name"
                        value={childForm.name}
                        onChange={(event) =>
                          setChildForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Nome completo"
                        required
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="child-edit-email">Email</label>
                      <input
                        id="child-edit-email"
                        type="email"
                        value={childForm.email}
                        onChange={(event) =>
                          setChildForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="field field-span-6">
                      <label htmlFor="child-edit-document">CPF/ID</label>
                      <input
                        id="child-edit-document"
                        value={childForm.document}
                        onChange={(event) =>
                          setChildForm((current) => ({
                            ...current,
                            document: event.target.value,
                          }))
                        }
                        placeholder="ID ou CPF"
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
                        <label htmlFor="child-edit-address-street">Rua</label>
                        <input
                          id="child-edit-address-street"
                          value={childForm.addressStreet}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressStreet: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="child-edit-address-number">
                          Número
                        </label>
                        <input
                          id="child-edit-address-number"
                          value={childForm.addressNumber}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressNumber: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="child-edit-address-complement">
                          Complemento
                        </label>
                        <input
                          id="child-edit-address-complement"
                          value={childForm.addressComplement}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressComplement: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-3">
                        <label htmlFor="child-edit-address-district">
                          Bairro
                        </label>
                        <input
                          id="child-edit-address-district"
                          value={childForm.addressDistrict}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressDistrict: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="profile-form-fields-grid profile-form-address-grid">
                      <div className="field field-span-6">
                        <label htmlFor="child-edit-address-city">Cidade</label>
                        <input
                          id="child-edit-address-city"
                          value={childForm.addressCity}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressCity: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-1">
                        <label htmlFor="child-edit-address-state">Estado</label>
                        <input
                          id="child-edit-address-state"
                          value={childForm.addressState}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressState: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="field field-span-2">
                        <label htmlFor="child-edit-address-zipcode">CEP</label>
                        <input
                          id="child-edit-address-zipcode"
                          value={maskZipCode(childForm.addressZipCode || "")}
                          onChange={(event) =>
                            setChildForm((current) => ({
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
                        <label htmlFor="child-edit-address-country">País</label>
                        <input
                          id="child-edit-address-country"
                          value={childForm.addressCountry}
                          onChange={(event) =>
                            setChildForm((current) => ({
                              ...current,
                              addressCountry: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <ChildHealthInfoFields
                  value={childForm.healthInfo}
                  onChange={(key, value) =>
                    setChildForm((current) => ({
                      ...current,
                      healthInfo: {
                        ...current.healthInfo,
                        [key]: value,
                      },
                    }))
                  }
                  onAddMedication={(medication) =>
                    setChildForm((current) => ({
                      ...current,
                      healthInfo: {
                        ...current.healthInfo,
                        medications: [
                          ...current.healthInfo.medications,
                          medication,
                        ],
                      },
                    }))
                  }
                  onRemoveMedication={(index) =>
                    setChildForm((current) => ({
                      ...current,
                      healthInfo: {
                        ...current.healthInfo,
                        medications: current.healthInfo.medications.filter(
                          (_medication, medicationIndex) =>
                            medicationIndex !== index,
                        ),
                      },
                    }))
                  }
                />
              </div>

              <div className="profile-modal-footer">
                <p className="profile-modal-hint">
                  🔒 Campos acinzentados são somente leitura
                </p>
                <div className="profile-modal-footer-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => setIsChildEditModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn solid"
                    disabled={updateChildMut.isPending}
                  >
                    {updateChildMut.isPending
                      ? "Salvando..."
                      : "Salvar alteracoes"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isChildDeleteModalOpen}
        title="Confirmar exclusao"
        message="Quer mesmo excluir esta crianca?"
        onConfirm={async () => {
          if (pendingDeleteChildId) {
            await onDeleteChild(pendingDeleteChildId);
          }
          childrenHook.setPendingDeleteChildId(null);
          setIsChildDeleteModalOpen(false);
        }}
        onCancel={() => {
          childrenHook.setPendingDeleteChildId(null);
          setIsChildDeleteModalOpen(false);
        }}
        isLoading={deleteChildMut.isPending}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />

      {isChildAssignParentsModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsChildAssignParentsModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-label="Vincular responsaveis"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Vincular Responsaveis</h2>
            <form onSubmit={onAssignParentsToChild}>
              <section className="profile-section">
                <EntitySearchList
                  label="Responsaveis"
                  searchValue={childParentsSearch}
                  onSearchChange={setChildParentsSearch}
                  options={
                    assigningChildParentOptions.length === 0
                      ? childParents.map((p: ListItem) => ({
                          id: extractId(p),
                          name: String(p.name || "Responsavel sem nome"),
                        }))
                      : assigningChildParentOptions
                  }
                  selectedIds={assigningChildParentIds}
                  onToggle={toggleAssignChildParentSelection}
                  isLoading={false}
                  mode="checkbox"
                />
              </section>

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsChildAssignParentsModalOpen(false)}
                  disabled={assignParentsMut.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={assignParentsMut.isPending}
                >
                  {assignParentsMut.isPending ? "Salvando..." : "Vincular"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
