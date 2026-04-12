export type JwtPayload = {
  exp?: number;
  email?: string;
  sub?: string;
  user_id?: string;
  uid?: string;
  role?: string;
  roles?: string[];
  companyId?: string;
  company_id?: string;
  [key: string]: unknown;
};

export type AuthRole = "master" | "admin" | "company" | "collaborator";

function normalizeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = normalized.length % 4;

  if (remainder === 0) {
    return normalized;
  }

  return `${normalized}${"=".repeat(4 - remainder)}`;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");

  if (parts.length < 2 || !parts[1]) {
    return null;
  }

  try {
    const decoded = window.atob(normalizeBase64Url(parts[1]));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function parseRole(value: unknown): AuthRole | null {
  if (typeof value !== "string") {
    return null;
  }

  switch (value.toLowerCase()) {
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

export function extractRoleFromJwt(
  payload: JwtPayload | null,
): AuthRole | null {
  if (!payload) {
    return null;
  }

  const directRole =
    parseRole(payload.role) ||
    parseRole((payload.claims as JwtPayload | undefined)?.role) ||
    parseRole((payload.customClaims as JwtPayload | undefined)?.role);

  if (directRole) {
    return directRole;
  }

  if (Array.isArray(payload.roles)) {
    for (const item of payload.roles) {
      const parsed = parseRole(item);
      if (parsed) {
        return parsed;
      }
    }
  }

  return null;
}

export function extractEmailFromJwt(payload: JwtPayload | null): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload.email === "string" && payload.email.trim().length > 0) {
    return payload.email.trim();
  }

  return null;
}

export function extractUserIdFromJwt(
  payload: JwtPayload | null,
): string | null {
  if (!payload) {
    return null;
  }

  const candidate = payload.user_id ?? payload.uid ?? payload.sub;
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

export function extractCompanyIdFromJwt(
  payload: JwtPayload | null,
): string | null {
  if (!payload) {
    return null;
  }

  const candidate = payload.companyId ?? payload.company_id;
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

export function extractExpirationFromJwt(
  payload: JwtPayload | null,
): number | null {
  if (!payload || typeof payload.exp !== "number") {
    return null;
  }

  return payload.exp * 1000;
}
