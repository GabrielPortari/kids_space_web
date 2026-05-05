import { apiRequest } from "../client";
import type { BackendAddressPayload } from "../address";
import type { Child } from "../../domain/entities";
import { getList, toQueryString } from "./utils";

export type CreateChildPayload = {
  name: string;
  document?: string;
  email?: string;
  contact?: string;
  birthDate?: string;
  companyId?: string;
  parents?: string[];
  address?: {
    address?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    complement?: string;
  } & Pick<BackendAddressPayload, "zipcode">;
};

export async function listChildren(companyId?: string) {
  return getList<Child>(`/v2/children${toQueryString({ companyId })}`);
}

export async function createChild(payload: CreateChildPayload) {
  return apiRequest<Child>("/v2/children", {
    method: "POST",
    body: payload,
  });
}

export async function updateChild(
  childId: string,
  payload: Partial<CreateChildPayload>,
) {
  return apiRequest<Child>(`/v2/children/${childId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteChild(childId: string) {
  return apiRequest<void>(`/v2/children/${childId}`, {
    method: "DELETE",
  });
}

export async function assignParentsToChild(childId: string, parents: string[]) {
  return apiRequest<void>(`/v2/children/${childId}/parents`, {
    method: "POST",
    body: { parents },
  });
}

export async function getChildName(childId: string): Promise<string> {
  try {
    const response = await apiRequest<{ name?: string }>(
      `/v2/children/${childId}/name`,
      {
        method: "GET",
      },
    );
    return response.name || "";
  } catch {
    return "";
  }
}
