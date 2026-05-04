import { useState } from "react";
import { useParents } from "../hooks/useParents";
import { useChildren } from "../hooks/useChildren";
import { useWorkspaceContext } from "../WorkspaceContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { EntitySearchList } from "../components/EntitySearchList";
import { Pagination } from "../components/Pagination";
import { maskCpf, normalizeDigits, extractId, maskPhone } from "../formatter";
import type { ListItem } from "../types";

export function ParentsSection() {
  const { page, setPage, search, setSearch } = useWorkspaceContext();
  const [pendingDeleteParentId, setPendingDeleteParentId] = useState<
    string | null
  >(null);

  const {
    filteredParents,
    parentForm,
    setParentForm,
    isParentModalOpen,
    setIsParentModalOpen,
    isParentEditModalOpen,
    setIsParentEditModalOpen,
    parentChildrenSearch,
    setParentChildrenSearch,
    selectedParentChildrenIds,
    toggleParentChildSelection,
    onCreateParent,
    onUpdateParent,
    openParentEditModal,
    onDeleteParent,
    deleteParentMut,
    createParentMut,
    updateParentMut,
  } = useParents();

  const childrenHook = useChildren();
  const parentChildrenOptions = childrenHook.pagedCollection.map((c: any) => ({
    id: c.id,
    name: c.name || "Crianca sem nome",
  }));

  const pagedParents = filteredParents.slice((page - 1) * 8, page * 8);
  const totalPages = Math.ceil(filteredParents.length / 8) || 1;

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Responsaveis</h2>
          <button
            type="button"
            className="btn solid"
            onClick={() => setIsParentModalOpen(true)}
          >
            Novo responsavel
          </button>
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
          {pagedParents.map((item) => {
            const typed = item as ListItem;
            const id = extractId(typed);

            return (
              <article key={id || JSON.stringify(item)} className="crm-row">
                <div>
                  <strong>{typed.name || "Responsavel sem nome"}</strong>
                  <p>{maskCpf(typed.document || "") || "CPF nao informado"}</p>
                </div>
                <div className="crm-row-actions">
                  <button
                    type="button"
                    className="btn outline"
                    title="Editar"
                    onClick={() => openParentEditModal(typed)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
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
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>

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
              className="crm-form-grid parent-form"
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

              <section className="profile-section">
                <h3>Vincular criancas</h3>
                <EntitySearchList
                  label="Criancas"
                  searchValue={parentChildrenSearch}
                  onSearchChange={setParentChildrenSearch}
                  options={parentChildrenOptions}
                  selectedIds={selectedParentChildrenIds}
                  onToggle={toggleParentChildSelection}
                  isLoading={childrenHook.childrenQuery.isLoading}
                  mode="checkbox"
                />
              </section>

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

              <section className="profile-section">
                <h3>Vincular criancas</h3>
                <EntitySearchList
                  label="Criancas"
                  searchValue={parentChildrenSearch}
                  onSearchChange={setParentChildrenSearch}
                  options={parentChildrenOptions}
                  selectedIds={selectedParentChildrenIds}
                  onToggle={toggleParentChildSelection}
                  isLoading={childrenHook.childrenQuery.isLoading}
                  mode="checkbox"
                />
              </section>

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
    </>
  );
}
