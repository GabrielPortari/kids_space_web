import type {
  AdminAddressPayload,
  CreateChildAdminDto,
  CreateCollaboratorAdminDto,
  CreateParentAdminDto,
} from "../../api/modules/adminEndpoints";
import { normalizeDigits, parseIdList } from "../workspace/formatter";

export type AdminAddressFormState = {
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
};

export function buildAdminAddressPayload(
  form: AdminAddressFormState,
): AdminAddressPayload {
  return {
    street: form.addressStreet.trim(),
    number: form.addressNumber.trim(),
    complement: form.addressComplement.trim() || undefined,
    neighborhood: form.addressDistrict.trim(),
    city: form.addressCity.trim(),
    state: form.addressState.trim(),
    zipcode: normalizeDigits(form.addressZipCode).slice(0, 8) || undefined,
    country: form.addressCountry.trim() || undefined,
  };
}

export type CollaboratorAdminFormState = AdminAddressFormState & {
  name: string;
  email: string;
  document: string;
  contact: string;
  birthDate: string;
  companyId: string;
};

export type ParentAdminFormState = AdminAddressFormState & {
  name: string;
  email: string;
  document: string;
  contact: string;
  birthDate: string;
  children: string;
  companyId: string;
};

export type ChildAdminFormState = AdminAddressFormState & {
  name: string;
  email: string;
  document: string;
  contact: string;
  birthDate: string;
  parents: string;
  companyId: string;
  healthInfo: {
    dietaryRestrictions: string[];
    allergies: string[];
    medications: Array<{ name: string; dosage: string; schedule: string }>;
    medicalConditions: string[];
    fearsOrSensitivities: string[];
  };
};

export function buildCollaboratorAdminPayload(
  form: CollaboratorAdminFormState,
): CreateCollaboratorAdminDto {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    document: normalizeDigits(form.document).slice(0, 14) || undefined,
    contact: normalizeDigits(form.contact).slice(0, 11) || undefined,
    birthDate: form.birthDate.trim() || undefined,
    address: buildAdminAddressPayload(form),
    companyId: form.companyId.trim() || undefined,
  };
}

export function buildParentAdminPayload(
  form: ParentAdminFormState,
): CreateParentAdminDto {
  const children = parseIdList(form.children);

  return {
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    document: normalizeDigits(form.document).slice(0, 11) || undefined,
    contact: normalizeDigits(form.contact).slice(0, 11) || undefined,
    birthDate: form.birthDate.trim() || undefined,
    address: buildAdminAddressPayload(form),
    children: children.length > 0 ? children : undefined,
    companyId: form.companyId.trim() || undefined,
  };
}

export function buildChildAdminPayload(
  form: ChildAdminFormState,
): CreateChildAdminDto {
  const parents = parseIdList(form.parents);

  return {
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    document: normalizeDigits(form.document).slice(0, 11) || undefined,
    contact: normalizeDigits(form.contact).slice(0, 11) || undefined,
    birthDate: form.birthDate.trim() || undefined,
    address: buildAdminAddressPayload(form),
    parents: parents.length > 0 ? parents : undefined,
    companyId: form.companyId.trim() || undefined,
    healthInfo: {
      dietaryRestrictions: form.healthInfo.dietaryRestrictions,
      allergies: form.healthInfo.allergies,
      medications: form.healthInfo.medications
        .map((item) => ({
          name: item.name.trim(),
          dosage: item.dosage.trim() || undefined,
          schedule: item.schedule.trim() || undefined,
        }))
        .filter((item) => item.name || item.dosage || item.schedule),
      medicalConditions: form.healthInfo.medicalConditions,
      fearsOrSensitivities: form.healthInfo.fearsOrSensitivities,
    },
  };
}
