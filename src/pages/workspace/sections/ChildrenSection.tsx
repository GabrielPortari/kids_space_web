import { useChildren } from "../hooks/useChildren";
import { useParents } from "../hooks/useParents";
import { useWorkspaceContext } from "../WorkspaceContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { EntitySearchList } from "../components/EntitySearchList";
import { Pagination } from "../components/Pagination";
import { extractId } from "../formatter";
import type { ListItem } from "../types";

export function ChildrenSection() {
  const { page, setPage, search, setSearch } = useWorkspaceContext();

  const childrenHook = useChildren();
  const parentsHook = useParents();

  const {
    pagedCollection,
    onCreateChildModal,
    onUpdateChildModal,
    openChildEditModal,
    onDeleteChild,
    deleteChildMut,
    createChildMut,
    updateChildMut,
    childForm,
    setChildForm,
    isChildCreateModalOpen,
    setIsChildCreateModalOpen,
    isChildEditModalOpen,
    setIsChildEditModalOpen,
    isChildDeleteModalOpen,
    setIsChildDeleteModalOpen,
    childParentsSearch,
    setChildParentsSearch,
    selectedChildParentIds,
    toggleChildParentSelection,
    pendingDeleteChildId,
  } = childrenHook;

  const childParentOptions = parentsHook.filteredParents.map((p: any) => ({
    id: p.id,
    name: p.name || "Parent sem nome",
  }));

  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(pagedCollection.length / PAGE_SIZE) || 1;

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Criancas</h2>
          <button
            type="button"
            className="btn solid"
            onClick={() => setIsChildCreateModalOpen(true)}
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
                  <strong>{typed.name || "Crianca sem nome"}</strong>
                  <p>{typed.email || "Email nao informado"}</p>
                </div>
                <div className="crm-row-actions">
                  <button
                    type="button"
                    className="btn outline"
                    title="Editar"
                    onClick={() => openChildEditModal(typed)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      if (!id) return;
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
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>

      {isChildCreateModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsChildCreateModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide child-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar crianca"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Nova Crianca</h2>
            <form
              className="crm-form-grid child-form"
              onSubmit={onCreateChildModal}
            >
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="child-section-grid">
                  <div className="field">
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

                  <div className="field">
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

                  <div className="field">
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
              </section>

              <section className="profile-section">
                <h3>Vincular responsaveis</h3>
                <EntitySearchList
                  label="Responsaveis"
                  searchValue={childParentsSearch}
                  onSearchChange={setChildParentsSearch}
                  options={childParentOptions}
                  selectedIds={selectedChildParentIds}
                  onToggle={toggleChildParentSelection}
                  isLoading={parentsHook.parentsQuery.isLoading}
                  mode="checkbox"
                />
              </section>

              <section className="profile-section">
                <h3>Endereco</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={childForm.inheritParentAddress}
                    onChange={(event) =>
                      setChildForm((current) => ({
                        ...current,
                        inheritParentAddress: event.target.checked,
                      }))
                    }
                  />
                  Herdar endereco do primeiro responsavel selecionado
                </label>

                {!childForm.inheritParentAddress && (
                  <AddressFormFields
                    values={{
                      addressStreet: childForm.addressStreet,
                      addressNumber: childForm.addressNumber,
                      addressDistrict: childForm.addressDistrict,
                      addressCity: childForm.addressCity,
                      addressState: childForm.addressState,
                      addressZipCode: childForm.addressZipCode,
                      addressComplement: childForm.addressComplement,
                      addressCountry: childForm.addressCountry,
                    }}
                    onChange={(key, value) =>
                      setChildForm((current) => ({
                        ...current,
                        [key]: value,
                      }))
                    }
                  />
                )}
              </section>

              <div className="crm-modal-actions">
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
            className="crm-modal crm-modal-wide child-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar crianca"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Editar Crianca</h2>
            <form
              className="crm-form-grid child-form"
              onSubmit={onUpdateChildModal}
            >
              <section className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="child-section-grid">
                  <div className="field">
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

                  <div className="field">
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

                  <div className="field">
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
              </section>

              <section className="profile-section">
                <h3>Vincular responsaveis</h3>
                <EntitySearchList
                  label="Responsaveis"
                  searchValue={childParentsSearch}
                  onSearchChange={setChildParentsSearch}
                  options={childParentOptions}
                  selectedIds={selectedChildParentIds}
                  onToggle={toggleChildParentSelection}
                  isLoading={parentsHook.parentsQuery.isLoading}
                  mode="checkbox"
                />
              </section>

              <section className="profile-section">
                <h3>Endereco</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={childForm.inheritParentAddress}
                    onChange={(event) =>
                      setChildForm((current) => ({
                        ...current,
                        inheritParentAddress: event.target.checked,
                      }))
                    }
                  />
                  Herdar endereco do primeiro responsavel selecionado
                </label>

                {!childForm.inheritParentAddress && (
                  <AddressFormFields
                    values={{
                      addressStreet: childForm.addressStreet,
                      addressNumber: childForm.addressNumber,
                      addressDistrict: childForm.addressDistrict,
                      addressCity: childForm.addressCity,
                      addressState: childForm.addressState,
                      addressZipCode: childForm.addressZipCode,
                      addressComplement: childForm.addressComplement,
                      addressCountry: childForm.addressCountry,
                    }}
                    onChange={(key, value) =>
                      setChildForm((current) => ({
                        ...current,
                        [key]: value,
                      }))
                    }
                  />
                )}
              </section>

              <div className="crm-modal-actions">
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
          setIsChildDeleteModalOpen(false);
        }}
        onCancel={() => setIsChildDeleteModalOpen(false)}
        isLoading={deleteChildMut.isPending}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </>
  );
}
