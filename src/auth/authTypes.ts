import type { AuthRole } from "./jwt";
import type { CompanySignupPayload } from "./authApi";

export type AuthSession = {
  email: string;
  role: AuthRole;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string | null;
  companyId: string | null;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
  session: AuthSession | null;
  status: AuthStatus;
  login: (credentials: LoginCredentials) => Promise<void>;
  signupCompany: (payload: CompanySignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};
