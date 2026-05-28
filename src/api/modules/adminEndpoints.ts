import type {
  Attendance,
  Child,
  Collaborator,
  Parent,
} from "../../domain/entities";

export const ADMIN_V2_ENDPOINTS = {
  bootstrapMaster: "/v2/admins/bootstrap/master",
  admins: "/v2/admins",
  adminById: (adminId: string) => `/v2/admins/${adminId}`,
  companyOverview: (companyId: string) =>
    `/v2/admin-management/companies/${companyId}/overview`,
  companyCollaborators: (companyId: string) =>
    `/v2/admin-management/companies/${companyId}/collaborators`,
  companyCollaboratorById: (companyId: string, collaboratorId: string) =>
    `/v2/admin-management/companies/${companyId}/collaborators/${collaboratorId}`,
  companyParents: (companyId: string) =>
    `/v2/admin-management/companies/${companyId}/parents`,
  companyParentById: (companyId: string, parentId: string) =>
    `/v2/admin-management/companies/${companyId}/parents/${parentId}`,
  companyChildren: (companyId: string) =>
    `/v2/admin-management/companies/${companyId}/children`,
  companyChildById: (companyId: string, childId: string) =>
    `/v2/admin-management/companies/${companyId}/children/${childId}`,
  companyAttendancesCheckin: (companyId: string) =>
    `/v2/admin-management/companies/${companyId}/attendances/checkin`,
  companyAttendanceById: (companyId: string, attendanceId: string) =>
    `/v2/admin-management/companies/${companyId}/attendances/${attendanceId}`,
  allCollaborators: "/v2/admin-management/all/collaborators",
  allParents: "/v2/admin-management/all/parents",
  allChildren: "/v2/admin-management/all/children",
  allAttendances: "/v2/admin-management/all/attendances",
  collaboratorPassword: (collaboratorId: string) =>
    `/v2/admin-management/collaborators/${collaboratorId}/password`,
} as const;

export type AdminUserType = "admin" | "master";

export type AdminAddressPayload = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode?: string;
  country?: string;
};

export type AdminRecord = {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  userType: AdminUserType;
  name: string;
  email: string;
  document?: string;
  contact?: string;
  address?: AdminAddressPayload;
  active: boolean;
};

export type CreateAdminDto = {
  name: string;
  email: string;
  document?: string;
  contact?: string;
  address?: AdminAddressPayload;
  active?: boolean;
};

export type UpdateAdminDto = Partial<CreateAdminDto>;

export type FindAdminsQueryDto = {
  name?: string;
  email?: string;
  document?: string;
  active?: boolean;
};

export type BootstrapAdminPayload = CreateAdminDto & {
  bootstrapKey: string;
};

export type AdminManagedEntityBase = {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  userType?: string;
  companyId?: string;
  name?: string;
  birthDate?: string;
  document?: string;
  address?: AdminAddressPayload;
  email?: string;
  contact?: string;
};

export type CreateCollaboratorAdminDto = {
  name: string;
  email: string;
  document?: string;
  contact?: string;
  birthDate?: string;
  address?: AdminAddressPayload;
  companyId?: string;
};

export type UpdateCollaboratorAdminDto = Partial<CreateCollaboratorAdminDto>;

export type CreateParentAdminDto = {
  name: string;
  document?: string;
  email?: string;
  contact?: string;
  birthDate?: string;
  address?: AdminAddressPayload;
  children?: string[];
  companyId?: string;
};

export type UpdateParentAdminDto = Partial<CreateParentAdminDto>;

export type HealthInfoPayload = {
  dietaryRestrictions?: string[];
  allergies?: string[];
  medications?: Array<{
    name: string;
    dosage?: string;
    schedule?: string;
  }>;
  medicalConditions?: string[];
  fearsOrSensitivities?: string[];
};

export type CreateChildAdminDto = {
  name: string;
  parents?: string[];
  document?: string;
  address?: AdminAddressPayload;
  email?: string;
  contact?: string;
  healthInfo?: HealthInfoPayload;
  birthDate?: string;
  companyId?: string;
};

export type UpdateChildAdminDto = Partial<CreateChildAdminDto>;

export type CreateAttendanceAdminDto = {
  childId: string;
  responsibleIdWhoCheckedInId?: string;
  notes?: string;
  companyId?: string;
};

export type UpdateAttendanceAdminDto = Partial<CreateAttendanceAdminDto>;

export type ChangeCollaboratorPasswordDto = {
  newPassword: string;
};

export type AdminCompanyOverview = {
  companyId: string;
  collaborators: Collaborator[];
  parents: Parent[];
  children: Child[];
  attendances: Attendance[];
};

export type CollaboratorPasswordChangeResponse = {
  message: string;
};
