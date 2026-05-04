import { useWorkspaceContext } from "../WorkspaceContext";

export function useWorkspace() {
  const ctx = useWorkspaceContext();

  return {
    availableSections: ctx.availableSections,
    currentCompanyScope: ctx.currentCompanyScope,
  };
}
