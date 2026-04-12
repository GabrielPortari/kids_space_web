import { apiRequest } from "../client";
import type { Collaborator } from "../../domain/entities";

export async function getMyCollaborator() {
  return apiRequest<Collaborator>("/v2/collaborators/me", {
    method: "GET",
  });
}

export async function updateMyCollaborator(payload: Partial<Collaborator>) {
  return apiRequest<Collaborator>("/v2/collaborators/me", {
    method: "PATCH",
    body: payload,
  });
}
