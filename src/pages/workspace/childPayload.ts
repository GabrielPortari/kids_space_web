import { buildBackendAddressPayload } from "../../api/address";
import type { ChildFormState } from "./types";
import type { CreateChildPayload } from "../../api/modules/childApi";
import type { ListItem } from "./types";
import {
  extractId,
  formatMedicationSchedule,
  normalizeDigits,
  parseIdList,
  toParentFormState,
} from "./formatter";

function sanitizeList(values: string[]): string[] {
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function buildHealthInfoPayload(
  healthInfo: ChildFormState["healthInfo"],
): NonNullable<CreateChildPayload["healthInfo"]> {
  const medications = healthInfo.medications
    .map((medication) => ({
      name: medication.name.trim(),
      dosage: medication.dosage.trim(),
      schedule: formatMedicationSchedule(medication.schedule.trim()),
    }))
    .filter(
      (medication) =>
        medication.name || medication.dosage || medication.schedule,
    )
    .map((medication) => ({
      name: medication.name,
      dosage: medication.dosage || undefined,
      schedule: medication.schedule || undefined,
    }));

  return {
    dietaryRestrictions: sanitizeList(healthInfo.dietaryRestrictions),
    allergies: sanitizeList(healthInfo.allergies),
    medications,
    medicalConditions: sanitizeList(healthInfo.medicalConditions),
    fearsOrSensitivities: sanitizeList(healthInfo.fearsOrSensitivities),
  };
}

export function buildCreateChildPayload({
  childForm,
  parents,
  currentCompanyScope,
}: {
  childForm: ChildFormState;
  parents: ListItem[];
  currentCompanyScope?: string;
}): CreateChildPayload {
  const name = childForm.name.trim();
  const document = normalizeDigits(childForm.document).slice(0, 11);
  const email = childForm.email.trim();
  const contact = normalizeDigits(childForm.contact).slice(0, 11);
  const birthDate = childForm.birthDate.trim();
  const selectedParentIds = parseIdList(childForm.parents);
  const selectedParentId = selectedParentIds[0];
  const selectedParent = selectedParentId
    ? parents.find((item) => extractId(item) === selectedParentId)
    : undefined;

  const addressPayload =
    childForm.inheritParentAddress && selectedParent
      ? buildBackendAddressPayload(toParentFormState(selectedParent))
      : buildBackendAddressPayload(childForm);

  return {
    name,
    document: document || undefined,
    email: email || undefined,
    contact: contact || undefined,
    birthDate: birthDate || undefined,
    parents: selectedParentId ? [selectedParentId] : undefined,
    healthInfo: buildHealthInfoPayload(childForm.healthInfo),
    address: addressPayload,
    companyId: currentCompanyScope,
  };
}

export function sanitizeChildFormStateForPayload(childForm: ChildFormState) {
  return {
    name: childForm.name.trim(),
    document: normalizeDigits(childForm.document).slice(0, 11),
    email: childForm.email.trim(),
    contact: normalizeDigits(childForm.contact).slice(0, 11),
    birthDate: childForm.birthDate.trim(),
    healthInfo: buildHealthInfoPayload(childForm.healthInfo),
  };
}
