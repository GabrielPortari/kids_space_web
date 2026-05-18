import { useState, useRef, useEffect } from "react";
import { SkeletonBlock } from "./WorkspaceSkeleton";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIdsArray = Array.isArray(selectedIds)
    ? selectedIds
    : [selectedIds];

  // Get all selected items (useful for checkbox mode)
  const selectedItems = selectedIdsArray
    .map((id) => options.find((opt) => opt.id === id))
    .filter(Boolean) as { id: string; name: string }[];

  // Get the first selected item (useful for radio mode)
  const selectedItem = selectedItems.length > 0 ? selectedItems[0] : null;

  // Determine what to display in the input field
  const displayValue =
    mode === "radio" && selectedItem && !searchValue
      ? selectedItem.name
      : searchValue;

  // Handle remove chip
  const handleRemoveChip = (
    event: React.MouseEvent<HTMLButtonElement>,
    chipId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onToggle(chipId);
  };

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onSearchChange(value);
    if (mode !== "checkbox") {
      setIsDropdownOpen(value.length > 0 || !selectedItem);
    }
  };

  // Handle clear button click
  const handleClear = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (selectedIdsArray.length > 0) {
      onToggle(selectedIdsArray[0]);
    }
    onSearchChange("");
    setIsDropdownOpen(true);
    inputRef.current?.focus();
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (mode === "checkbox") {
      return; // In checkbox mode, dropdown is always visible
    }
    setIsDropdownOpen(true);
  };

  // Handle input blur
  const handleInputBlur = (event: React.FocusEvent) => {
    // In checkbox mode, keep dropdown visible on blur (original behavior)
    if (mode === "checkbox") {
      return;
    }
    // In radio mode, close dropdown when blurring
    setTimeout(() => {
      if (event.relatedTarget === null) {
        setIsDropdownOpen(false);
      }
    }, 100);
  };

  // Handle option selection
  const handleOptionClick = (optionId: string) => {
    onToggle(optionId);
    if (mode === "radio") {
      onSearchChange("");
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside (only in radio mode)
  useEffect(() => {
    if (mode === "checkbox") {
      return; // In checkbox mode, dropdown stays open
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mode]);

  // Determine if dropdown should be visible
  const shouldShowDropdown = mode === "checkbox" ? true : isDropdownOpen;

  return (
    <div className="field operation-picker-field">
      <label htmlFor={`search-${label}`}>{label}</label>

      {mode === "checkbox" && selectedItems.length > 0 && (
        <div className="operation-chips-container">
          {selectedItems.map((item) => (
            <div key={item.id} className="operation-chip">
              <span>{item.name}</span>
              <button
                type="button"
                className="operation-chip-remove"
                onClick={(e) => handleRemoveChip(e, item.id)}
                title={`Remover ${item.name}`}
                aria-label={`Remover ${item.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="operation-picker">
        <div className="operation-input-wrapper">
          <input
            ref={inputRef}
            id={`search-${label}`}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            autoComplete="off"
          />
          {mode === "radio" && selectedItem && (
            <button
              type="button"
              className="operation-clear-btn"
              onClick={handleClear}
              title="Limpar seleção"
              aria-label={`Limpar ${label}`}
            >
              ✕
            </button>
          )}
        </div>
        {shouldShowDropdown && (
          <div
            className="operation-dropdown"
            role="listbox"
            onMouseDown={(event) => event.preventDefault()}
          >
            {isLoading ? (
              <div className="workspace-skeleton-dropdown">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`entity-skeleton-${index}`}
                    className="operation-option workspace-skeleton-dropdown-item"
                  >
                    <SkeletonBlock
                      className="workspace-skeleton-pill"
                      width="1rem"
                      height="1rem"
                    />
                    <div className="workspace-skeleton-dropdown-copy">
                      <SkeletonBlock width="58%" height="0.9rem" />
                      <SkeletonBlock width="36%" height="0.7rem" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {options.map((option) => {
                  const isChecked = selectedIdsArray.includes(option.id);

                  return (
                    <label
                      key={option.id}
                      className="operation-option"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleOptionClick(option.id);
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

                {options.length === 0 && (
                  <p className="operation-hint">
                    Nenhum item encontrado para a busca.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
