import { apiRequest } from "../client";
import type { Company } from "../../domain/entities";
import { getList, toQueryString } from "./utils";

export type UpdateCompanyPayload = {
  name?: string;
  legalName?: string;
  cnpj?: string;
  contact?: string;
  email?: string;
  address?: Record<string, unknown>;
};

export async function getMyCompany() {
  return apiRequest<Company>("/v2/companies/me", {
    method: "GET",
  });
}

export async function updateMyCompany(payload: UpdateCompanyPayload) {
  return apiRequest<Company>("/v2/companies/me", {
    method: "PATCH",
    body: payload,
  });
}

export async function listCompanies(companyId?: string) {
  return getList<Company>(`/v2/companies${toQueryString({ companyId })}`);
}

export async function createCompany(payload: Record<string, unknown>) {
  return apiRequest<Company>("/v2/companies", {
    method: "POST",
    body: payload,
  });
}

export async function updateCompany(
  companyId: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<Company>(`/v2/companies/${companyId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteCompany(companyId: string) {
  return apiRequest<void>(`/v2/companies/${companyId}`, {
    method: "DELETE",
  });
}
