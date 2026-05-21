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
  parseIdList,
  toParentFormState,
  splitTextList,
} from "../formatter";
import type { ListItem } from "../types";
import { useQueryClient } from "@tanstack/react-query";

function formatLinkedNames(idsValue: string, items: ListItem[]): string {
  const ids = parseIdList(idsValue);
  if (ids.length === 0) {
    return "-";
  }

  const nameById = new Map(
    items.map((item) => [extractId(item), String(item.name || "")]),
  );

  return ids
    .map((id) => nameById.get(id) || id)
    .filter(Boolean)
    .join(", ");
}

function formatListSummary(value: unknown): string {
  if (!value) return "-";

  if (Array.isArray(value)) {
    const items = value.map((v) => String(v || "").trim()).filter(Boolean);
    return items.length > 0 ? items.join(", ") : "-";
  }

  if (typeof value === "string") {
    const items = splitTextList(value);
    return items.length > 0 ? items.join(", ") : "-";
  }

  return "-";
}

function formatMedicationSummary(medications: unknown): string {
  if (!Array.isArray(medications)) {
    return "-";
  }

  const items = medications
    .map((medication) => {
      if (!medication || typeof medication !== "object") {
        return "";
      }

      const current = medication as Record<string, unknown>;
      return [current.name, current.dosage, current.schedule]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" - ");
    })
    .filter(Boolean);

  return items.length > 0 ? items.join("; ") : "-";
}

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
            className="crm-modal collaborator-view-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Visualizar crianca"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Detalhes da Crianca</h2>
            <div className="collaborator-view-content">
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="profile-grid">
                  <article className="profile-card">
                    <span>Nome</span>
                    <strong>{childForm.name || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>CPF/ID</span>
                    <strong>{childForm.document || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Email</span>
                    <strong>{childForm.email || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Contato</span>
                    <strong>{childForm.contact || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Data de nascimento</span>
                    <strong>{childForm.birthDate || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Responsaveis vinculados</span>
                    <strong>
                      {formatLinkedNames(
                        childForm.parents,
                        childParents as ListItem[],
                      )}
                    </strong>
                  </article>
                </div>
              </section>

              <section className="profile-section">
                <h3>Endereco</h3>
                <div className="profile-grid">
                  <article className="profile-card">
                    <span>Rua</span>
                    <strong>{childForm.addressStreet || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Numero</span>
                    <strong>{childForm.addressNumber || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Bairro</span>
                    <strong>{childForm.addressDistrict || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Cidade</span>
                    <strong>{childForm.addressCity || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Estado</span>
                    <strong>{childForm.addressState || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>CEP</span>
                    <strong>{childForm.addressZipCode || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Complemento</span>
                    <strong>{childForm.addressComplement || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Pais</span>
                    <strong>{childForm.addressCountry || "-"}</strong>
                  </article>
                </div>
              </section>

              <section className="profile-section">
                <h3>Saude</h3>
                <div className="profile-grid">
                  <article className="profile-card">
                    <span>Restricoes alimentares</span>
                    <strong>
                      {formatListSummary(
                        childForm.healthInfo.dietaryRestrictions,
                      )}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Alergias</span>
                    <strong>
                      {formatListSummary(childForm.healthInfo.allergies)}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Condicoes medicas</span>
                    <strong>
                      {formatListSummary(
                        childForm.healthInfo.medicalConditions,
                      )}
                    </strong>
                  </article>
                  <article className="profile-card">
                    <span>Medos ou sensibilidades</span>
                    <strong>
                      {formatListSummary(
                        childForm.healthInfo.fearsOrSensitivities,
                      )}
                    </strong>
                  </article>
                  <article className="profile-card field-span-2">
                    <span>Medicamentos</span>
                    <strong>
                      {formatMedicationSummary(
                        childForm.healthInfo.medications,
                      )}
                    </strong>
                  </article>
                </div>
              </section>
            </div>

            <div className="crm-modal-actions">
              <button
                type="button"
                className="btn outline"
                onClick={() => setIsChildViewModalOpen(false)}
              >
                Fechar
              </button>
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
