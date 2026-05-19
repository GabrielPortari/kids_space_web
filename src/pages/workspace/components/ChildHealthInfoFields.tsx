import type {
  ChildHealthInfoFormState,
  ChildMedicationFormState,
} from "../types";

type ChildHealthInfoFieldsProps = {
  value: ChildHealthInfoFormState;
  onChange: (
    key: keyof Omit<ChildHealthInfoFormState, "medications">,
    value: string,
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
  return (
    <section className="profile-section child-health-section">
      <h3>Saude</h3>

      <div className="child-health-grid">
        <div className="field field-full">
          <label htmlFor="child-health-dietaryRestrictions">
            Restricoes alimentares
          </label>
          <textarea
            id="child-health-dietaryRestrictions"
            className="checkin-notes-field child-health-textarea"
            value={value.dietaryRestrictions}
            onChange={(event) =>
              onChange("dietaryRestrictions", event.target.value)
            }
            disabled={disabled}
            placeholder="Uma restricao por linha"
            rows={3}
          />
        </div>

        <div className="field field-full">
          <label htmlFor="child-health-allergies">Alergias</label>
          <textarea
            id="child-health-allergies"
            className="checkin-notes-field child-health-textarea"
            value={value.allergies}
            onChange={(event) => onChange("allergies", event.target.value)}
            disabled={disabled}
            placeholder="Uma alergia por linha"
            rows={3}
          />
        </div>

        <div className="field field-full">
          <label htmlFor="child-health-medicalConditions">
            Condicoes medicas
          </label>
          <textarea
            id="child-health-medicalConditions"
            className="checkin-notes-field child-health-textarea"
            value={value.medicalConditions}
            onChange={(event) =>
              onChange("medicalConditions", event.target.value)
            }
            disabled={disabled}
            placeholder="Uma condicao por linha"
            rows={3}
          />
        </div>

        <div className="field field-full">
          <label htmlFor="child-health-fearsOrSensitivities">
            Medos ou sensibilidades
          </label>
          <textarea
            id="child-health-fearsOrSensitivities"
            className="checkin-notes-field child-health-textarea"
            value={value.fearsOrSensitivities}
            onChange={(event) =>
              onChange("fearsOrSensitivities", event.target.value)
            }
            disabled={disabled}
            placeholder="Um item por linha"
            rows={3}
          />
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
                  className="btn ghost"
                  onClick={() => onRemoveMedication(index)}
                  disabled={disabled || value.medications.length === 1}
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
