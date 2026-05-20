import { parseRole, type AuthRole } from "./jwt";

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
    address: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipcode?: string;
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

/**
 * Callback invoked when a request receives a 401 response.
 * Should attempt a token refresh and return the new idToken,
 * or null if refresh is not possible.
 */
export type UnauthorizedHandler = () => Promise<string | null>;

export class ApiError extends Error {
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

async function executeRequest<T>(
  url: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(url, {
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

/**
 * Core request function with optional 401 interception and retry.
 *
 * When `onUnauthorized` is provided and the server returns 401, the handler
 * is called once to obtain a refreshed token. If a new token is returned,
 * the request is retried a single time with the updated Authorization header.
 * If the retry also fails, the error is propagated normally.
 */
async function request<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
  onUnauthorized?: UnauthorizedHandler,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  try {
    return await executeRequest<T>(url, init, fallbackMessage);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && onUnauthorized) {
      const newToken = await onUnauthorized();

      if (newToken) {
        const retryInit: RequestInit = {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...(init.headers || {}),
            Authorization: `Bearer ${newToken}`,
          },
        };

        return executeRequest<T>(url, retryInit, fallbackMessage);
      }
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

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

export async function getMe(
  idToken: string,
  onUnauthorized?: UnauthorizedHandler,
): Promise<MeResponse> {
  return request<MeResponse>(
    "/auth/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
    "Nao foi possivel carregar dados da sessao.",
    onUnauthorized,
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
    // No retry on logout — if the token is expired, the session is already
    // invalid on the server; local cleanup is all that matters.
  );
}

/**
 * Maps a raw role string from the backend to a typed AuthRole.
 * Delegates to `parseRole` in jwt.ts — single source of truth.
 */
export function mapBackendRoleToAuthRole(role: unknown): AuthRole | null {
  return parseRole(role);
}
