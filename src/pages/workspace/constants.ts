import type {
  CollaboratorFormState,
  ParentFormState,
  ChildFormState,
  CompanyFormState,
} from "./types";

export const PAGE_SIZE = 8;

// Bump this when the consent terms shown to guardians change, so past
// acceptances remain tied to the version they actually agreed to.
export const CHILD_CONSENT_TERMS_VERSION = "1.0";

export const INITIAL_COLLABORATOR_FORM: CollaboratorFormState = {
  name: "",
  email: "",
  document: "",
  contact: "",
  birthDate: "",
  addressStreet: "",
  addressNumber: "",
  addressDistrict: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
  addressComplement: "",
  addressCountry: "",
};

export const INITIAL_PARENT_FORM: ParentFormState = {
  name: "",
  document: "",
  email: "",
  contact: "",
  birthDate: "",
  children: "",
  addressStreet: "",
  addressNumber: "",
  addressDistrict: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
  addressComplement: "",
  addressCountry: "",
};

export const INITIAL_CHILD_FORM: ChildFormState = {
  name: "",
  document: "",
  email: "",
  contact: "",
  birthDate: "",
  parents: "",
  inheritParentAddress: false,
  healthInfo: {
    dietaryRestrictions: [],
    allergies: [],
    medications: [],
    medicalConditions: [],
    fearsOrSensitivities: [],
  },
  consentAccepted: false,
  consentAcceptedByName: "",
  addressStreet: "",
  addressNumber: "",
  addressDistrict: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
  addressComplement: "",
  addressCountry: "",
};

export const INITIAL_COMPANY_FORM: CompanyFormState = {
  name: "",
  legalName: "",
  cnpj: "",
  contact: "",
  email: "",
  addressStreet: "",
  addressNumber: "",
  addressDistrict: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
  addressComplement: "",
  addressCountry: "",
};
