import type {
  CollaboratorFormState,
  ParentFormState,
  ChildFormState,
  CompanyFormState,
} from "./types";

export const PAGE_SIZE = 8;

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
