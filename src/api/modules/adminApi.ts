import type {
  Attendance,
  Child,
  Collaborator,
  Parent,
} from "../../domain/entities";
import { apiRequest } from "../client";
import { getList, toQueryString } from "./utils";
import {
  ADMIN_V2_ENDPOINTS,
  type AdminRecord,
  type BootstrapAdminPayload,
  type ChangeCollaboratorPasswordDto,
  type CreateAdminDto,
  type CreateAttendanceAdminDto,
  type CreateChildAdminDto,
  type CreateCollaboratorAdminDto,
  type CreateParentAdminDto,
  type FindAdminsQueryDto,
  type UpdateAdminDto,
  type UpdateAttendanceAdminDto,
  type UpdateChildAdminDto,
  type UpdateCollaboratorAdminDto,
  type UpdateParentAdminDto,
  type CollaboratorPasswordChangeResponse,
} from "./adminEndpoints";


export async function bootstrapAdmin(payload: BootstrapAdminPayload) {
  const { bootstrapKey, ...body } = payload;

  return apiRequest<AdminRecord>(ADMIN_V2_ENDPOINTS.bootstrapMaster, {
    method: "POST",
    skipAuth: true,
    headers: {
      "x-bootstrap-key": bootstrapKey,
    },
    body,
  });
}

export async function createAdmin(payload: CreateAdminDto) {
  return apiRequest<AdminRecord>(ADMIN_V2_ENDPOINTS.admins, {
    method: "POST",
    body: payload,
  });
}

export async function listAdmins(query: FindAdminsQueryDto = {}) {
  return getList<AdminRecord>(
    `${ADMIN_V2_ENDPOINTS.admins}${toQueryString(query)}`,
  );
}

export async function getAdmin(adminId: string) {
  return apiRequest<AdminRecord>(ADMIN_V2_ENDPOINTS.adminById(adminId), {
    method: "GET",
  });
}

export async function updateAdmin(adminId: string, payload: UpdateAdminDto) {
  return apiRequest<AdminRecord>(ADMIN_V2_ENDPOINTS.adminById(adminId), {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteAdmin(adminId: string) {
  return apiRequest<void>(ADMIN_V2_ENDPOINTS.adminById(adminId), {
    method: "DELETE",
  });
}

export async function listCollaboratorsAdmin(companyId?: string) {
  if (companyId) {
    return getList<Collaborator>(ADMIN_V2_ENDPOINTS.companyCollaborators(companyId));
  }
  return getList<Collaborator>(ADMIN_V2_ENDPOINTS.allCollaborators);
}

export async function listParentsAdmin(companyId?: string) {
  if (companyId) {
    return getList<Parent>(ADMIN_V2_ENDPOINTS.companyParents(companyId));
  }
  return getList<Parent>(ADMIN_V2_ENDPOINTS.allParents);
}

export async function listChildrenAdmin(companyId?: string) {
  if (companyId) {
    return getList<Child>(ADMIN_V2_ENDPOINTS.companyChildren(companyId));
  }
  return getList<Child>(ADMIN_V2_ENDPOINTS.allChildren);
}

export async function listAttendancesAdmin(companyId?: string) {
  if (companyId) {
    return getList<Attendance>(ADMIN_V2_ENDPOINTS.companyAttendances(companyId));
  }
  return getList<Attendance>(ADMIN_V2_ENDPOINTS.allAttendances);
}

export async function createCollaboratorAdmin(
  companyId: string,
  payload: CreateCollaboratorAdminDto,
) {
  return apiRequest<Collaborator>(
    ADMIN_V2_ENDPOINTS.companyCollaborators(companyId),
    {
      method: "POST",
      body: {
        ...payload,
        companyId,
      },
    },
  );
}

export async function updateCollaboratorAdmin(
  companyId: string,
  collaboratorId: string,
  payload: UpdateCollaboratorAdminDto,
) {
  return apiRequest<Collaborator>(
    ADMIN_V2_ENDPOINTS.companyCollaboratorById(companyId, collaboratorId),
    {
      method: "PATCH",
      body: {
        ...payload,
        companyId,
      },
    },
  );
}

export async function deleteCollaboratorAdmin(
  companyId: string,
  collaboratorId: string,
) {
  return apiRequest<void>(
    ADMIN_V2_ENDPOINTS.companyCollaboratorById(companyId, collaboratorId),
    {
      method: "DELETE",
    },
  );
}

export async function createParentAdmin(
  companyId: string,
  payload: CreateParentAdminDto,
) {
  return apiRequest<Parent>(ADMIN_V2_ENDPOINTS.companyParents(companyId), {
    method: "POST",
    body: {
      ...payload,
      companyId,
    },
  });
}

export async function updateParentAdmin(
  companyId: string,
  parentId: string,
  payload: UpdateParentAdminDto,
) {
  return apiRequest<Parent>(
    ADMIN_V2_ENDPOINTS.companyParentById(companyId, parentId),
    {
      method: "PATCH",
      body: {
        ...payload,
        companyId,
      },
    },
  );
}

export async function deleteParentAdmin(companyId: string, parentId: string) {
  return apiRequest<void>(
    ADMIN_V2_ENDPOINTS.companyParentById(companyId, parentId),
    {
      method: "DELETE",
    },
  );
}

export async function createChildAdmin(
  companyId: string,
  payload: CreateChildAdminDto,
) {
  return apiRequest<Child>(ADMIN_V2_ENDPOINTS.companyChildren(companyId), {
    method: "POST",
    body: {
      ...payload,
      companyId,
    },
  });
}

export async function updateChildAdmin(
  companyId: string,
  childId: string,
  payload: UpdateChildAdminDto,
) {
  return apiRequest<Child>(
    ADMIN_V2_ENDPOINTS.companyChildById(companyId, childId),
    {
      method: "PATCH",
      body: {
        ...payload,
        companyId,
      },
    },
  );
}

export async function deleteChildAdmin(companyId: string, childId: string) {
  return apiRequest<void>(
    ADMIN_V2_ENDPOINTS.companyChildById(companyId, childId),
    {
      method: "DELETE",
    },
  );
}

export async function createAttendanceAdmin(
  companyId: string,
  payload: CreateAttendanceAdminDto,
) {
  return apiRequest<Attendance>(
    ADMIN_V2_ENDPOINTS.companyAttendancesCheckin(companyId),
    {
      method: "POST",
      body: {
        ...payload,
        companyId,
      },
    },
  );
}

export async function updateAttendanceAdmin(
  companyId: string,
  attendanceId: string,
  payload: UpdateAttendanceAdminDto,
) {
  return apiRequest<Attendance>(
    ADMIN_V2_ENDPOINTS.companyAttendanceById(companyId, attendanceId),
    {
      method: "PATCH",
      body: {
        ...payload,
        companyId,
      },
    },
  );
}

export async function deleteAttendanceAdmin(
  companyId: string,
  attendanceId: string,
) {
  return apiRequest<void>(
    ADMIN_V2_ENDPOINTS.companyAttendanceById(companyId, attendanceId),
    {
      method: "DELETE",
    },
  );
}

export async function changeCollaboratorPassword(
  collaboratorId: string,
  payload: ChangeCollaboratorPasswordDto,
) {
  return apiRequest<CollaboratorPasswordChangeResponse>(
    ADMIN_V2_ENDPOINTS.collaboratorPassword(collaboratorId),
    {
      method: "PATCH",
      body: payload,
    },
  );
}
