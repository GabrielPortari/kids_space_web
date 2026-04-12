import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  getMe,
  loginWithEmailAndPassword,
  logoutSession,
  mapBackendRoleToAuthRole,
  refreshAuth,
  signupCompany,
  type AuthTokens,
} from "./authApi";
import {
  decodeJwtPayload,
  extractCompanyIdFromJwt,
  extractEmailFromJwt,
  extractExpirationFromJwt,
  extractRoleFromJwt,
  extractUserIdFromJwt,
} from "./jwt";
import { AuthContext } from "./authContextStore";
import type {
  AuthContextValue,
  AuthSession,
  AuthStatus,
  LoginCredentials,
} from "./authTypes";

const AUTH_STORAGE_KEY = "kidsspace.session";
const TOKEN_REFRESH_TOLERANCE_MS = 30_000;

function readSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readSession(),
  );
  const [status, setStatus] = useState<AuthStatus>("loading");

  const buildSession = useCallback(
    async (
      tokens: AuthTokens,
      fallback: { email?: string; refreshToken?: string },
    ): Promise<AuthSession> => {
      const payload = decodeJwtPayload(tokens.idToken);
      const me = await getMe(tokens.idToken).catch(() => null);

      const role =
        mapBackendRoleToAuthRole(me?.role) ||
        extractRoleFromJwt(payload) ||
        mapBackendRoleToAuthRole(
          (payload?.firebase as Record<string, unknown> | undefined)?.role,
        );

      if (!role) {
        throw new Error("Nao foi possivel identificar o role da sessao.");
      }

      const email =
        (typeof me?.email === "string" && me.email.trim()) ||
        extractEmailFromJwt(payload) ||
        fallback.email ||
        "";

      const jwtExpiresAt = extractExpirationFromJwt(payload);
      const fallbackExpiresAt = Date.now() + tokens.expiresInSeconds * 1000;

      return {
        email,
        role,
        idToken: tokens.idToken,
        refreshToken: tokens.refreshToken || fallback.refreshToken || "",
        expiresAt:
          jwtExpiresAt && jwtExpiresAt > Date.now()
            ? jwtExpiresAt
            : fallbackExpiresAt,
        userId: extractUserIdFromJwt(payload),
        companyId:
          (typeof me?.companyId === "string" && me.companyId) ||
          extractCompanyIdFromJwt(payload),
      };
    },
    [],
  );

  const clearSession = useCallback(() => {
    setSession(null);
    setStatus("anonymous");
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session?.refreshToken) {
      clearSession();
      return;
    }

    setStatus("loading");

    try {
      const refreshed = await refreshAuth(session.refreshToken);
      const nextSession = await buildSession(refreshed, {
        email: session.email,
        refreshToken: session.refreshToken,
      });

      setSession(nextSession);
      setStatus("authenticated");
    } catch {
      clearSession();
    }
  }, [buildSession, clearSession, session]);

  const login = useCallback(
    async ({ email, password }: LoginCredentials) => {
      setStatus("loading");

      try {
        const tokens = await loginWithEmailAndPassword(email, password);
        const nextSession = await buildSession(tokens, { email });

        setSession(nextSession);
        setStatus("authenticated");
      } catch (error) {
        setStatus("anonymous");
        throw error;
      }
    },
    [buildSession],
  );

  const registerCompany = useCallback(
    async (payload: Parameters<typeof signupCompany>[0]) => {
      setStatus("loading");

      try {
        const signupTokens = await signupCompany(payload);
        const tokens =
          signupTokens ||
          (await loginWithEmailAndPassword(payload.email, payload.password));
        const nextSession = await buildSession(tokens, {
          email: payload.email,
        });

        setSession(nextSession);
        setStatus("authenticated");
      } catch (error) {
        setStatus("anonymous");
        throw error;
      }
    },
    [buildSession],
  );

  const logout = useCallback(async () => {
    const currentToken = session?.idToken;

    setStatus("loading");

    try {
      if (currentToken) {
        await logoutSession(currentToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession, session?.idToken]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const storedSession = readSession();

      if (!active) {
        return;
      }

      if (!storedSession?.refreshToken) {
        setStatus("anonymous");
        return;
      }

      setSession(storedSession);

      const hasValidTokenLifetime =
        storedSession.expiresAt - Date.now() > TOKEN_REFRESH_TOLERANCE_MS;

      if (hasValidTokenLifetime) {
        setStatus("authenticated");
        return;
      }

      try {
        const refreshed = await refreshAuth(storedSession.refreshToken);

        if (!active) {
          return;
        }

        const nextSession = await buildSession(refreshed, {
          email: storedSession.email,
          refreshToken: storedSession.refreshToken,
        });

        if (!active) {
          return;
        }

        setSession(nextSession);
        setStatus("authenticated");
      } catch {
        if (!active) {
          return;
        }

        clearSession();
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [buildSession, clearSession]);

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      login,
      signupCompany: registerCompany,
      logout,
      refreshSession,
    }),
    [login, logout, refreshSession, registerCompany, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
