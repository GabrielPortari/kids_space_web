import { useState, useRef, useEffect } from "react";
import { SkeletonBlock } from "./WorkspaceSkeleton";

function getFirstNameInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "?";
  }

  return trimmed.split(/\s+/)[0]?.[0]?.toUpperCase() || "?";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle
        cx="9"
        cy="9"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M13.2 13.2L17 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 10" aria-hidden="true" focusable="false">
      <path
        d="M1 5.2L4.2 8.4L11 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle
        cx="10"
        cy="10"
        r="6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.9"
      />
      <path
        d="M10 7.2V10.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="13.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

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
  disabled?: boolean;
};

export function EntitySearchList({
  label,
  searchValue,
  onSearchChange,
  options,
  selectedIds,
  onToggle,
  isLoading = false,
  placeholder = "Buscar por nome",
  mode = "checkbox",
  disabled = false,
}: EntitySearchListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressNextBlurCloseRef = useRef(false);

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
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onToggle(chipId);
  };

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    const value = event.target.value;
    onSearchChange(value);
    if (mode !== "checkbox") {
      setIsDropdownOpen(value.length > 0 || !selectedItem);
    }
  };

  // Handle clear button click
  const handleClear = (event: React.MouseEvent) => {
    if (disabled) {
      return;
    }

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
    if (disabled) {
      return;
    }

    setIsDropdownOpen(true);
  };

  // Handle input blur
  const handleInputBlur = (event: React.FocusEvent) => {
    if (disabled) {
      return;
    }

    if (mode === "checkbox" && suppressNextBlurCloseRef.current) {
      suppressNextBlurCloseRef.current = false;
      return;
    }

    setTimeout(() => {
      if (event.relatedTarget === null) {
        setIsDropdownOpen(false);
      }
    }, 100);
  };

  // Handle option selection
  const handleOptionClick = (optionId: string) => {
    if (disabled) {
      return;
    }

    onToggle(optionId);
    if (mode === "checkbox") {
      suppressNextBlurCloseRef.current = true;
      setIsDropdownOpen(true);
      inputRef.current?.focus();
      window.setTimeout(() => {
        suppressNextBlurCloseRef.current = false;
      }, 0);
    }
    if (mode === "radio") {
      onSearchChange("");
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside in radio mode.
  useEffect(() => {
    if (disabled) {
      return;
    }

    if (mode === "checkbox") {
      return;
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
  }, [disabled, mode]);

  // Determine if dropdown should be visible
  const shouldShowDropdown = isDropdownOpen;

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
          <span className="operation-input-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            id={`search-${label}`}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            autoComplete="off"
            disabled={disabled}
          />
          {mode === "radio" && selectedItem && (
            <button
              type="button"
              className="operation-clear-btn"
              onClick={handleClear}
              title="Limpar seleção"
              aria-label={`Limpar ${label}`}
              disabled={disabled}
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
                  const optionInitial = getFirstNameInitial(option.name);

                  return (
                    <label
                      key={option.id}
                      className={`operation-option${isChecked ? " is-selected" : ""}`}
                      data-id={option.id}
                      data-selected={isChecked ? "true" : "false"}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleOptionClick(option.id);
                      }}
                    >
                      <span
                        className="operation-option-check"
                        aria-hidden="true"
                      >
                        {isChecked && <CheckIcon />}
                      </span>
                      <span
                        className="operation-option-avatar"
                        aria-hidden="true"
                      >
                        {optionInitial}
                      </span>
                      <span className="operation-option-copy">
                        <strong>{option.name}</strong>
                      </span>
                    </label>
                  );
                })}

                {options.length === 0 && (
                  <div className="operation-empty-state" aria-live="polite">
                    <EmptyStateIcon />
                    <p>Nenhuma criança encontrada</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
