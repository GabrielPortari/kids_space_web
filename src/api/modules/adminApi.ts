import { apiRequest } from "../client";
import type { Collaborator, Child, Attendance } from "../../domain/entities";
import { getList, toQueryString } from "./utils";

export async function listCollaboratorsAdmin(companyId?: string) {
  return getList<Collaborator>(
    `/v2/collaborators${toQueryString({ companyId })}`,
  );
}

export async function listChildrenAdmin(companyId?: string) {
  return getList<Child>(`/v2/children${toQueryString({ companyId })}`);
}

export async function listAttendancesAdmin(companyId?: string) {
  return getList<Attendance>(`/v2/attendance${toQueryString({ companyId })}`);
}

export async function bootstrapAdmin(payload: {
  bootstrapKey: string;
  email: string;
  name: string;
  password: string;
}) {
  const endpoint = String(
    import.meta.env.VITE_BOOTSTRAP_ADMIN_PATH || "/auth/bootstrap-admin",
  );

  return apiRequest<Record<string, unknown>>(endpoint, {
    method: "POST",
    body: payload,
  });
}
