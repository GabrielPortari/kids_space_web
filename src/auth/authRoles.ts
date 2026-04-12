import type { AuthRole } from "./jwt";

export const authRoleLabels: Record<AuthRole, string> = {
  master: "Master",
  admin: "Admin",
  company: "Company",
  collaborator: "Collaborator",
};

export const authRolePaths: Record<AuthRole, string> = {
  master: "/app/master",
  admin: "/app/admin",
  company: "/app/company",
  collaborator: "/app/collaborator",
};
