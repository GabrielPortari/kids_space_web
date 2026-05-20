import { useState } from "react";
import type {
  ChildHealthInfoFormState,
  ChildMedicationFormState,
} from "../types";

type ChildHealthInfoFieldsProps = {
  value: ChildHealthInfoFormState;
  onChange: (
    key: keyof Omit<ChildHealthInfoFormState, "medications">,
    value: string[],
  ) => void;
  onMedicationChange: (
    index: number,
    key: keyof ChildMedicationFormState,
    value: string,
  ) => void;
  onAddMedication: () => void;
  onRemoveMedication: (index: number) => void;
  disabled?: boolean;
};

function MedicationField({
  label,
  id,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ChildHealthInfoFields({
  value,
  onChange,
  onMedicationChange,
  onAddMedication,
  onRemoveMedication,
  disabled = false,
}: ChildHealthInfoFieldsProps) {
  const [dietInput, setDietInput] = useState("");
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [fearInput, setFearInput] = useState("");

  const addListItem = (
    key: keyof Omit<ChildHealthInfoFormState, "medications">,
    item: string,
  ) => {
    const next = String(item || "").trim();
    if (!next) return;

    const current = (value[key] as string[]) || [];
    onChange(key, [...current, next]);
  };

  const removeListItem = (
    key: keyof Omit<ChildHealthInfoFormState, "medications">,
    index: number,
  ) => {
    const current = (value[key] as string[]) || [];
    onChange(
      key,
      current.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="child-health-section">
      <div className="child-health-grid">
        <div className="field field-full">
          <label htmlFor="child-health-dietaryRestrictions">
            Restricoes alimentares
          </label>
          <div className="list-input-row">
            <input
              id="child-health-dietaryRestrictions"
              value={dietInput}
              onChange={(e) => setDietInput(e.target.value)}
              disabled={disabled}
              placeholder="Adicionar restricao"
            />
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                addListItem("dietaryRestrictions", dietInput);
                setDietInput("");
              }}
              disabled={disabled}
            >
              +
            </button>
          </div>

          <div className="list-items">
            {(value.dietaryRestrictions || []).map((item, index) => (
              <div key={`diet-${index}`} className="list-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="btn ghost remove-item-btn"
                  onClick={() => removeListItem("dietaryRestrictions", index)}
                  disabled={disabled}
                  title="Remover"
                  aria-label="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="field field-full">
          <label htmlFor="child-health-allergies">Alergias</label>
          <div className="list-input-row">
            <input
              id="child-health-allergies"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              disabled={disabled}
              placeholder="Adicionar alergia"
            />
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                addListItem("allergies", allergyInput);
                setAllergyInput("");
              }}
              disabled={disabled}
            >
              +
            </button>
          </div>

          <div className="list-items">
            {(value.allergies || []).map((item, index) => (
              <div key={`allergy-${index}`} className="list-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="btn ghost remove-item-btn"
                  onClick={() => removeListItem("allergies", index)}
                  disabled={disabled}
                  title="Remover"
                  aria-label="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="field field-full">
          <label htmlFor="child-health-medicalConditions">
            Condicoes medicas
          </label>
          <div className="list-input-row">
            <input
              id="child-health-medicalConditions"
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              disabled={disabled}
              placeholder="Adicionar condicao"
            />
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                addListItem("medicalConditions", conditionInput);
                setConditionInput("");
              }}
              disabled={disabled}
            >
              +
            </button>
          </div>

          <div className="list-items">
            {(value.medicalConditions || []).map((item, index) => (
              <div key={`cond-${index}`} className="list-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="btn ghost remove-item-btn"
                  onClick={() => removeListItem("medicalConditions", index)}
                  disabled={disabled}
                  title="Remover"
                  aria-label="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="field field-full">
          <label htmlFor="child-health-fearsOrSensitivities">
            Medos ou sensibilidades
          </label>
          <div className="list-input-row">
            <input
              id="child-health-fearsOrSensitivities"
              value={fearInput}
              onChange={(e) => setFearInput(e.target.value)}
              disabled={disabled}
              placeholder="Adicionar medo ou sensibilidade"
            />
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                addListItem("fearsOrSensitivities", fearInput);
                setFearInput("");
              }}
              disabled={disabled}
            >
              +
            </button>
          </div>

          <div className="list-items">
            {(value.fearsOrSensitivities || []).map((item, index) => (
              <div key={`fear-${index}`} className="list-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="btn ghost remove-item-btn"
                  onClick={() => removeListItem("fearsOrSensitivities", index)}
                  disabled={disabled}
                  title="Remover"
                  aria-label="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="child-medications-panel">
        <div className="child-medications-head">
          <h4>Medicamentos</h4>
          <button
            type="button"
            className="btn outline"
            onClick={onAddMedication}
            disabled={disabled}
          >
            Adicionar medicamento
          </button>
        </div>

        <div className="child-medications-list">
          {value.medications.map((medication, index) => (
            <article
              key={`child-medication-${index}`}
              className="child-medication-row"
            >
              <MedicationField
                label="Nome"
                id={`child-medication-name-${index}`}
                value={medication.name}
                onChange={(nextValue) =>
                  onMedicationChange(index, "name", nextValue)
                }
                disabled={disabled}
                placeholder="Ritalina"
              />

              <MedicationField
                label="Dosagem"
                id={`child-medication-dosage-${index}`}
                value={medication.dosage}
                onChange={(nextValue) =>
                  onMedicationChange(index, "dosage", nextValue)
                }
                disabled={disabled}
                placeholder="10mg"
              />

              <MedicationField
                label="Horario"
                id={`child-medication-schedule-${index}`}
                value={medication.schedule}
                onChange={(nextValue) =>
                  onMedicationChange(index, "schedule", nextValue)
                }
                disabled={disabled}
                placeholder="08:00"
              />

              <div className="child-medication-actions">
                <button
                  type="button"
                  className="btn ghost remove-item-btn"
                  onClick={() => onRemoveMedication(index)}
                  disabled={disabled || value.medications.length === 1}
                  title="Remover medicamento"
                  aria-label="Remover medicamento"
                >
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
