import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/**
 * How early before expiration we proactively refresh the token.
 * 5 minutes covers slow networks and API latency comfortably.
 */
const TOKEN_REFRESH_TOLERANCE_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

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

function persistSession(session: AuthSession | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readSession(),
  );
  const [status, setStatus] = useState<AuthStatus>("loading");

  /**
   * Ref used to prevent a scheduled refresh from running after the component
   * unmounts or after the user has already logged out.
   */
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Core helpers
  // ---------------------------------------------------------------------------

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

  const applySession = useCallback((next: AuthSession) => {
    setSession(next);
    persistSession(next);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    setSession(null);
    persistSession(null);
    setStatus("anonymous");
  }, []);

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  const refreshSession = useCallback(
    async (currentSession: AuthSession | null = null) => {
      // Accept the session as a parameter so the proactive timer can pass
      // the captured snapshot even if React state hasn't re-rendered yet.
      const target = currentSession ?? session;

      if (!target?.refreshToken) {
        clearSession();
        return;
      }

      try {
        const refreshed = await refreshAuth(target.refreshToken);
        const nextSession = await buildSession(refreshed, {
          email: target.email,
          refreshToken: target.refreshToken,
        });

        applySession(nextSession);
      } catch {
        clearSession();
      }
    },
    [applySession, buildSession, clearSession, session],
  );

  // ---------------------------------------------------------------------------
  // Proactive refresh timer
  //
  // Whenever the session's expiresAt changes (new login, successful refresh),
  // we schedule a refresh TOKEN_REFRESH_TOLERANCE_MS before expiry.
  // This ensures the token is always valid while the app is open, without
  // requiring any manual intervention or API-level 401 handling.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!session || status !== "authenticated") {
      return;
    }

    const msUntilExpiry = session.expiresAt - Date.now();
    const msUntilRefresh = msUntilExpiry - TOKEN_REFRESH_TOLERANCE_MS;

    // Token is already within the tolerance window — refresh immediately.
    if (msUntilRefresh <= 0) {
      void refreshSession(session);
      return;
    }

    // Capture the session snapshot so the timer closure doesn't hold a stale
    // reference if the user logs out and back in before the timer fires.
    const capturedSession = session;

    refreshTimerRef.current = setTimeout(() => {
      void refreshSession(capturedSession);
    }, msUntilRefresh);

    return () => {
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.expiresAt, status]);

  // ---------------------------------------------------------------------------
  // Bootstrap
  //
  // Runs once on mount. Uses the session already loaded into state by useState
  // to avoid reading localStorage twice. If the token is still valid it sets
  // status to "authenticated" immediately; otherwise it attempts a refresh.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      // session was already initialised from localStorage by useState.
      const storedSession = session;

      if (!storedSession?.refreshToken) {
        if (active) setStatus("anonymous");
        return;
      }

      const hasValidTokenLifetime =
        storedSession.expiresAt - Date.now() > TOKEN_REFRESH_TOLERANCE_MS;

      if (hasValidTokenLifetime) {
        if (active) setStatus("authenticated");
        return;
      }

      try {
        const refreshed = await refreshAuth(storedSession.refreshToken);
        if (!active) return;

        const nextSession = await buildSession(refreshed, {
          email: storedSession.email,
          refreshToken: storedSession.refreshToken,
        });

        if (!active) return;
        applySession(nextSession);
      } catch {
        if (!active) return;
        clearSession();
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
    // Intentionally empty deps — runs only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------

  const login = useCallback(
    async ({ email, password }: LoginCredentials) => {
      setStatus("loading");

      try {
        const tokens = await loginWithEmailAndPassword(email, password);
        const nextSession = await buildSession(tokens, { email });

        applySession(nextSession);
      } catch (error) {
        setStatus("anonymous");
        throw error;
      }
    },
    [applySession, buildSession],
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

        applySession(nextSession);
      } catch (error) {
        setStatus("anonymous");
        throw error;
      }
    },
    [applySession, buildSession],
  );

  const logout = useCallback(async () => {
    const currentToken = session?.idToken;

    // Clear local state immediately — no "loading" flash.
    // The server call is best-effort; the session is gone either way.
    clearSession();

    try {
      if (currentToken) {
        await logoutSession(currentToken);
      }
    } catch {
      // Swallow — local session is already cleared.
    }
  }, [clearSession, session?.idToken]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      login,
      signupCompany: registerCompany,
      logout,
      refreshSession: () => refreshSession(),
    }),
    [login, logout, refreshSession, registerCompany, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
