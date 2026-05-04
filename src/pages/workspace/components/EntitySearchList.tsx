type EntitySearchListProps = {
  label: string;
  searchValue: string;
  onSearchChange: (term: string) => void;
  options: { id: string; name: string }[];
  selectedIds: string | string[];
  onToggle: (id: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  mode?: "checkbox" | "radio";
};

export function EntitySearchList({
  label,
  searchValue,
  onSearchChange,
  options,
  selectedIds,
  onToggle,
  isLoading = false,
  placeholder = "Buscar por nome ou ID",
  mode = "checkbox",
}: EntitySearchListProps) {
  const selectedIdsArray = Array.isArray(selectedIds)
    ? selectedIds
    : [selectedIds];
  const selectedCount = Array.isArray(selectedIds)
    ? selectedIds.length
    : selectedIds
      ? 1
      : 0;

  return (
    <div className="field operation-picker-field">
      <label htmlFor={`search-${label}`}>{label}</label>
      <div className="operation-picker">
        <input
          id={`search-${label}`}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
        />
        <div
          className="operation-dropdown"
          role="listbox"
          onMouseDown={(event) => event.preventDefault()}
        >
          {isLoading && <p className="operation-hint">Carregando...</p>}

          {!isLoading &&
            options.map((option) => {
              const isChecked = selectedIdsArray.includes(option.id);

              return (
                <label
                  key={option.id}
                  className="operation-option"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onToggle(option.id);
                  }}
                >
                  <input
                    type={mode === "radio" ? "radio" : "checkbox"}
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

          {!isLoading && options.length === 0 && (
            <p className="operation-hint">
              Nenhum item encontrado para a busca.
            </p>
          )}
        </div>
      </div>
      <p className="operation-selected">
        {selectedCount} item(ns) selecionado(s)
      </p>
    </div>
  );
}
