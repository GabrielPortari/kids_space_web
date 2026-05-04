import type { AuthRole } from "../../auth/jwt";
import { useAuth } from "../../auth/useAuth";
import { WorkspaceProvider } from "./WorkspaceContext";
import { RoleWorkspacePageContent } from "./RoleWorkspacePageContent";

export function RoleWorkspacePage({ role }: { role: AuthRole }) {
  const { logout } = useAuth();

  return (
    <WorkspaceProvider role={role}>
      <RoleWorkspacePageContent logout={logout} />
    </WorkspaceProvider>
  );
}
