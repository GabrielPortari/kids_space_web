import { apiRequest } from "../client";
import type { Collaborator } from "../../domain/entities";
import { getList, toQueryString } from "./utils";

export type CreateCollaboratorPayload = {
  name: string;
  email: string;
  document?: string;
  contact?: string;
  birthDate?: string;
  companyId?: string;
};

export async function listCollaborators(companyId?: string) {
  return getList<Collaborator>(
    `/v2/collaborators${toQueryString({ companyId })}`,
  );
}

export async function createCollaborator(payload: CreateCollaboratorPayload) {
  return apiRequest<Collaborator>("/v2/collaborators", {
    method: "POST",
    body: payload,
  });
}

export async function updateCollaborator(
  collaboratorId: string,
  payload: Partial<CreateCollaboratorPayload>,
) {
  return apiRequest<Collaborator>(`/v2/collaborators/${collaboratorId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteCollaborator(collaboratorId: string) {
  return apiRequest<void>(`/v2/collaborators/${collaboratorId}`, {
    method: "DELETE",
  });
}
