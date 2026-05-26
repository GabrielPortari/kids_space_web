import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParents } from "../hooks/useParents.ts";
import { useChildren } from "../hooks/useChildren";
import { useWorkspaceContext } from "../WorkspaceContext";
// Address form inlined into profile modal sections
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { EntitySearchList } from "../components/EntitySearchList";
import { Pagination } from "../components/Pagination";
import { SkeletonBlock } from "../components/WorkspaceSkeleton";
import {
  EditIcon,
  LinkIcon,
  ModalIconWrap,
  PersonIcon,
  PlusIcon,
  RecordAvatar,
  RefreshIcon,
} from "../components/WorkspaceVisuals";
import {
  maskCpf,
  normalizeDigits,
  extractId,
  maskPhone,
  parseIdList,
  maskZipCode,
} from "../formatter";
import type { ListItem } from "../types";
import { useQueryClient } from "@tanstack/react-query";

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
    openParentCreateModal,
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
  const allChildren = childrenHook.children;
  const isLoading =
    parentsQuery.isLoading || childrenHook.childrenQuery.isLoading;
  const handleRefresh = () => {
    void queryClient.resetQueries({ queryKey: ["parents"] });
    void queryClient.resetQueries({ queryKey: ["children"] });
  };

  const linkedChildOptions = useMemo(() => {
    const term = parentChildrenSearch.trim().toLowerCase();

    return (allChildren as ListItem[])
      .map((item) => {
        const id = extractId(item);
        return {
          id,
          name: String(item.name || "Crianca sem nome"),
        };
      })
      .filter((option) => {
        if (!option.id) {
          return false;
        }

        if (!term) {
          return true;
        }

        return (
          option.name.toLowerCase().includes(term) ||
          option.id.toLowerCase().includes(term)
        );
      });
  }, [allChildren, parentChildrenSearch]);

  const pagedParents: ListItem[] = filteredParents.slice(
    (page - 1) * 8,
    page * 8,
  );
  const totalPages = Math.ceil(filteredParents.length / 8) || 1;

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Responsaveis</h2>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn solid crm-add-button"
              onClick={openParentCreateModal}
            >
              <PlusIcon />
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
                    <div className="record-row-main">
                      <RecordAvatar name={typed.name || "Responsavel"} />
                      <div className="record-row-copy">
                        <strong>{typed.name || "Responsavel sem nome"}</strong>
                        <p>
                          {maskCpf(typed.document || "") || "CPF nao informado"}
                        </p>
                      </div>
                    </div>
                    <div className="crm-row-actions">
                      <button
                        type="button"
                        className="crm-icon-action"
                        title="Vincular criancas"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!id) return;
                          openParentAssignChildrenModal(id);
                        }}
                      >
                        <LinkIcon />
                      </button>
                      <button
                        type="button"
                        className="crm-icon-action"
                        title="Editar"
                        onClick={(event) => {
                          event.stopPropagation();
                          openParentEditModal(typed);
                        }}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="crm-remove-action"
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

      {isParentViewModalOpen &&
        createPortal(
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => setIsParentViewModalOpen(false)}
          >
            <section
              className="crm-modal crm-modal-wide profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Visualizar responsavel"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-modal-header">
                <div className="profile-modal-header-left">
                  <ModalIconWrap>
                    <PersonIcon />
                  </ModalIconWrap>
                  <div>
                    <p className="profile-modal-title">
                      Detalhes do Responsável
                    </p>
                    <p className="profile-modal-subtitle">
                      Visualize as informações do responsável
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="profile-modal-close"
                  aria-label="Fechar"
                  onClick={() => setIsParentViewModalOpen(false)}
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
                        <label htmlFor="parent-view-name">Nome</label>
                        <input
                          id="parent-view-name"
                          value={parentForm.name}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-view-document">CPF</label>
                        <input
                          id="parent-view-document"
                          value={maskCpf(parentForm.document)}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-view-contact">Contato</label>
                        <input
                          id="parent-view-contact"
                          value={maskPhone(parentForm.contact)}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-view-email">Email</label>
                        <input
                          id="parent-view-email"
                          type="email"
                          value={parentForm.email || ""}
                          disabled
                          className="field-readonly"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-view-birthDate">
                          Data de nascimento
                        </label>
                        <input
                          id="parent-view-birthDate"
                          type="date"
                          value={parentForm.birthDate || ""}
                          disabled
                          className="field-readonly"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="profile-section">
                    <h3>Crianças</h3>
                    <div className="child-section-grid">
                      <EntitySearchList
                        label="Crianças para vínculo direto"
                        searchValue={parentChildrenSearch}
                        onSearchChange={() => undefined}
                        options={linkedChildOptions}
                        selectedIds={parseIdList(parentForm.children)}
                        onToggle={() => undefined}
                        isLoading={childrenHook.childrenQuery.isLoading}
                        placeholder="Buscar por nome"
                        mode="checkbox"
                        disabled
                      />
                    </div>
                  </section>

                  <section className="profile-section">
                    <h3>Endereço</h3>
                    <div className="profile-form-address-stack">
                      <div className="profile-form-fields-grid profile-form-address-grid">
                        <div className="field field-span-6">
                          <label htmlFor="parent-view-address-street">
                            Rua
                          </label>
                          <input
                            id="parent-view-address-street"
                            value={parentForm.addressStreet}
                            disabled
                            className="field-readonly"
                          />
                        </div>

                        <div className="field field-span-1">
                          <label htmlFor="parent-view-address-number">
                            Número
                          </label>
                          <input
                            id="parent-view-address-number"
                            value={parentForm.addressNumber}
                            disabled
                            className="field-readonly"
                          />
                        </div>

                        <div className="field field-span-2">
                          <label htmlFor="parent-view-address-complement">
                            Complemento
                          </label>
                          <input
                            id="parent-view-address-complement"
                            value={parentForm.addressComplement}
                            disabled
                            className="field-readonly"
                          />
                        </div>

                        <div className="field field-span-3">
                          <label htmlFor="parent-view-address-district">
                            Bairro
                          </label>
                          <input
                            id="parent-view-address-district"
                            value={parentForm.addressDistrict}
                            disabled
                            className="field-readonly"
                          />
                        </div>
                      </div>

                      <div className="profile-form-fields-grid profile-form-address-grid">
                        <div className="field field-span-6">
                          <label htmlFor="parent-view-address-city">
                            Cidade
                          </label>
                          <input
                            id="parent-view-address-city"
                            value={parentForm.addressCity}
                            disabled
                            className="field-readonly"
                          />
                        </div>

                        <div className="field field-span-1">
                          <label htmlFor="parent-view-address-state">
                            Estado
                          </label>
                          <input
                            id="parent-view-address-state"
                            value={parentForm.addressState}
                            disabled
                            className="field-readonly"
                          />
                        </div>

                        <div className="field field-span-2">
                          <label htmlFor="parent-view-address-zipcode">
                            CEP
                          </label>
                          <input
                            id="parent-view-address-zipcode"
                            value={maskZipCode(parentForm.addressZipCode || "")}
                            disabled
                            className="field-readonly"
                          />
                        </div>

                        <div className="field field-span-3">
                          <label htmlFor="parent-view-address-country">
                            País
                          </label>
                          <input
                            id="parent-view-address-country"
                            value={parentForm.addressCountry}
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
                    onClick={() => setIsParentViewModalOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )}

      {isParentModalOpen &&
        createPortal(
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => setIsParentModalOpen(false)}
          >
            <section
              className="crm-modal crm-modal-wide profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Adicionar responsavel"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-modal-header">
                <div className="profile-modal-header-left">
                  <ModalIconWrap>
                    <PersonIcon />
                  </ModalIconWrap>
                  <div>
                    <p className="profile-modal-title">Novo Responsável</p>
                    <p className="profile-modal-subtitle">
                      Crie um novo responsável
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="profile-modal-close"
                  aria-label="Fechar"
                  onClick={() => setIsParentModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form className="profile-form" onSubmit={onCreateParent}>
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

                      <div className="field field-span-6">
                        <label htmlFor="parent-document">CPF</label>
                        <input
                          id="parent-document"
                          value={maskCpf(parentForm.document)}
                          onChange={(event) =>
                            setParentForm((current) => ({
                              ...current,
                              document: normalizeDigits(
                                event.target.value,
                              ).slice(0, 11),
                            }))
                          }
                          placeholder="000.000.000-00"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-contact">Contato</label>
                        <input
                          id="parent-contact"
                          value={maskPhone(parentForm.contact)}
                          onChange={(event) =>
                            setParentForm((current) => ({
                              ...current,
                              contact: normalizeDigits(
                                event.target.value,
                              ).slice(0, 11),
                            }))
                          }
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-email">Email</label>
                        <input
                          id="parent-email"
                          type="email"
                          value={parentForm.email || ""}
                          onChange={(e) =>
                            setParentForm((current) => ({
                              ...current,
                              email: e.target.value,
                            }))
                          }
                          placeholder="nome@exemplo.com"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-birthDate">
                          Data de nascimento
                        </label>
                        <input
                          id="parent-birthDate"
                          type="date"
                          value={parentForm.birthDate || ""}
                          onChange={(e) =>
                            setParentForm((current) => ({
                              ...current,
                              birthDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-section">
                    <div className="profile-form-section-header">
                      <span className="profile-form-section-label">
                        Crianças
                      </span>
                      <div className="profile-form-section-line" />
                    </div>
                    <div className="child-section-grid">
                      <EntitySearchList
                        label="Crianças para vínculo direto"
                        searchValue={parentChildrenSearch}
                        onSearchChange={setParentChildrenSearch}
                        options={linkedChildOptions}
                        selectedIds={parseIdList(parentForm.children)}
                        onToggle={(childId) =>
                          setParentForm((current) => {
                            const ids = new Set(parseIdList(current.children));
                            if (ids.has(childId)) {
                              ids.delete(childId);
                            } else {
                              ids.add(childId);
                            }
                            return {
                              ...current,
                              children: Array.from(ids).join(","),
                            };
                          })
                        }
                        isLoading={childrenHook.childrenQuery.isLoading}
                        placeholder="Buscar por nome"
                        mode="checkbox"
                      />
                    </div>
                  </div>

                  <div className="profile-form-section">
                    <div className="profile-form-section-header">
                      <span className="profile-form-section-label">
                        Endereço
                      </span>
                      <div className="profile-form-section-line" />
                    </div>
                    <div className="profile-form-address-stack">
                      <div className="profile-form-fields-grid profile-form-address-grid">
                        <div className="field field-span-6">
                          <label htmlFor="parent-address-street">Rua</label>
                          <input
                            id="parent-address-street"
                            value={parentForm.addressStreet}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressStreet: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-1">
                          <label htmlFor="parent-address-number">Número</label>
                          <input
                            id="parent-address-number"
                            value={parentForm.addressNumber}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressNumber: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-2">
                          <label htmlFor="parent-address-complement">
                            Complemento
                          </label>
                          <input
                            id="parent-address-complement"
                            value={parentForm.addressComplement}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressComplement: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-3">
                          <label htmlFor="parent-address-district">
                            Bairro
                          </label>
                          <input
                            id="parent-address-district"
                            value={parentForm.addressDistrict}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressDistrict: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="profile-form-fields-grid profile-form-address-grid">
                        <div className="field field-span-6">
                          <label htmlFor="parent-address-city">Cidade</label>
                          <input
                            id="parent-address-city"
                            value={parentForm.addressCity}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressCity: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-1">
                          <label htmlFor="parent-address-state">Estado</label>
                          <input
                            id="parent-address-state"
                            value={parentForm.addressState}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressState: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-2">
                          <label htmlFor="parent-address-zipcode">CEP</label>
                          <input
                            id="parent-address-zipcode"
                            value={maskZipCode(parentForm.addressZipCode || "")}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressZipCode: normalizeDigits(
                                  e.target.value,
                                ).slice(0, 8),
                              }))
                            }
                            placeholder="00000-000"
                          />
                        </div>

                        <div className="field field-span-3">
                          <label htmlFor="parent-address-country">País</label>
                          <input
                            id="parent-address-country"
                            value={parentForm.addressCountry}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressCountry: e.target.value,
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
                </div>
              </form>
            </section>
          </div>,
          document.body,
        )}

      {isParentEditModalOpen &&
        createPortal(
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => setIsParentEditModalOpen(false)}
          >
            <section
              className="crm-modal crm-modal-wide profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Editar responsavel"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-modal-header">
                <div className="profile-modal-header-left">
                  <ModalIconWrap>
                    <PersonIcon />
                  </ModalIconWrap>
                  <div>
                    <p className="profile-modal-title">Editar Responsável</p>
                    <p className="profile-modal-subtitle">
                      Atualize as informações do responsável
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="profile-modal-close"
                  aria-label="Fechar"
                  onClick={() => setIsParentEditModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form className="profile-form" onSubmit={onUpdateParent}>
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

                      <div className="field field-span-6">
                        <label htmlFor="parent-edit-document">CPF</label>
                        <input
                          id="parent-edit-document"
                          value={maskCpf(parentForm.document)}
                          onChange={(event) =>
                            setParentForm((current) => ({
                              ...current,
                              document: normalizeDigits(
                                event.target.value,
                              ).slice(0, 11),
                            }))
                          }
                          placeholder="000.000.000-00"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-edit-contact">Contato</label>
                        <input
                          id="parent-edit-contact"
                          value={maskPhone(parentForm.contact)}
                          onChange={(event) =>
                            setParentForm((current) => ({
                              ...current,
                              contact: normalizeDigits(
                                event.target.value,
                              ).slice(0, 11),
                            }))
                          }
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-edit-email">Email</label>
                        <input
                          id="parent-edit-email"
                          type="email"
                          value={parentForm.email || ""}
                          onChange={(e) =>
                            setParentForm((current) => ({
                              ...current,
                              email: e.target.value,
                            }))
                          }
                          placeholder="nome@exemplo.com"
                        />
                      </div>

                      <div className="field field-span-6">
                        <label htmlFor="parent-edit-birthDate">
                          Data de nascimento
                        </label>
                        <input
                          id="parent-edit-birthDate"
                          type="date"
                          value={parentForm.birthDate || ""}
                          onChange={(e) =>
                            setParentForm((current) => ({
                              ...current,
                              birthDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-section">
                    <div className="profile-form-section-header">
                      <span className="profile-form-section-label">
                        Endereço
                      </span>
                      <div className="profile-form-section-line" />
                    </div>
                    <div className="profile-form-address-stack">
                      <div className="profile-form-fields-grid profile-form-address-grid">
                        <div className="field field-span-4">
                          <label htmlFor="parent-edit-address-street">
                            Rua
                          </label>
                          <input
                            id="parent-edit-address-street"
                            value={parentForm.addressStreet}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressStreet: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-2">
                          <label htmlFor="parent-edit-address-number">
                            Número
                          </label>
                          <input
                            id="parent-edit-address-number"
                            value={parentForm.addressNumber}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressNumber: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-3">
                          <label htmlFor="parent-edit-address-complement">
                            Complemento
                          </label>
                          <input
                            id="parent-edit-address-complement"
                            value={parentForm.addressComplement}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressComplement: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-3">
                          <label htmlFor="parent-edit-address-district">
                            Bairro
                          </label>
                          <input
                            id="parent-edit-address-district"
                            value={parentForm.addressDistrict}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressDistrict: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="profile-form-fields-grid profile-form-address-grid">
                        <div className="field field-span-4">
                          <label htmlFor="parent-edit-address-city">
                            Cidade
                          </label>
                          <input
                            id="parent-edit-address-city"
                            value={parentForm.addressCity}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressCity: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-2">
                          <label htmlFor="parent-edit-address-state">
                            Estado
                          </label>
                          <input
                            id="parent-edit-address-state"
                            value={parentForm.addressState}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressState: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field field-span-3">
                          <label htmlFor="parent-edit-address-zipcode">
                            CEP
                          </label>
                          <input
                            id="parent-edit-address-zipcode"
                            value={maskZipCode(parentForm.addressZipCode || "")}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressZipCode: normalizeDigits(
                                  e.target.value,
                                ).slice(0, 8),
                              }))
                            }
                            placeholder="00000-000"
                          />
                        </div>

                        <div className="field field-span-3">
                          <label htmlFor="parent-edit-address-country">
                            País
                          </label>
                          <input
                            id="parent-edit-address-country"
                            value={parentForm.addressCountry}
                            onChange={(e) =>
                              setParentForm((current) => ({
                                ...current,
                                addressCountry: e.target.value,
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
                        : "Salvar alterações"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>,
          document.body,
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

      {isParentAssignChildrenModalOpen &&
        createPortal(
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
                    placeholder="Buscar por nome"
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
          </div>,
          document.body,
        )}
    </>
  );
}
