import { buildBackendAddressPayload } from "../../api/address";
import type { UpdateCompanyPayload } from "../../api/modules/companyApi";
import type { CreateCollaboratorPayload } from "../../api/modules/collaboratorApi";
import type { CreateParentPayload } from "../../api/modules/parentApi";
import type {
  CollaboratorFormState,
  CompanyFormState,
  ParentFormState,
} from "./types";
import { normalizeDigits, parseIdList } from "./formatter";

function sanitizeText(value: string): string {
  return String(value || "").trim();
}

function sanitizeDigits(value: string, maxLength: number): string {
  return normalizeDigits(value).slice(0, maxLength);
}

function mapAddressDraft(draft: {
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressComplement: string;
  addressCountry: string;
}) {
  return buildBackendAddressPayload(draft);
}

export function buildCompanyPayload(
  companyForm: CompanyFormState,
): Record<string, unknown> {
  const name = sanitizeText(companyForm.name);
  const legalName = sanitizeText(companyForm.legalName);
  const cnpj = sanitizeDigits(companyForm.cnpj, 14);
  const contact = sanitizeDigits(companyForm.contact, 11);
  const email = sanitizeText(companyForm.email);

  return {
    name,
    legalName: legalName || undefined,
    cnpj: cnpj || undefined,
    contact: contact || undefined,
    email: email || undefined,
    address: mapAddressDraft(companyForm),
  };
}

export function buildCompanyProfilePayload(
  profileDraft: Record<string, string>,
): UpdateCompanyPayload {
  const email = sanitizeText(profileDraft.email);

  return {
    name: sanitizeText(profileDraft.name),
    legalName: sanitizeText(profileDraft.legalName) || undefined,
    contact: sanitizeDigits(profileDraft.contact || "", 11) || undefined,
    email: email || undefined,
    logoUrl: sanitizeText(profileDraft.logoUrl) || undefined,
    website: sanitizeText(profileDraft.website) || undefined,
    address: buildBackendAddressPayload({
      addressStreet: profileDraft["address.street"] || "",
      addressNumber: profileDraft["address.number"] || "",
      addressDistrict: profileDraft["address.neighborhood"] || "",
      addressCity: profileDraft["address.city"] || "",
      addressState: profileDraft["address.state"] || "",
      addressZipCode: profileDraft["address.zipCode"] || "",
      addressComplement: profileDraft["address.complement"] || "",
      addressCountry: profileDraft["address.country"] || "",
    }),
  };
}

export function buildCollaboratorPayload(
  collaboratorForm: CollaboratorFormState,
  companyId?: string,
): CreateCollaboratorPayload {
  const name = sanitizeText(collaboratorForm.name);
  const email = sanitizeText(collaboratorForm.email);
  const document = sanitizeDigits(collaboratorForm.document, 14);
  const contact = sanitizeDigits(collaboratorForm.contact, 11);
  const birthDate = sanitizeText(collaboratorForm.birthDate);

  return {
    name,
    email,
    document: document || undefined,
    contact: contact || undefined,
    birthDate: birthDate || undefined,
    address: mapAddressDraft(collaboratorForm),
    companyId,
  };
}

export function buildCollaboratorProfilePayload(
  profileDraft: Record<string, string>,
): Partial<CreateCollaboratorPayload> {
  return {
    name: sanitizeText(profileDraft.name) || undefined,
    contact: sanitizeDigits(profileDraft.contact || "", 11) || undefined,
    address: buildBackendAddressPayload({
      addressStreet: profileDraft["address.street"] || "",
      addressNumber: profileDraft["address.number"] || "",
      addressDistrict: profileDraft["address.neighborhood"] || "",
      addressCity: profileDraft["address.city"] || "",
      addressState: profileDraft["address.state"] || "",
      addressZipCode: profileDraft["address.zipCode"] || "",
      addressComplement: profileDraft["address.complement"] || "",
      addressCountry: profileDraft["address.country"] || "",
    }),
  };
}

export function buildParentPayload(
  parentForm: ParentFormState,
  companyId?: string,
): CreateParentPayload {
  const name = sanitizeText(parentForm.name);
  const document = sanitizeDigits(parentForm.document, 11);
  const email = sanitizeText(parentForm.email);
  const contact = sanitizeDigits(parentForm.contact, 11);
  const birthDate = sanitizeText(parentForm.birthDate);
  const children = parseIdList(parentForm.children);

  return {
    name,
    document: document || undefined,
    email: email || undefined,
    contact: contact || undefined,
    birthDate: birthDate || undefined,
    address: mapAddressDraft(parentForm),
    companyId,
    children: children.length > 0 ? children : undefined,
  };
}

export function buildParentProfilePayload(
  profileDraft: Record<string, string>,
): Partial<CreateParentPayload> {
  return {
    name: sanitizeText(profileDraft.name) || undefined,
    contact: sanitizeDigits(profileDraft.contact || "", 11) || undefined,
    address: buildBackendAddressPayload({
      addressStreet: profileDraft["address.street"] || "",
      addressNumber: profileDraft["address.number"] || "",
      addressDistrict: profileDraft["address.neighborhood"] || "",
      addressCity: profileDraft["address.city"] || "",
      addressState: profileDraft["address.state"] || "",
      addressZipCode: profileDraft["address.zipCode"] || "",
      addressComplement: profileDraft["address.complement"] || "",
      addressCountry: profileDraft["address.country"] || "",
    }),
  };
}
