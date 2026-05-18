import { useState } from "react";
import { useParents } from "../hooks/useParents";
import { useChildren } from "../hooks/useChildren";
import { useWorkspaceContext } from "../WorkspaceContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { EntitySearchList } from "../components/EntitySearchList";
import { Pagination } from "../components/Pagination";
import { SkeletonBlock } from "../components/WorkspaceSkeleton";
import {
  maskCpf,
  normalizeDigits,
  extractId,
  maskPhone,
  parseIdList,
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

export function ParentsSection() {
  const queryClient = useQueryClient();
  const { page, setPage, search, setSearch } = useWorkspaceContext();
  const [pendingDeleteParentId, setPendingDeleteParentId] = useState<
    string | null
  >(null);

  const {
    filteredParents,
    parentsQuery,
    isParentViewModalOpen,
    setIsParentViewModalOpen,
    parentForm,
    setParentForm,
    isParentModalOpen,
    setIsParentModalOpen,
    isParentEditModalOpen,
    setIsParentEditModalOpen,
    isParentAssignChildrenModalOpen,
    setIsParentAssignChildrenModalOpen,
    parentChildrenSearch,
    setParentChildrenSearch,
    assigningParentChildIds,
    assigningParentChildOptions,
    openParentViewModal,
    onCreateParent,
    onUpdateParent,
    openParentEditModal,
    onDeleteParent,
    openParentAssignChildrenModal,
    onAssignChildrenToParent,
    toggleAssignParentChildSelection,
    deleteParentMut,
    createParentMut,
    updateParentMut,
    assignChildrenMut,
  } = useParents();

  const childrenHook = useChildren();
  const allChildren = childrenHook.pagedCollection;
  const isLoading =
    parentsQuery.isLoading || childrenHook.childrenQuery.isLoading;
  const handleRefresh = () => {
    void queryClient.resetQueries({ queryKey: ["parents"] });
    void queryClient.resetQueries({ queryKey: ["children"] });
  };

  const pagedParents = filteredParents.slice((page - 1) * 8, page * 8);
  const totalPages = Math.ceil(filteredParents.length / 8) || 1;

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Responsaveis</h2>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn solid"
              onClick={() => setIsParentModalOpen(true)}
            >
              Adicionar novo
            </button>
            <button
              type="button"
              className="btn outline crm-icon-btn"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Atualizar responsáveis"
              title="Atualizar responsáveis"
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
            placeholder="Buscar por nome ou CPF"
          />
        </div>

        <div className="crm-table">
          {isLoading && pagedParents.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`parent-skeleton-${index}`}
                className="crm-row crm-row-skeleton"
              >
                <div className="workspace-skeleton-stack">
                  <SkeletonBlock width="42%" height="1rem" />
                  <SkeletonBlock width="58%" height="0.8rem" />
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
              {pagedParents.map((item) => {
                const typed = item as ListItem;
                const id = extractId(typed);

                return (
                  <article
                    key={id || JSON.stringify(item)}
                    className="crm-row"
                    onClick={() => openParentViewModal(typed)}
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <strong>{typed.name || "Responsavel sem nome"}</strong>
                      <p>
                        {maskCpf(typed.document || "") || "CPF nao informado"}
                      </p>
                    </div>
                    <div className="crm-row-actions">
                      <button
                        type="button"
                        className="btn outline"
                        title="Vincular criancas"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!id) return;
                          openParentAssignChildrenModal(id);
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
                          openParentEditModal(typed);
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
                          setPendingDeleteParentId(id);
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </article>
                );
              })}

              {pagedParents.length === 0 && (
                <p>Nenhum responsavel encontrado para a busca informada.</p>
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

      {isParentViewModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsParentViewModalOpen(false)}
        >
          <section
            className="crm-modal collaborator-view-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Visualizar responsavel"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Detalhes do Responsavel</h2>
            <div className="collaborator-view-content">
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="profile-grid">
                  <article className="profile-card">
                    <span>Nome</span>
                    <strong>{parentForm.name || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>CPF</span>
                    <strong>{maskCpf(parentForm.document) || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Email</span>
                    <strong>{parentForm.email || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Contato</span>
                    <strong>{maskPhone(parentForm.contact) || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Data de nascimento</span>
                    <strong>{parentForm.birthDate || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Criancas vinculadas</span>
                    <strong>
                      {formatLinkedNames(
                        parentForm.children,
                        childrenHook.children as ListItem[],
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
                    <strong>{parentForm.addressStreet || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Numero</span>
                    <strong>{parentForm.addressNumber || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Bairro</span>
                    <strong>{parentForm.addressDistrict || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Cidade</span>
                    <strong>{parentForm.addressCity || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Estado</span>
                    <strong>{parentForm.addressState || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>CEP</span>
                    <strong>{parentForm.addressZipCode || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Complemento</span>
                    <strong>{parentForm.addressComplement || "-"}</strong>
                  </article>
                  <article className="profile-card">
                    <span>Pais</span>
                    <strong>{parentForm.addressCountry || "-"}</strong>
                  </article>
                </div>
              </section>
            </div>

            <div className="crm-modal-actions">
              <button
                type="button"
                className="btn outline"
                onClick={() => setIsParentViewModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      )}

      {isParentModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsParentModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide parent-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar responsavel"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Novo Responsavel</h2>
            <form
              className="crm-form-grid parent-modal-form"
              onSubmit={onCreateParent}
            >
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="parent-section-grid">
                  <div className="field">
                    <label htmlFor="parent-name">Nome</label>
                    <input
                      id="parent-name"
                      value={parentForm.name}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-document">CPF</label>
                    <input
                      id="parent-document"
                      value={maskCpf(parentForm.document)}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          document: normalizeDigits(event.target.value).slice(
                            0,
                            11,
                          ),
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-contact">Contato</label>
                    <input
                      id="parent-contact"
                      value={maskPhone(parentForm.contact)}
                      onChange={(event) =>
                        setParentForm((current) => ({
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
                  addressStreet: parentForm.addressStreet,
                  addressNumber: parentForm.addressNumber,
                  addressDistrict: parentForm.addressDistrict,
                  addressCity: parentForm.addressCity,
                  addressState: parentForm.addressState,
                  addressZipCode: parentForm.addressZipCode,
                  addressComplement: parentForm.addressComplement,
                  addressCountry: parentForm.addressCountry,
                }}
                onChange={(key, value) =>
                  setParentForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsParentModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={createParentMut.isPending}
                >
                  {createParentMut.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isParentEditModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsParentEditModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide parent-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar responsavel"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Editar Responsavel</h2>
            <form
              className="crm-form-grid parent-form"
              onSubmit={onUpdateParent}
            >
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="parent-section-grid">
                  <div className="field">
                    <label htmlFor="parent-edit-name">Nome</label>
                    <input
                      id="parent-edit-name"
                      value={parentForm.name}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-edit-document">CPF</label>
                    <input
                      id="parent-edit-document"
                      value={maskCpf(parentForm.document)}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          document: normalizeDigits(event.target.value).slice(
                            0,
                            11,
                          ),
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-edit-contact">Contato</label>
                    <input
                      id="parent-edit-contact"
                      value={maskPhone(parentForm.contact)}
                      onChange={(event) =>
                        setParentForm((current) => ({
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
                  addressStreet: parentForm.addressStreet,
                  addressNumber: parentForm.addressNumber,
                  addressDistrict: parentForm.addressDistrict,
                  addressCity: parentForm.addressCity,
                  addressState: parentForm.addressState,
                  addressZipCode: parentForm.addressZipCode,
                  addressComplement: parentForm.addressComplement,
                  addressCountry: parentForm.addressCountry,
                }}
                onChange={(key, value) =>
                  setParentForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsParentEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={updateParentMut.isPending}
                >
                  {updateParentMut.isPending
                    ? "Salvando..."
                    : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!pendingDeleteParentId}
        title="Confirmar exclusao"
        message="Quer mesmo excluir este responsavel?"
        onConfirm={async () => {
          if (pendingDeleteParentId) {
            await onDeleteParent(pendingDeleteParentId);
          }
          setPendingDeleteParentId(null);
        }}
        onCancel={() => setPendingDeleteParentId(null)}
        isLoading={deleteParentMut.isPending}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />

      {isParentAssignChildrenModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsParentAssignChildrenModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-label="Vincular criancas"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Vincular Criancas</h2>
            <form onSubmit={onAssignChildrenToParent}>
              <section className="profile-section">
                <EntitySearchList
                  label="Criancas"
                  searchValue={parentChildrenSearch}
                  onSearchChange={setParentChildrenSearch}
                  options={
                    assigningParentChildOptions.length === 0
                      ? allChildren.map((c: ListItem) => ({
                          id: extractId(c),
                          name: String(c.name || "Crianca sem nome"),
                        }))
                      : assigningParentChildOptions
                  }
                  selectedIds={assigningParentChildIds}
                  onToggle={toggleAssignParentChildSelection}
                  isLoading={false}
                  mode="checkbox"
                />
              </section>

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsParentAssignChildrenModalOpen(false)}
                  disabled={assignChildrenMut.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={assignChildrenMut.isPending}
                >
                  {assignChildrenMut.isPending ? "Salvando..." : "Vincular"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
