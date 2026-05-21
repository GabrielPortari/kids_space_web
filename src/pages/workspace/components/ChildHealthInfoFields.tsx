import { useState } from "react";
import { formatMedicationSchedule } from "../formatter";
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
  onAddMedication: (medication: ChildMedicationFormState) => void;
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
  onBlur,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onBlur?: () => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onBlur && onBlur()}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const MINUTES = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

function splitSchedule(value: string): { hour: string; minute: string } {
  const formatted = formatMedicationSchedule(value);
  if (!formatted) {
    return { hour: "", minute: "" };
  }

  const [hour = "", minute = ""] = formatted.split(":");
  return { hour, minute };
}

function combineSchedule(hour: string, minute: string): string {
  if (!hour || !minute) {
    return "";
  }

  return formatMedicationSchedule(`${hour}:${minute}`);
}

export function ChildHealthInfoFields({
  value,
  onChange,
  onAddMedication,
  onRemoveMedication,
  disabled = false,
}: ChildHealthInfoFieldsProps) {
  const [dietInput, setDietInput] = useState("");
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [fearInput, setFearInput] = useState("");
  const [medicationDraft, setMedicationDraft] = useState({
    name: "",
    dosage: "",
    schedule: "",
  });

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

  const medicationItems = value.medications.filter(
    (medication) =>
      medication.name.trim() ||
      medication.dosage.trim() ||
      medication.schedule.trim(),
  );

  return (
    <div className="child-health-section">
      <div className="child-health-grid">
        <div className="field field-full health-field-half">
          <label htmlFor="child-health-dietaryRestrictions">
            Restricoes alimentares
          </label>
          <div className="list-input-row">
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
            <input
              id="child-health-dietaryRestrictions"
              value={dietInput}
              onChange={(e) => setDietInput(e.target.value)}
              disabled={disabled}
              placeholder="Adicionar restricao"
            />
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

        <div className="field field-full health-field-half">
          <label htmlFor="child-health-allergies">Alergias</label>
          <div className="list-input-row">
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
            <input
              id="child-health-allergies"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              disabled={disabled}
              placeholder="Adicionar alergia"
            />
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

        <div className="field field-full health-field-half">
          <label htmlFor="child-health-medicalConditions">
            Condicoes medicas
          </label>
          <div className="list-input-row">
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
            <input
              id="child-health-medicalConditions"
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              disabled={disabled}
              placeholder="Adicionar condicao"
            />
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

        <div className="field field-full health-field-half">
          <label htmlFor="child-health-fearsOrSensitivities">
            Medos ou sensibilidades
          </label>
          <div className="list-input-row">
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
            <input
              id="child-health-fearsOrSensitivities"
              value={fearInput}
              onChange={(e) => setFearInput(e.target.value)}
              disabled={disabled}
              placeholder="Adicionar medo ou sensibilidade"
            />
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
        </div>

        <div className="child-medications-list">
          <article className="child-medication-row child-medication-row-draft">
            <MedicationField
              label="Nome"
              id="child-medication-draft-name"
              value={medicationDraft.name}
              onChange={(nextValue) =>
                setMedicationDraft((current) => ({
                  ...current,
                  name: nextValue,
                }))
              }
              disabled={disabled}
              placeholder="Ritalina"
            />

            <MedicationField
              label="Dosagem"
              id="child-medication-draft-dosage"
              value={medicationDraft.dosage}
              onChange={(nextValue) =>
                setMedicationDraft((current) => ({
                  ...current,
                  dosage: nextValue,
                }))
              }
              disabled={disabled}
              placeholder="10mg"
            />

            <div className="field">
              <label htmlFor="child-medication-draft-schedule">Horario</label>
              <div className="time-picker-grid">
                <select
                  id="child-medication-draft-schedule-hour"
                  value={splitSchedule(medicationDraft.schedule).hour}
                  onChange={(event) => {
                    const current = splitSchedule(medicationDraft.schedule);
                    const nextSchedule = combineSchedule(
                      event.target.value,
                      current.minute || "00",
                    );

                    setMedicationDraft((draft) => ({
                      ...draft,
                      schedule: nextSchedule,
                    }));
                  }}
                  disabled={disabled}
                >
                  <option value="">--</option>
                  {HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>

                <span className="time-picker-separator">:</span>

                <select
                  id="child-medication-draft-schedule-minute"
                  value={splitSchedule(medicationDraft.schedule).minute}
                  onChange={(event) => {
                    const current = splitSchedule(medicationDraft.schedule);
                    const nextSchedule = combineSchedule(
                      current.hour || "00",
                      event.target.value,
                    );

                    setMedicationDraft((draft) => ({
                      ...draft,
                      schedule: nextSchedule,
                    }));
                  }}
                  disabled={disabled}
                >
                  <option value="">--</option>
                  {MINUTES.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="child-medication-actions">
              <button
                type="button"
                className="btn outline add-item-btn"
                onClick={() => {
                  const nextMedication = {
                    name: medicationDraft.name.trim(),
                    dosage: medicationDraft.dosage.trim(),
                    schedule: formatMedicationSchedule(
                      medicationDraft.schedule.trim(),
                    ),
                  };

                  if (
                    !nextMedication.name &&
                    !nextMedication.dosage &&
                    !nextMedication.schedule
                  ) {
                    return;
                  }

                  onAddMedication(nextMedication);
                  setMedicationDraft({ name: "", dosage: "", schedule: "" });
                }}
                disabled={disabled}
                title="Adicionar medicamento"
                aria-label="Adicionar medicamento"
              >
                +
              </button>
            </div>
          </article>

          <div className="child-medications-chips">
            {medicationItems.map((medication) => {
              const originalIndex = value.medications.indexOf(medication);

              return (
                <div
                  key={`child-medication-${originalIndex}`}
                  className="list-item medication-chip"
                >
                  <span className="medication-chip-text">
                    {[medication.name, medication.dosage, medication.schedule]
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                  <button
                    type="button"
                    className="btn ghost remove-item-btn"
                    onClick={() => onRemoveMedication(originalIndex)}
                    disabled={disabled}
                    title="Remover medicamento"
                    aria-label="Remover medicamento"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
