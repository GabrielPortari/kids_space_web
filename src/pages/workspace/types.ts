export type CrmSection =
  | "profile"
  | "companies"
  | "collaborators"
  | "parents"
  | "children"
  | "links"
  | "attendance"
  | "master-bootstrap";

export type ListItem = {
  id?: string;
  name?: string;
  email?: string;
  document?: string;
  companyId?: string;
  [key: string]: unknown;
};

export type ProfileFieldConfig = {
  key: string;
  label: string;
  editable: boolean;
  value: string;
};

export type ParentFormState = {
  name: string;
  document: string;
  email: string;
  contact: string;
  birthDate: string;
  children: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressComplement: string;
  addressCountry: string;
};

export type CollaboratorFormState = {
  name: string;
  email: string;
  document: string;
  contact: string;
  birthDate: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressComplement: string;
  addressCountry: string;
};

export type ChildFormState = {
  name: string;
  document: string;
  email: string;
  contact: string;
  birthDate: string;
  parents: string;
  inheritParentAddress: boolean;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressComplement: string;
  addressCountry: string;
};

export type CompanyFormState = {
  name: string;
  legalName: string;
  cnpj: string;
  contact: string;
  email: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressComplement: string;
  addressCountry: string;
};
