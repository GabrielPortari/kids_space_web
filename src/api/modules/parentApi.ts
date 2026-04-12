import { apiRequest } from "../client";
import type { Parent } from "../../domain/entities";
import { getList, toQueryString } from "./utils";

export type CreateParentPayload = {
  name: string;
  document?: string;
  email?: string;
  contact?: string;
  birthDate?: string;
  address?: Record<string, unknown>;
  companyId?: string;
  children?: string[];
};

export async function listParents(companyId?: string) {
  return getList<Parent>(`/v2/parents${toQueryString({ companyId })}`);
}

export async function createParent(payload: CreateParentPayload) {
  return apiRequest<Parent>("/v2/parents", {
    method: "POST",
    body: payload,
  });
}

export async function updateParent(
  parentId: string,
  payload: Partial<CreateParentPayload>,
) {
  return apiRequest<Parent>(`/v2/parents/${parentId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteParent(parentId: string) {
  return apiRequest<void>(`/v2/parents/${parentId}`, {
    method: "DELETE",
  });
}

export async function assignChildrenToParent(
  parentId: string,
  children: string[],
) {
  return apiRequest<void>(`/v2/parents/${parentId}/children`, {
    method: "POST",
    body: { children },
  });
}
