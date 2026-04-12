export type Identifier = {
  id: string;
};

export type Company = Identifier & {
  name?: string;
  legalName?: string;
  cnpj?: string;
  email?: string;
  contact?: string;
  [key: string]: unknown;
};

export type Collaborator = Identifier & {
  name?: string;
  email?: string;
  document?: string;
  contact?: string;
  birthDate?: string;
  companyId?: string;
  [key: string]: unknown;
};

export type Parent = Identifier & {
  name?: string;
  email?: string;
  document?: string;
  contact?: string;
  birthDate?: string;
  companyId?: string;
  children?: string[];
  [key: string]: unknown;
};

export type Child = Identifier & {
  name?: string;
  email?: string;
  document?: string;
  contact?: string;
  birthDate?: string;
  companyId?: string;
  parents?: string[];
  [key: string]: unknown;
};

export type Attendance = Identifier & {
  childId?: string;
  responsibleDocument?: string;
  responsibleIdWhoCheckedInId?: string;
  notes?: string;
  companyId?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  [key: string]: unknown;
};

export type PaginatedState = {
  page: number;
  pageSize: number;
  search: string;
};
