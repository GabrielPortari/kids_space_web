import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../../auth/useAuth";
import type { AuthRole } from "../../auth/jwt";
import type { CrmSection } from "./types";

export type WorkspaceContextValue = {
  // identidade
  role: AuthRole;
  session: ReturnType<typeof useAuth>["session"];
  logout: ReturnType<typeof useAuth>["logout"];

  // navegação
  section: CrmSection;
  setSection: (s: CrmSection) => void;

  // busca e paginação globais
  search: string;
  setSearch: (s: string) => void;
  page: number;
  setPage: (p: number) => void;

  // escopo de empresa (usado por admin/master)
  companyScope: string;
  setCompanyScope: (s: string) => void;

  // feedback de operações
  statusMessage: string | null;
  setStatusMessage: (msg: string | null) => void;

  // flags derivadas do role (evita recalcular em cada seção)
  isCompany: boolean;
  isCollaborator: boolean;
  isAdminOrMaster: boolean;
  canManageCollaborators: boolean;
  currentCompanyScope: string | undefined;

  // seções disponíveis conforme role
  availableSections: { id: CrmSection; label: string }[];
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  role,
  children,
}: {
  role: AuthRole;
  children: ReactNode;
}) {
  const { session, logout } = useAuth();
  const [section, setSection] = useState<CrmSection>("profile");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [companyScope, setCompanyScope] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Derivações de flags baseadas no role
  const isCompany = role === "company";
  const isCollaborator = role === "collaborator";
  const isAdminOrMaster = role === "admin" || role === "master";
  const canManageCollaborators = isCompany || isAdminOrMaster;
  const currentCompanyScope = isAdminOrMaster
    ? companyScope || undefined
    : session?.companyId || undefined;

  const availableSections = useMemo(() => {
    const base: { id: CrmSection; label: string }[] = [
      { id: "profile", label: "Perfil" },
    ];

    if (canManageCollaborators) {
      base.push({ id: "collaborators", label: "Colaboradores" });
    }

    base.push({ id: "children", label: "Criancas" });
    base.push({ id: "attendance", label: "Attendances" });

    if (!isAdminOrMaster) {
      base.splice(2, 0, { id: "parents", label: "Responsaveis" });
      base.splice(4, 0, { id: "links", label: "Vinculos" });
    }

    if (isAdminOrMaster) {
      base.unshift({ id: "companies", label: "Companies" });
    }

    if (role === "master") {
      base.push({ id: "master-bootstrap", label: "Bootstrap Admin" });
    }

    return base;
  }, [canManageCollaborators, isAdminOrMaster, role]);

  const value: WorkspaceContextValue = {
    role,
    session,
    logout,
    section,
    setSection,
    search,
    setSearch,
    page,
    setPage,
    companyScope,
    setCompanyScope,
    statusMessage,
    setStatusMessage,
    isCompany,
    isCollaborator,
    isAdminOrMaster,
    canManageCollaborators,
    currentCompanyScope,
    availableSections,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceContext must be used inside WorkspaceProvider",
    );
  }
  return ctx;
}
