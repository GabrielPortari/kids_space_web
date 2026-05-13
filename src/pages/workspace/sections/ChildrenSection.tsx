import { useChildren } from "../hooks/useChildren";
import { useWorkspaceContext } from "../WorkspaceContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { EntitySearchList } from "../components/EntitySearchList";
import { Pagination } from "../components/Pagination";
import { extractId, parseIdList } from "../formatter";
import type { ListItem } from "../types";

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

export function ChildrenSection() {
  const { page, setPage, search, setSearch } = useWorkspaceContext();

  const childrenHook = useChildren();

  const {
    pagedCollection,
    onCreateChildModal,
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
  } = childrenHook;

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
            Nova criança
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
              <article
                key={id || JSON.stringify(item)}
                className="crm-row"
                onClick={() => openChildViewModal(typed)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <strong>{typed.name || "Crianca sem nome"}</strong>
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
            className="crm-modal crm-modal-wide child-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar crianca"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Nova Crianca</h2>
            <form
              className="crm-form-grid child-modal-form"
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
                <h3>Endereco</h3>
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
                <h3>Endereco</h3>
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
