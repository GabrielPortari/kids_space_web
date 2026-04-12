import { refreshAuth } from "../auth/authApi";
import type { AuthSession } from "../auth/authTypes";

const AUTH_STORAGE_KEY = "kidsspace.session";
const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "/api",
).replace(/\/$/, "");

type JsonBody = Record<string, unknown>;

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: JsonBody | FormData | string;
  skipAuth?: boolean;
};

function readSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function writeSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function normalizeBody(body: ApiRequestOptions["body"]): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (typeof body === "string" || body instanceof FormData) {
    return body;
  }

  return JSON.stringify(body);
}

async function refreshStoredSession(): Promise<AuthSession | null> {
  const currentSession = readSession();

  if (!currentSession?.refreshToken) {
    writeSession(null);
    return null;
  }

  try {
    const refreshed = await refreshAuth(currentSession.refreshToken);
    const nextSession: AuthSession = {
      ...currentSession,
      idToken: refreshed.idToken,
      refreshToken: refreshed.refreshToken || currentSession.refreshToken,
      expiresAt: Date.now() + refreshed.expiresInSeconds * 1000,
    };

    writeSession(nextSession);
    return nextSession;
  } catch {
    writeSession(null);
    return null;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

function buildHeaders(
  headers: HeadersInit | undefined,
  withJson: boolean,
  token: string | null,
): Headers {
  const finalHeaders = new Headers(headers || {});

  if (withJson && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  return finalHeaders;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, headers, ...rest } = options;
  const isJsonBody =
    body !== undefined &&
    !(body instanceof FormData) &&
    typeof body !== "string";
  const currentSession = readSession();

  const doFetch = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: buildHeaders(headers, isJsonBody, skipAuth ? null : token),
      body: normalizeBody(body),
    });

  let response = await doFetch(currentSession?.idToken || null);

  const shouldTryRefresh =
    response.status === 401 && !skipAuth && !!currentSession?.refreshToken;

  if (shouldTryRefresh) {
    const refreshedSession = await refreshStoredSession();

    if (refreshedSession?.idToken) {
      response = await doFetch(refreshedSession.idToken);
    }
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro ao executar requisicao.");
  }

  return parseResponse<T>(response);
}
