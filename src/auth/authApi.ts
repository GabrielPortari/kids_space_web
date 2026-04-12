import type { AuthRole } from "./jwt";

const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "/api",
).replace(/\/$/, "");

type BackendLoginResponse = {
  idToken: string;
  refreshToken: string;
  expiresIn: number | string;
};

export type CompanySignupPayload = {
  name: string;
  legalName: string;
  cnpj: string;
  address: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    complement?: string;
  };
  contact: string;
  email: string;
  password: string;
};

export type AuthTokens = {
  idToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export type MeResponse = {
  email?: string;
  role?: AuthRole | string;
  companyId?: string;
  [key: string]: unknown;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function normalizeExpiresIn(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
}

function normalizeTokens(payload: BackendLoginResponse): AuthTokens {
  return {
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    expiresInSeconds: normalizeExpiresIn(payload.expiresIn),
  };
}

async function request<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const rawText = await response.text();
    throw new ApiError(rawText || fallbackMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function loginWithEmailAndPassword(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const payload = await request<BackendLoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    "Nao foi possivel autenticar.",
  );

  return normalizeTokens(payload);
}

export async function signupCompany(
  payload: CompanySignupPayload,
): Promise<AuthTokens | null> {
  const result = await request<
    Partial<BackendLoginResponse> | Record<string, unknown>
  >(
    "/auth/signup",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Nao foi possivel cadastrar company.",
  );

  if (
    typeof result.idToken === "string" &&
    typeof result.refreshToken === "string" &&
    (typeof result.expiresIn === "number" ||
      typeof result.expiresIn === "string")
  ) {
    return normalizeTokens(result as BackendLoginResponse);
  }

  return null;
}

export async function refreshAuth(refreshToken: string): Promise<AuthTokens> {
  const payload = await request<BackendLoginResponse>(
    "/auth/refresh-auth",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
    "Nao foi possivel renovar a sessao.",
  );

  return normalizeTokens(payload);
}

export async function getMe(idToken: string): Promise<MeResponse> {
  return request<MeResponse>(
    "/auth/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
    "Nao foi possivel carregar dados da sessao.",
  );
}

export async function logoutSession(idToken: string): Promise<void> {
  await request<Record<string, never>>(
    "/auth/logout",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({}),
    },
    "Falha ao encerrar sessao.",
  );
}

export function mapBackendRoleToAuthRole(role: unknown): AuthRole | null {
  if (typeof role !== "string") {
    return null;
  }

  switch (role.toLowerCase()) {
    case "master":
      return "master";
    case "admin":
      return "admin";
    case "company":
      return "company";
    case "collaborator":
      return "collaborator";
    case "master-admin":
      return "master";
    default:
      return null;
  }
}
