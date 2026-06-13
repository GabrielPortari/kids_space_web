import type { AuthRole } from "../../auth/jwt";
import { WorkspaceProvider } from "./WorkspaceContext";
import { RoleWorkspacePageContent } from "./RoleWorkspacePageContent";

export function RoleWorkspacePage({ role }: { role: AuthRole }) {
  return (
    <WorkspaceProvider role={role}>
      <RoleWorkspacePageContent />
    </WorkspaceProvider>
  );
}
