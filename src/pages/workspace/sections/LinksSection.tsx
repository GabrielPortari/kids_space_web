import { useParents } from "../hooks/useParents";
import { useChildren } from "../hooks/useChildren";
import { useState } from "react";

export function LinksSection() {
  const parentsHook = useParents();
  const childrenHook = useChildren();

  const [operationParentSearch, setOperationParentSearch] = useState("");
  const [operationSelectedParentId, setOperationSelectedParentId] = useState<
    string | null
  >(null);
  const [operationChildrenSearch, setOperationChildrenSearch] = useState("");
  const [operationSelectedChildrenIds, setOperationSelectedChildrenIds] =
    useState<string[]>([]);

  const [operationChildSearch, setOperationChildSearch] = useState("");
  const [operationSelectedChildId, setOperationSelectedChildId] = useState<
    string | null
  >(null);
  const [operationParentsSearch, setOperationParentsSearch] = useState("");
  const [operationSelectedParentIds, setOperationSelectedParentIds] = useState<
    string[]
  >([]);

  const operationParentOptions = parentsHook.filteredParents
    .filter((p: any) =>
      p.name.toLowerCase().includes(operationParentSearch.toLowerCase()),
    )
    .map((p: any) => ({
      id: p.id,
      name: p.name || "Parent sem nome",
    }));

  const operationChildrenOptions = childrenHook.pagedCollection
    .filter((c: any) =>
      c.name.toLowerCase().includes(operationChildrenSearch.toLowerCase()),
    )
    .map((c: any) => ({
      id: c.id,
      name: c.name || "Crianca sem nome",
    }));

  const operationChildOptions = childrenHook.pagedCollection
    .filter((c: any) =>
      c.name.toLowerCase().includes(operationChildSearch.toLowerCase()),
    )
    .map((c: any) => ({
      id: c.id,
      name: c.name || "Crianca sem nome",
    }));

  const operationParentsOptions = parentsHook.filteredParents
    .filter((p: any) =>
      p.name.toLowerCase().includes(operationParentsSearch.toLowerCase()),
    )
    .map((p: any) => ({
      id: p.id,
      name: p.name || "Parent sem nome",
    }));

  const onAssignChildrenToParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (operationSelectedParentId && operationSelectedChildrenIds.length > 0) {
      await parentsHook.assignChildrenMut.mutateAsync({
        parentId: operationSelectedParentId,
        childIds: operationSelectedChildrenIds,
      });
      setOperationSelectedParentId(null);
      setOperationSelectedChildrenIds([]);
      setOperationParentSearch("");
      setOperationChildrenSearch("");
    }
  };

  const onAssignChildParents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (operationSelectedChildId && operationSelectedParentIds.length > 0) {
      await childrenHook.assignParentsMut.mutateAsync({
        childId: operationSelectedChildId,
        parentIds: operationSelectedParentIds,
      });
      setOperationSelectedChildId(null);
      setOperationSelectedParentIds([]);
      setOperationChildSearch("");
      setOperationParentsSearch("");
    }
  };

  return (
    <>
      <section className="crm-panel">
        <h2>Vincular childs a um parent</h2>
        <form
          className="crm-form-grid operation-form"
          onSubmit={onAssignChildrenToParent}
        >
          <section className="profile-section">
            <h3>Selecao</h3>
            <div className="operation-fields-grid">
              <div className="field operation-picker-field">
                <label htmlFor="operation-parent-search">Responsavel</label>
                <div className="operation-picker">
                  <input
                    id="operation-parent-search"
                    value={operationParentSearch}
                    onChange={(event) =>
                      setOperationParentSearch(event.target.value)
                    }
                    placeholder="Buscar por nome ou CPF"
                  />
                  <div
                    className="operation-dropdown"
                    role="listbox"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {parentsHook.parentsQuery.isLoading && (
                      <p className="operation-hint">
                        Carregando responsaveis...
                      </p>
                    )}

                    {!parentsHook.parentsQuery.isLoading &&
                      operationParentOptions.map((option) => (
                        <label
                          key={option.id}
                          className="operation-option"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setOperationSelectedParentId(option.id);
                            setOperationParentSearch(option.name);
                          }}
                        >
                          <input
                            type="radio"
                            checked={operationSelectedParentId === option.id}
                            readOnly
                            tabIndex={-1}
                          />
                          <span>
                            <strong>{option.name}</strong>
                            <small>{option.id}</small>
                          </span>
                        </label>
                      ))}

                    {!parentsHook.parentsQuery.isLoading &&
                      operationParentOptions.length === 0 && (
                        <p className="operation-hint">
                          Nenhum responsavel encontrado para a busca.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="field operation-picker-field">
                <label htmlFor="operation-children-search">Criancas</label>
                <div className="operation-picker">
                  <input
                    id="operation-children-search"
                    value={operationChildrenSearch}
                    onChange={(event) =>
                      setOperationChildrenSearch(event.target.value)
                    }
                    placeholder="Buscar por nome ou ID"
                  />
                  <div
                    className="operation-dropdown"
                    role="listbox"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {childrenHook.childrenQuery.isLoading && (
                      <p className="operation-hint">Carregando criancas...</p>
                    )}

                    {!childrenHook.childrenQuery.isLoading &&
                      operationChildrenOptions.map((option) => {
                        const isChecked = operationSelectedChildrenIds.includes(
                          option.id,
                        );

                        return (
                          <label
                            key={option.id}
                            className="operation-option"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setOperationSelectedChildrenIds((prev) =>
                                isChecked
                                  ? prev.filter((id) => id !== option.id)
                                  : [...prev, option.id],
                              );
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              tabIndex={-1}
                            />
                            <span>
                              <strong>{option.name}</strong>
                              <small>{option.id}</small>
                            </span>
                          </label>
                        );
                      })}

                    {!childrenHook.childrenQuery.isLoading &&
                      operationChildrenOptions.length === 0 && (
                        <p className="operation-hint">
                          Nenhuma crianca encontrada para a busca.
                        </p>
                      )}
                  </div>
                </div>
                <p className="operation-selected">
                  {operationSelectedChildrenIds.length} crianca(s)
                  selecionada(s)
                </p>
              </div>
            </div>
          </section>

          <div className="crm-modal-actions">
            <button className="btn solid" type="submit">
              Vincular
            </button>
          </div>
        </form>
      </section>

      <section className="crm-panel">
        <h2>Vincular parents a um child</h2>
        <form
          className="crm-form-grid operation-form"
          onSubmit={onAssignChildParents}
        >
          <section className="profile-section">
            <h3>Selecao</h3>
            <div className="operation-fields-grid">
              <div className="field operation-picker-field">
                <label htmlFor="operation-child-search">Crianca</label>
                <div className="operation-picker">
                  <input
                    id="operation-child-search"
                    value={operationChildSearch}
                    onChange={(event) =>
                      setOperationChildSearch(event.target.value)
                    }
                    placeholder="Buscar por nome ou ID"
                  />
                  <div
                    className="operation-dropdown"
                    role="listbox"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {childrenHook.childrenQuery.isLoading && (
                      <p className="operation-hint">Carregando criancas...</p>
                    )}

                    {!childrenHook.childrenQuery.isLoading &&
                      operationChildOptions.map((option) => (
                        <label
                          key={option.id}
                          className="operation-option"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setOperationSelectedChildId(option.id);
                            setOperationChildSearch(option.name);
                          }}
                        >
                          <input
                            type="radio"
                            checked={operationSelectedChildId === option.id}
                            readOnly
                            tabIndex={-1}
                          />
                          <span>
                            <strong>{option.name}</strong>
                            <small>{option.id}</small>
                          </span>
                        </label>
                      ))}

                    {!childrenHook.childrenQuery.isLoading &&
                      operationChildOptions.length === 0 && (
                        <p className="operation-hint">
                          Nenhuma crianca encontrada para a busca.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="field operation-picker-field">
                <label htmlFor="operation-parents-search">Responsaveis</label>
                <div className="operation-picker">
                  <input
                    id="operation-parents-search"
                    value={operationParentsSearch}
                    onChange={(event) =>
                      setOperationParentsSearch(event.target.value)
                    }
                    placeholder="Buscar por nome ou CPF"
                  />
                  <div
                    className="operation-dropdown"
                    role="listbox"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {parentsHook.parentsQuery.isLoading && (
                      <p className="operation-hint">
                        Carregando responsaveis...
                      </p>
                    )}

                    {!parentsHook.parentsQuery.isLoading &&
                      operationParentsOptions.map((option) => {
                        const isChecked = operationSelectedParentIds.includes(
                          option.id,
                        );

                        return (
                          <label
                            key={option.id}
                            className="operation-option"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setOperationSelectedParentIds((prev) =>
                                isChecked
                                  ? prev.filter((id) => id !== option.id)
                                  : [...prev, option.id],
                              );
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              tabIndex={-1}
                            />
                            <span>
                              <strong>{option.name}</strong>
                              <small>{option.id}</small>
                            </span>
                          </label>
                        );
                      })}

                    {!parentsHook.parentsQuery.isLoading &&
                      operationParentsOptions.length === 0 && (
                        <p className="operation-hint">
                          Nenhum responsavel encontrado para a busca.
                        </p>
                      )}
                  </div>
                </div>
                <p className="operation-selected">
                  {operationSelectedParentIds.length} responsavel(is)
                  selecionado(s)
                </p>
              </div>
            </div>
          </section>

          <div className="crm-modal-actions">
            <button className="btn solid" type="submit">
              Vincular
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
