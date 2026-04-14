import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { z } from "zod";
import { authRoleLabels } from "../auth/authRoles";
import type { AuthRole } from "../auth/jwt";
import { useAuth } from "../auth/useAuth";
import {
  createCollaborator,
  deleteCollaborator,
  listCollaborators,
  updateCollaborator,
} from "../api/modules/collaboratorApi";
import {
  assignChildrenToParent,
  createParent,
  deleteParent,
  listParents,
  type CreateParentPayload,
  updateParent,
} from "../api/modules/parentApi";
import {
  assignParentsToChild,
  createChild,
  deleteChild,
  listChildren,
  updateChild,
} from "../api/modules/childApi";
import {
  checkin,
  checkout,
  deleteAttendance,
  listAttendances,
} from "../api/modules/attendanceApi";
import {
  bootstrapAdmin,
  listAttendancesAdmin,
  listChildrenAdmin,
  listCollaboratorsAdmin,
} from "../api/modules/adminApi";
import {
  createCompany,
  deleteCompany,
  getMyCompany,
  listCompanies,
  updateCompany,
  updateMyCompany,
} from "../api/modules/companyApi";
import {
  getMyCollaborator,
  updateMyCollaborator,
} from "../api/modules/profileApi";

type CrmSection =
  | "profile"
  | "companies"
  | "collaborators"
  | "parents"
  | "children"
  | "links"
  | "attendance"
  | "master-bootstrap";

type ListItem = {
  id?: string;
  name?: string;
  email?: string;
  document?: string;
  companyId?: string;
  [key: string]: unknown;
};

type ProfileFieldConfig = {
  key: string;
  label: string;
  editable: boolean;
  value: string;
};

type ParentFormState = {
  name: string;
  document: string;
  email: string;
  contact: string;
  birthDate: string;
  children: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressComplement: string;
  addressCountry: string;
};

type CollaboratorFormState = {
  name: string;
  email: string;
  document: string;
  contact: string;
  birthDate: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressComplement: string;
  addressCountry: string;
};

const PAGE_SIZE = 8;

const INITIAL_COLLABORATOR_FORM: CollaboratorFormState = {
  name: "",
  email: "",
  document: "",
  contact: "",
  birthDate: "",
  addressStreet: "",
  addressNumber: "",
  addressDistrict: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
  addressComplement: "",
  addressCountry: "",
};

const INITIAL_PARENT_FORM: ParentFormState = {
  name: "",
  document: "",
  email: "",
  contact: "",
  birthDate: "",
  children: "",
  addressStreet: "",
  addressNumber: "",
  addressDistrict: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
  addressComplement: "",
  addressCountry: "",
};

function extractId(item: ListItem): string {
  return String(item.id || item._id || item.uid || "");
}

function matchesSearch(item: ListItem, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  const term = search.toLowerCase();
  return Object.values(item)
    .map((value) => String(value || "").toLowerCase())
    .some((value) => value.includes(term));
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function getParentDocument(item: ListItem): string {
  return String(item.document || item.cpf || "");
}

function normalizeDateInput(value: string): string {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function toParentFormState(item: ListItem): ParentFormState {
  const address =
    item.address &&
    typeof item.address === "object" &&
    !Array.isArray(item.address)
      ? (item.address as Record<string, unknown>)
      : {};

  const children = Array.isArray(item.children)
    ? item.children.map((value) => String(value)).join(", ")
    : String(item.children || "");

  return {
    name: String(item.name || ""),
    document: normalizeDigits(getParentDocument(item)).slice(0, 11),
    email: String(item.email || ""),
    contact: normalizeDigits(String(item.contact || "")).slice(0, 11),
    birthDate: normalizeDateInput(String(item.birthDate || "")),
    children,
    addressStreet: String(address.street || ""),
    addressNumber: String(address.number || ""),
    addressDistrict: String(address.district || ""),
    addressCity: String(address.city || ""),
    addressState: String(address.state || ""),
    addressZipCode: normalizeDigits(String(address.zipCode || "")).slice(0, 8),
    addressComplement: String(address.complement || ""),
    addressCountry: String(address.country || ""),
  };
}

function matchesParentSearch(item: ListItem, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  const lowerSearch = search.trim().toLowerCase();
  const digitSearch = normalizeDigits(search);
  const name = String(item.name || "").toLowerCase();
  const document = getParentDocument(item);
  const documentDigits = normalizeDigits(document);

  if (name.includes(lowerSearch)) {
    return true;
  }

  if (!digitSearch) {
    return document.toLowerCase().includes(lowerSearch);
  }

  return documentDigits.includes(digitSearch);
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function isTimestampObject(value: unknown): value is {
  _seconds?: number;
  seconds?: number;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record._seconds === "number" || typeof record.seconds === "number"
  );
}

function formatTimestamp(value: unknown): string {
  if (!isTimestampObject(value)) {
    return "";
  }

  const unixSeconds =
    typeof value._seconds === "number" ? value._seconds : value.seconds;

  if (typeof unixSeconds !== "number") {
    return "";
  }

  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return String(unixSeconds);
  }

  return date.toLocaleString("pt-BR");
}

function sortByPriority(keys: string[], priority: string[]): string[] {
  return [...keys].sort((a, b) => {
    const indexA = priority.indexOf(a);
    const indexB = priority.indexOf(b);
    const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.localeCompare(b);
  });
}

function flattenRecord(
  source: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(source).forEach(([rawKey, rawValue]) => {
    const key = prefix ? `${prefix}.${rawKey}` : rawKey;

    if (isTimestampObject(rawValue)) {
      result[key] = formatTimestamp(rawValue);
      return;
    }

    if (
      rawValue &&
      typeof rawValue === "object" &&
      !Array.isArray(rawValue) &&
      !(rawValue instanceof Date)
    ) {
      Object.assign(
        result,
        flattenRecord(rawValue as Record<string, unknown>, key),
      );
      return;
    }

    if (Array.isArray(rawValue)) {
      result[key] = rawValue.map((item) => String(item)).join(", ");
      return;
    }

    result[key] =
      rawValue === null || rawValue === undefined ? "" : String(rawValue);
  });

  return result;
}

function toFieldLabel(key: string): string {
  return key
    .split(".")
    .map((part) =>
      part
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .trim(),
    )
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" - ");
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskZipCode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

function maskByFieldKey(key: string, value: string): string {
  if (!value) {
    return value;
  }

  const normalizedKey = key.toLowerCase();

  if (normalizedKey === "cnpj") {
    return maskCnpj(value);
  }

  if (normalizedKey.endsWith("zipcode") || normalizedKey.endsWith("zip_code")) {
    return maskZipCode(value);
  }

  if (normalizedKey === "contact" || normalizedKey.endsWith("phone")) {
    return maskPhone(value);
  }

  if (normalizedKey === "document") {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) {
      return maskCpf(value);
    }

    if (digits.length === 14) {
      return maskCnpj(value);
    }
  }

  return value;
}

const companyUpdateSchema = z.object({
  name: z.string().trim().min(1),
  legalName: z.string().trim().optional(),
  contact: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export function RoleWorkspacePage({ role }: { role: AuthRole }) {
  const queryClient = useQueryClient();
  const { logout, session } = useAuth();
  const [section, setSection] = useState<CrmSection>("profile");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [companyScope, setCompanyScope] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [isParentEditModalOpen, setIsParentEditModalOpen] = useState(false);
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [parentForm, setParentForm] =
    useState<ParentFormState>(INITIAL_PARENT_FORM);
  const [isCollaboratorCreateModalOpen, setIsCollaboratorCreateModalOpen] =
    useState(false);
  const [isCollaboratorViewModalOpen, setIsCollaboratorViewModalOpen] =
    useState(false);
  const [isCollaboratorEditModalOpen, setIsCollaboratorEditModalOpen] =
    useState(false);
  const [viewingCollaboratorId, setViewingCollaboratorId] = useState<
    string | null
  >(null);
  const [editingCollaboratorId, setEditingCollaboratorId] = useState<
    string | null
  >(null);
  const [collaboratorForm, setCollaboratorForm] =
    useState<CollaboratorFormState>(INITIAL_COLLABORATOR_FORM);
  const [isCollaboratorDeleteModalOpen, setIsCollaboratorDeleteModalOpen] =
    useState(false);
  const [pendingDeleteCollaboratorId, setPendingDeleteCollaboratorId] =
    useState<string | null>(null);

  const isCompany = role === "company";
  const isCollaborator = role === "collaborator";
  const isAdminOrMaster = role === "admin" || role === "master";
  const canManageCollaborators = isCompany || isAdminOrMaster;
  const currentCompanyScope = isAdminOrMaster
    ? companyScope || undefined
    : session?.companyId || undefined;

  const collaboratorsQuery = useQuery({
    queryKey: ["collaborators", currentCompanyScope, role],
    queryFn: () =>
      isAdminOrMaster
        ? listCollaboratorsAdmin(currentCompanyScope)
        : listCollaborators(currentCompanyScope),
    enabled: canManageCollaborators && section === "collaborators",
  });

  const parentsQuery = useQuery({
    queryKey: ["parents", currentCompanyScope, role],
    queryFn: () => listParents(currentCompanyScope),
    enabled: !isAdminOrMaster && (section === "parents" || section === "links"),
  });

  const childrenQuery = useQuery({
    queryKey: ["children", currentCompanyScope, role],
    queryFn: () =>
      isAdminOrMaster
        ? listChildrenAdmin(currentCompanyScope)
        : listChildren(currentCompanyScope),
    enabled: section === "children" || section === "links",
  });

  const attendancesQuery = useQuery({
    queryKey: ["attendances", currentCompanyScope, role],
    queryFn: () =>
      isAdminOrMaster
        ? listAttendancesAdmin(currentCompanyScope)
        : listAttendances(currentCompanyScope),
    enabled: section === "attendance",
  });

  const myCompanyQuery = useQuery({
    queryKey: ["my-company", role],
    queryFn: getMyCompany,
    enabled: section === "profile" && isCompany,
  });

  const myCollaboratorQuery = useQuery({
    queryKey: ["my-collaborator", role],
    queryFn: getMyCollaborator,
    enabled: section === "profile" && isCollaborator,
  });

  const companiesQuery = useQuery({
    queryKey: ["companies", companyScope],
    queryFn: () => listCompanies(companyScope || undefined),
    enabled: section === "companies" && isAdminOrMaster,
  });

  const createCollaboratorMut = useMutation({
    mutationFn: createCollaborator,
    onSuccess: async () => {
      setStatusMessage("Colaborador criado com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["collaborators"] });
    },
  });

  const updateCollaboratorMut = useMutation({
    mutationFn: ({
      id,
      name,
      email,
      document,
      contact,
      birthDate,
      address,
    }: {
      id: string;
      name?: string;
      email?: string;
      document?: string;
      contact?: string;
      birthDate?: string;
      address?: Record<string, string>;
    }) =>
      updateCollaborator(id, {
        name,
        email,
        document,
        contact,
        birthDate,
        address,
      }),
    onSuccess: async () => {
      setStatusMessage("Colaborador atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["collaborators"] });
    },
  });

  const deleteCollaboratorMut = useMutation({
    mutationFn: deleteCollaborator,
    onSuccess: async () => {
      setStatusMessage("Colaborador excluido com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["collaborators"] });
    },
  });

  const createParentMut = useMutation({
    mutationFn: createParent,
    onSuccess: async () => {
      setStatusMessage("Responsavel criado.");
      await queryClient.invalidateQueries({ queryKey: ["parents"] });
    },
  });

  const updateParentMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateParentPayload>;
    }) => updateParent(id, payload),
    onSuccess: async () => {
      setStatusMessage("Responsavel atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["parents"] });
    },
  });

  const deleteParentMut = useMutation({
    mutationFn: deleteParent,
    onSuccess: async () => {
      setStatusMessage("Responsavel removido.");
      await queryClient.invalidateQueries({ queryKey: ["parents"] });
    },
  });

  const assignChildrenMut = useMutation({
    mutationFn: ({
      parentId,
      childIds,
    }: {
      parentId: string;
      childIds: string[];
    }) => assignChildrenToParent(parentId, childIds),
    onSuccess: () =>
      setStatusMessage("Vinculo de responsavel para criancas atualizado."),
  });

  const createChildMut = useMutation({
    mutationFn: createChild,
    onSuccess: async () => {
      setStatusMessage("Crianca criada.");
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const updateChildMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      updateChild(id, { name }),
    onSuccess: async () => {
      setStatusMessage("Crianca atualizada.");
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const deleteChildMut = useMutation({
    mutationFn: deleteChild,
    onSuccess: async () => {
      setStatusMessage("Crianca removida.");
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const assignParentsMut = useMutation({
    mutationFn: ({
      childId,
      parentIds,
    }: {
      childId: string;
      parentIds: string[];
    }) => assignParentsToChild(childId, parentIds),
    onSuccess: () =>
      setStatusMessage("Vinculo de crianca para responsaveis atualizado."),
  });

  const checkinMut = useMutation({
    mutationFn: checkin,
    onSuccess: async () => {
      setStatusMessage("Check-in realizado.");
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  const checkoutMut = useMutation({
    mutationFn: checkout,
    onSuccess: async () => {
      setStatusMessage("Check-out realizado.");
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  const deleteAttendanceMut = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: async () => {
      setStatusMessage("Attendance removida.");
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  const updateMyCompanyMut = useMutation({
    mutationFn: updateMyCompany,
    onSuccess: async () => {
      setStatusMessage("Dados da company atualizados.");
      await queryClient.invalidateQueries({ queryKey: ["my-company"] });
    },
  });

  const updateMyCollaboratorMut = useMutation({
    mutationFn: ({ name, contact }: { name?: string; contact?: string }) =>
      updateMyCollaborator({ name, contact }),
    onSuccess: async () => {
      setStatusMessage("Seu perfil foi atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["my-collaborator"] });
    },
  });

  const createCompanyMut = useMutation({
    mutationFn: createCompany,
    onSuccess: async () => {
      setStatusMessage("Company criada.");
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const updateCompanyMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateCompany(id, { name }),
    onSuccess: async () => {
      setStatusMessage("Company atualizada.");
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const deleteCompanyMut = useMutation({
    mutationFn: deleteCompany,
    onSuccess: async () => {
      setStatusMessage("Company removida.");
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const bootstrapAdminMut = useMutation({
    mutationFn: bootstrapAdmin,
    onSuccess: () => setStatusMessage("Admin bootstrap criado com sucesso."),
  });

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

  const collaborators = collaboratorsQuery.data || [];
  const parents = parentsQuery.data || [];
  const children = childrenQuery.data || [];
  const attendances = attendancesQuery.data || [];
  const companies = companiesQuery.data || [];

  const profileData = isCompany
    ? (myCompanyQuery.data as Record<string, unknown> | undefined) || {}
    : isCollaborator
      ? (myCollaboratorQuery.data as Record<string, unknown> | undefined) || {}
      : ({
          email: session?.email || "",
          role,
          companyId: session?.companyId || "",
          userId: session?.userId || "",
        } as Record<string, unknown>);

  const flattenedProfile = flattenRecord(profileData);

  const editableKeys = new Set(
    isCompany
      ? ["name", "legalName", "email", "contact"]
      : isCollaborator
        ? ["name", "contact"]
        : [],
  );

  const personalPriorityOrder = [
    "name",
    "legalName",
    "email",
    "contact",
    "document",
    "cnpj",
    "birthDate",
    "createdAt",
    "updatedAt",
    "companyId",
    "id",
    "userId",
    "role",
  ];

  const addressPriorityOrder = [
    "address.street",
    "address.number",
    "address.district",
    "address.city",
    "address.state",
    "address.zipCode",
    "address.complement",
    "address.country",
  ];

  const allKeys = Object.keys(flattenedProfile);

  const profileFields: ProfileFieldConfig[] = allKeys.map((key) => ({
    key,
    label: toFieldLabel(key),
    editable: editableKeys.has(key),
    value: maskByFieldKey(key, flattenedProfile[key] || ""),
  }));

  const personalProfileFields = sortByPriority(
    profileFields
      .filter((field) => !field.key.startsWith("address."))
      .map((field) => field.key),
    personalPriorityOrder,
  ).map(
    (key) =>
      profileFields.find((field) => field.key === key) as ProfileFieldConfig,
  );

  const addressProfileFields = sortByPriority(
    profileFields
      .filter((field) => field.key.startsWith("address."))
      .map((field) => field.key),
    addressPriorityOrder,
  ).map(
    (key) =>
      profileFields.find((field) => field.key === key) as ProfileFieldConfig,
  );

  const collection =
    section === "collaborators"
      ? collaborators
      : section === "parents"
        ? parents
        : section === "children"
          ? children
          : section === "attendance"
            ? attendances
            : section === "companies"
              ? companies
              : [];

  const filteredCollection =
    section === "parents" && !isAdminOrMaster
      ? parents.filter((item) => matchesParentSearch(item as ListItem, search))
      : collection.filter((item) => matchesSearch(item as ListItem, search));
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCollection.length / PAGE_SIZE),
  );
  const pagedCollection = paginate(filteredCollection, page, PAGE_SIZE);

  function safePrompt(label: string): string | null {
    const result = window.prompt(label);
    if (!result) {
      return null;
    }

    const value = result.trim();
    return value.length ? value : null;
  }

  async function onCreateCollaboratorModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = collaboratorForm.name.trim();
    const email = collaboratorForm.email.trim();
    const document = normalizeDigits(collaboratorForm.document).slice(0, 14);
    const contact = normalizeDigits(collaboratorForm.contact).slice(0, 11);
    const birthDate = collaboratorForm.birthDate.trim();

    const addressEntries = {
      street: collaboratorForm.addressStreet.trim(),
      number: collaboratorForm.addressNumber.trim(),
      district: collaboratorForm.addressDistrict.trim(),
      city: collaboratorForm.addressCity.trim(),
      state: collaboratorForm.addressState.trim(),
      zipCode: normalizeDigits(collaboratorForm.addressZipCode),
      complement: collaboratorForm.addressComplement.trim(),
      country: collaboratorForm.addressCountry.trim(),
    };

    const compactAddress = Object.fromEntries(
      Object.entries(addressEntries).filter(([, value]) => Boolean(value)),
    );

    if (!name || !email) {
      setStatusMessage("Nome e email sao obrigatorios para colaborador.");
      return;
    }

    await createCollaboratorMut.mutateAsync({
      name,
      email,
      document: document || undefined,
      contact: contact || undefined,
      birthDate: birthDate || undefined,
      address:
        Object.keys(compactAddress).length > 0 ? compactAddress : undefined,
      companyId: currentCompanyScope,
    });

    setIsCollaboratorCreateModalOpen(false);
    setCollaboratorForm(INITIAL_COLLABORATOR_FORM);
  }

  async function onUpdateCollaboratorModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingCollaboratorId) {
      setStatusMessage("Nao foi possivel identificar o colaborador.");
      return;
    }

    const name = collaboratorForm.name.trim();
    const email = collaboratorForm.email.trim();
    const document = normalizeDigits(collaboratorForm.document).slice(0, 14);
    const contact = normalizeDigits(collaboratorForm.contact).slice(0, 11);
    const birthDate = collaboratorForm.birthDate.trim();

    const addressEntries = {
      street: collaboratorForm.addressStreet.trim(),
      number: collaboratorForm.addressNumber.trim(),
      district: collaboratorForm.addressDistrict.trim(),
      city: collaboratorForm.addressCity.trim(),
      state: collaboratorForm.addressState.trim(),
      zipCode: normalizeDigits(collaboratorForm.addressZipCode),
      complement: collaboratorForm.addressComplement.trim(),
      country: collaboratorForm.addressCountry.trim(),
    };

    const compactAddress = Object.fromEntries(
      Object.entries(addressEntries).filter(([, value]) => Boolean(value)),
    );

    if (!name || !email) {
      setStatusMessage("Nome e email sao obrigatorios para colaborador.");
      return;
    }

    await updateCollaboratorMut.mutateAsync({
      id: editingCollaboratorId,
      name,
      email,
      document: document || undefined,
      contact: contact || undefined,
      birthDate: birthDate || undefined,
      address:
        Object.keys(compactAddress).length > 0 ? compactAddress : undefined,
    });

    setIsCollaboratorEditModalOpen(false);
    setEditingCollaboratorId(null);
    setCollaboratorForm(INITIAL_COLLABORATOR_FORM);
  }

  function openCollaboratorViewModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage("Nao foi possivel abrir a visualizacao.");
      return;
    }

    setViewingCollaboratorId(id);
    setIsCollaboratorViewModalOpen(true);
  }

  function openCollaboratorEditModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage("Nao foi possivel abrir a edicao.");
      return;
    }

    const address =
      item.address &&
      typeof item.address === "object" &&
      !Array.isArray(item.address)
        ? (item.address as Record<string, unknown>)
        : {};

    setEditingCollaboratorId(id);
    setCollaboratorForm({
      name: String(item.name || ""),
      email: String(item.email || ""),
      document: normalizeDigits(String(item.document || "")).slice(0, 14),
      contact: normalizeDigits(String(item.contact || "")).slice(0, 11),
      birthDate: normalizeDateInput(String(item.birthDate || "")),
      addressStreet: String(address.street || ""),
      addressNumber: String(address.number || ""),
      addressDistrict: String(address.district || ""),
      addressCity: String(address.city || ""),
      addressState: String(address.state || ""),
      addressZipCode: normalizeDigits(String(address.zipCode || "")).slice(
        0,
        8,
      ),
      addressComplement: String(address.complement || ""),
      addressCountry: String(address.country || ""),
    });
    setIsCollaboratorEditModalOpen(true);
  }

  async function onCreateParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = parentForm.name.trim();
    const document = normalizeDigits(parentForm.document);
    const email = parentForm.email.trim();
    const contact = parentForm.contact.trim();
    const birthDate = parentForm.birthDate.trim();
    const children = parentForm.children
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const addressEntries = {
      street: parentForm.addressStreet.trim(),
      number: parentForm.addressNumber.trim(),
      district: parentForm.addressDistrict.trim(),
      city: parentForm.addressCity.trim(),
      state: parentForm.addressState.trim(),
      zipCode: normalizeDigits(parentForm.addressZipCode),
      complement: parentForm.addressComplement.trim(),
      country: parentForm.addressCountry.trim(),
    };

    const compactAddress = Object.fromEntries(
      Object.entries(addressEntries).filter(([, value]) => Boolean(value)),
    );

    if (!name) {
      setStatusMessage("Nome do responsavel e obrigatorio.");
      return;
    }

    const payload: CreateParentPayload = {
      name,
      companyId: currentCompanyScope,
      document: document || undefined,
      email: email || undefined,
      contact: contact || undefined,
      birthDate: birthDate || undefined,
      children: children.length ? children : undefined,
      address:
        Object.keys(compactAddress).length > 0 ? compactAddress : undefined,
    };

    await createParentMut.mutateAsync(payload);
    setParentForm(INITIAL_PARENT_FORM);
    setIsParentModalOpen(false);
  }

  async function onUpdateParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingParentId) {
      setStatusMessage(
        "Nao foi possivel identificar o responsavel para editar.",
      );
      return;
    }

    const name = parentForm.name.trim();
    const document = normalizeDigits(parentForm.document);
    const email = parentForm.email.trim();
    const contact = parentForm.contact.trim();
    const birthDate = parentForm.birthDate.trim();
    const children = parentForm.children
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const addressEntries = {
      street: parentForm.addressStreet.trim(),
      number: parentForm.addressNumber.trim(),
      district: parentForm.addressDistrict.trim(),
      city: parentForm.addressCity.trim(),
      state: parentForm.addressState.trim(),
      zipCode: normalizeDigits(parentForm.addressZipCode),
      complement: parentForm.addressComplement.trim(),
      country: parentForm.addressCountry.trim(),
    };

    const compactAddress = Object.fromEntries(
      Object.entries(addressEntries).filter(([, value]) => Boolean(value)),
    );

    if (!name) {
      setStatusMessage("Nome do responsavel e obrigatorio.");
      return;
    }

    const payload: Partial<CreateParentPayload> = {
      name,
      document: document || undefined,
      email: email || undefined,
      contact: contact || undefined,
      birthDate: birthDate || undefined,
      children: children.length ? children : undefined,
      address:
        Object.keys(compactAddress).length > 0 ? compactAddress : undefined,
    };

    await updateParentMut.mutateAsync({ id: editingParentId, payload });
    setIsParentEditModalOpen(false);
    setEditingParentId(null);
    setParentForm(INITIAL_PARENT_FORM);
  }

  function openParentEditModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage("Nao foi possivel abrir a edicao deste responsavel.");
      return;
    }

    setEditingParentId(id);
    setParentForm(toParentFormState(item));
    setIsParentEditModalOpen(true);
  }

  async function onCreateChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();

    if (!name) {
      setStatusMessage("Nome da crianca e obrigatorio.");
      return;
    }

    await createChildMut.mutateAsync({ name, companyId: currentCompanyScope });
    event.currentTarget.reset();
  }

  async function onCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const childId = String(formData.get("childId") || "").trim();
    const responsibleIdWhoCheckedInId = String(
      formData.get("responsibleIdWhoCheckedInId") || "",
    ).trim();
    const notes = String(formData.get("notes") || "").trim();

    if (!childId) {
      setStatusMessage("childId e obrigatorio para check-in.");
      return;
    }

    await checkinMut.mutateAsync({
      childId,
      responsibleIdWhoCheckedInId: responsibleIdWhoCheckedInId || undefined,
      notes: notes || undefined,
      companyId: currentCompanyScope,
    });

    event.currentTarget.reset();
  }

  async function onCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const childId = String(formData.get("childId") || "").trim();
    const responsibleDocument = String(
      formData.get("responsibleDocument") || "",
    )
      .replace(/\D/g, "")
      .trim();
    const notes = String(formData.get("notes") || "").trim();

    if (!childId || !responsibleDocument) {
      setStatusMessage("childId e CPF do responsavel sao obrigatorios.");
      return;
    }

    await checkoutMut.mutateAsync({
      childId,
      responsibleDocument,
      notes: notes || undefined,
      companyId: currentCompanyScope,
    });

    event.currentTarget.reset();
  }

  async function onAssignParentChildren(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parentId = String(formData.get("parentId") || "").trim();
    const childIdsRaw = String(formData.get("childIds") || "").trim();
    const childIds = childIdsRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!parentId || !childIds.length) {
      setStatusMessage("Informe parentId e pelo menos um childId.");
      return;
    }

    await assignChildrenMut.mutateAsync({ parentId, childIds });
    event.currentTarget.reset();
  }

  async function onAssignChildParents(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const childId = String(formData.get("childId") || "").trim();
    const parentIdsRaw = String(formData.get("parentIds") || "").trim();
    const parentIds = parentIdsRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!childId || !parentIds.length) {
      setStatusMessage("Informe childId e pelo menos um parentId.");
      return;
    }

    await assignParentsMut.mutateAsync({ childId, parentIds });
    event.currentTarget.reset();
  }

  async function onCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();

    if (!name) {
      setStatusMessage("Nome da company e obrigatorio.");
      return;
    }

    await createCompanyMut.mutateAsync({ name });
    event.currentTarget.reset();
  }

  async function onBootstrapAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const bootstrapKey = String(formData.get("bootstrapKey") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!bootstrapKey || !name || !email || !password) {
      setStatusMessage("Preencha bootstrap key, nome, email e senha.");
      return;
    }

    await bootstrapAdminMut.mutateAsync({
      bootstrapKey,
      name,
      email,
      password,
    });
    event.currentTarget.reset();
  }

  function openProfileEditModal() {
    const nextDraft: Record<string, string> = {};

    profileFields.forEach((field) => {
      nextDraft[field.key] = field.value;
    });

    setProfileDraft(nextDraft);
    setIsProfileModalOpen(true);
  }

  async function onSaveProfileModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCompany) {
      const parseResult = companyUpdateSchema.safeParse({
        name: profileDraft.name || "",
        legalName: profileDraft.legalName || "",
        contact: profileDraft.contact || "",
        email: profileDraft.email || "",
      });

      if (!parseResult.success) {
        setStatusMessage("Dados invalidos no formulario de company.");
        return;
      }

      const { email, ...rest } = parseResult.data;

      await updateMyCompanyMut.mutateAsync({
        ...rest,
        email: email || undefined,
      });

      setIsProfileModalOpen(false);
      return;
    }

    if (isCollaborator) {
      await updateMyCollaboratorMut.mutateAsync({
        name: (profileDraft.name || "").trim() || undefined,
        contact: (profileDraft.contact || "").trim() || undefined,
      });
      setIsProfileModalOpen(false);
      return;
    }

    setIsProfileModalOpen(false);
  }

  function renderCrudList(title: string) {
    return (
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>{title}</h2>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, email, id..."
          />
        </div>

        <div className="crm-table">
          {pagedCollection.map((item) => {
            const typed = item as ListItem;
            const id = extractId(typed);

            return (
              <article className="crm-row" key={id || JSON.stringify(item)}>
                <div>
                  <strong>
                    {typed.name || typed.email || id || "Registro"}
                  </strong>
                  <p>
                    ID: {id || "-"}{" "}
                    {typed.companyId ? `| Company: ${typed.companyId}` : ""}
                  </p>
                </div>
                <div className="crm-row-actions">
                  {((section === "collaborators" && canManageCollaborators) ||
                    section === "parents" ||
                    section === "children" ||
                    section === "companies") && (
                    <button
                      type="button"
                      className="btn outline"
                      onClick={async () => {
                        const name = safePrompt("Novo nome:");
                        const email =
                          section === "collaborators"
                            ? safePrompt("Novo email (opcional):") || undefined
                            : undefined;

                        if (!id || !name) {
                          return;
                        }

                        if (section === "collaborators") {
                          await updateCollaboratorMut.mutateAsync({
                            id,
                            name,
                            email,
                          });
                        }

                        if (section === "parents") {
                          await updateParentMut.mutateAsync({
                            id,
                            payload: { name },
                          });
                        }

                        if (section === "children") {
                          await updateChildMut.mutateAsync({ id, name });
                        }

                        if (section === "companies") {
                          await updateCompanyMut.mutateAsync({ id, name });
                        }
                      }}
                    >
                      Alterar
                    </button>
                  )}

                  {((section === "collaborators" && canManageCollaborators) ||
                    section === "parents" ||
                    section === "children" ||
                    section === "attendance" ||
                    section === "companies") && (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={async () => {
                        if (!id) {
                          return;
                        }

                        if (section === "collaborators") {
                          await deleteCollaboratorMut.mutateAsync(id);
                        }

                        if (section === "parents") {
                          await deleteParentMut.mutateAsync(id);
                        }

                        if (section === "children") {
                          await deleteChildMut.mutateAsync(id);
                        }

                        if (section === "attendance") {
                          await deleteAttendanceMut.mutateAsync(id);
                        }

                        if (section === "companies") {
                          await deleteCompanyMut.mutateAsync(id);
                        }
                      }}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="crm-pagination">
          <button
            type="button"
            className="btn outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Anterior
          </button>
          <span>
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            className="btn outline"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Proxima
          </button>
        </div>
      </section>
    );
  }

  function renderCollaborators() {
    return (
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Colaboradores</h2>
          <button
            type="button"
            className="btn solid"
            onClick={() => {
              setCollaboratorForm(INITIAL_COLLABORATOR_FORM);
              setIsCollaboratorCreateModalOpen(true);
            }}
          >
            Adicionar
          </button>
        </div>

        <div className="crm-panel-head">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou email"
          />
        </div>

        <div className="crm-table">
          {pagedCollection.map((item) => {
            const typed = item as ListItem;
            const id = extractId(typed);

            return (
              <article
                key={id || JSON.stringify(item)}
                className="crm-row"
                onClick={() => openCollaboratorViewModal(typed)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <strong>{typed.name || "Colaborador sem nome"}</strong>
                  <p>{typed.email || "Email nao informado"}</p>
                </div>
                <div className="crm-row-actions">
                  <button
                    type="button"
                    className="btn outline"
                    title="Editar"
                    onClick={(event) => {
                      event.stopPropagation();
                      openCollaboratorEditModal(typed);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!id) {
                        return;
                      }

                      setPendingDeleteCollaboratorId(id);
                      setIsCollaboratorDeleteModalOpen(true);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })}

          {pagedCollection.length === 0 && (
            <p>Nenhum colaborador encontrado para a busca informada.</p>
          )}
        </div>

        <div className="crm-pagination">
          <button
            type="button"
            className="btn outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Anterior
          </button>
          <span>
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            className="btn outline"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Proxima
          </button>
        </div>
      </section>
    );
  }

  function renderParentsList() {
    return (
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Responsaveis</h2>
          <button
            type="button"
            className="btn solid"
            onClick={() => {
              setParentForm(INITIAL_PARENT_FORM);
              setIsParentModalOpen(true);
            }}
          >
            Novo responsavel
          </button>
        </div>

        <div className="crm-panel-head">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou CPF"
          />
        </div>

        <div className="crm-table">
          {pagedCollection.map((item) => {
            const typed = item as ListItem;
            const id = extractId(typed);
            const document = getParentDocument(typed);
            const maskedDocument = maskCpf(document);

            return (
              <article className="crm-row" key={id || JSON.stringify(item)}>
                <div>
                  <strong>{typed.name || "Responsavel sem nome"}</strong>
                  <p>{maskedDocument || "CPF nao informado"}</p>
                </div>
                <div className="crm-row-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => openParentEditModal(typed)}
                  >
                    Alterar
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={async () => {
                      if (!id) {
                        return;
                      }

                      await deleteParentMut.mutateAsync(id);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })}

          {pagedCollection.length === 0 && (
            <p>Nenhum responsavel encontrado para a busca informada.</p>
          )}
        </div>

        <div className="crm-pagination">
          <button
            type="button"
            className="btn outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Anterior
          </button>
          <span>
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            className="btn outline"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Proxima
          </button>
        </div>
      </section>
    );
  }

  return (
    <main className="crm-shell">
      <aside className="crm-sidebar">
        <div>
          <p className="auth-kicker">{authRoleLabels[role]}</p>
          <h1>Painel CRM</h1>
          <p>{session?.email || "Usuario autenticado"}</p>
        </div>

        {isAdminOrMaster && (
          <div className="crm-scope">
            <label htmlFor="company-scope">Filtro company (opcional)</label>
            <input
              id="company-scope"
              value={companyScope}
              onChange={(event) => setCompanyScope(event.target.value.trim())}
              placeholder="Digite companyId"
            />
          </div>
        )}

        <nav className="crm-menu">
          {availableSections.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`crm-menu-item ${section === item.id ? "active" : ""}`}
              onClick={() => {
                setSection(item.id);
                setSearch("");
                setPage(1);
                setStatusMessage(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="crm-sidebar-actions">
          <Link to="/" className="btn outline auth-back">
            Voltar para Home
          </Link>
          <button
            type="button"
            className="btn solid"
            onClick={() => {
              void logout();
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <section className="crm-content">
        {statusMessage ? <p className="auth-kicker">{statusMessage}</p> : null}

        {section === "profile" && (
          <>
            <section className="crm-panel">
              <div className="crm-panel-head">
                <h2>Meu perfil</h2>
                {(isCompany || isCollaborator) && (
                  <button
                    type="button"
                    className="btn solid"
                    onClick={openProfileEditModal}
                  >
                    Alterar dados
                  </button>
                )}
              </div>

              {(myCompanyQuery.isLoading && isCompany) ||
              (myCollaboratorQuery.isLoading && isCollaborator) ? (
                <p>Carregando dados do perfil...</p>
              ) : (
                <>
                  {personalProfileFields.length > 0 && (
                    <div className="profile-section">
                      <h3>Dados pessoais</h3>
                      <div className="profile-grid">
                        {personalProfileFields.map((field) => (
                          <article key={field.key} className="profile-card">
                            <span>{field.label}</span>
                            <strong>{field.value || "-"}</strong>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}

                  {addressProfileFields.length > 0 && (
                    <div className="profile-section">
                      <h3>Endereco</h3>
                      <div className="profile-grid">
                        {addressProfileFields.map((field) => (
                          <article key={field.key} className="profile-card">
                            <span>{field.label}</span>
                            <strong>{field.value || "-"}</strong>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {section === "companies" && isAdminOrMaster && (
          <>
            <section className="crm-panel">
              <h2>Criar company</h2>
              <form className="crm-form-inline" onSubmit={onCreateCompany}>
                <input name="name" placeholder="Nome da company" required />
                <button className="btn solid" type="submit">
                  Criar
                </button>
              </form>
            </section>
            {renderCrudList("Companies")}
          </>
        )}

        {section === "collaborators" && canManageCollaborators && (
          <>{renderCollaborators()}</>
        )}

        {section === "parents" && !isAdminOrMaster && (
          <>{renderParentsList()}</>
        )}

        {section === "children" && (
          <>
            <section className="crm-panel">
              <h2>Cadastrar crianca</h2>
              <form className="crm-form-inline" onSubmit={onCreateChild}>
                <input name="name" placeholder="Nome" required />
                <button className="btn solid" type="submit">
                  Cadastrar
                </button>
              </form>
            </section>
            {renderCrudList("Criancas")}
          </>
        )}

        {section === "links" && !isAdminOrMaster && (
          <>
            <section className="crm-panel">
              <h2>Vincular childs a um parent</h2>
              <form className="crm-form-grid" onSubmit={onAssignParentChildren}>
                <input name="parentId" placeholder="parentId" required />
                <input
                  name="childIds"
                  placeholder="childIds separados por virgula"
                  required
                />
                <button className="btn solid" type="submit">
                  Vincular
                </button>
              </form>
            </section>

            <section className="crm-panel">
              <h2>Vincular parents a um child</h2>
              <form className="crm-form-grid" onSubmit={onAssignChildParents}>
                <input name="childId" placeholder="childId" required />
                <input
                  name="parentIds"
                  placeholder="parentIds separados por virgula"
                  required
                />
                <button className="btn solid" type="submit">
                  Vincular
                </button>
              </form>
            </section>
          </>
        )}

        {section === "attendance" && (
          <>
            <section className="crm-panel">
              <h2>Check-in</h2>
              <form className="crm-form-grid" onSubmit={onCheckin}>
                <input name="childId" placeholder="childId" required />
                <input
                  name="responsibleIdWhoCheckedInId"
                  placeholder="responsibleIdWhoCheckedInId (opcional)"
                />
                <input name="notes" placeholder="Observacoes" />
                <button className="btn solid" type="submit">
                  Realizar check-in
                </button>
              </form>
            </section>

            <section className="crm-panel">
              <h2>Check-out</h2>
              <form className="crm-form-grid" onSubmit={onCheckout}>
                <input name="childId" placeholder="childId" required />
                <input
                  name="responsibleDocument"
                  placeholder="CPF do responsavel"
                  required
                />
                <input name="notes" placeholder="Observacoes" />
                <button className="btn solid" type="submit">
                  Realizar check-out
                </button>
              </form>
            </section>

            {renderCrudList("Attendances")}
          </>
        )}

        {section === "master-bootstrap" && role === "master" && (
          <section className="crm-panel">
            <h2>Adicionar admin (Master only)</h2>
            <form className="crm-form-grid" onSubmit={onBootstrapAdmin}>
              <input name="bootstrapKey" placeholder="Bootstrap key" required />
              <input name="name" placeholder="Nome do admin" required />
              <input name="email" type="email" placeholder="Email" required />
              <input
                name="password"
                type="password"
                placeholder="Senha"
                required
              />
              <button className="btn solid" type="submit">
                Criar admin
              </button>
            </form>
          </section>
        )}

        {isProfileModalOpen && (
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => setIsProfileModalOpen(false)}
          >
            <section
              className="crm-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Editar perfil"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Alterar dados</h2>
              <form className="crm-form-grid" onSubmit={onSaveProfileModal}>
                {personalProfileFields.length > 0 && (
                  <div className="profile-section">
                    <h3>Dados pessoais</h3>
                    <div className="crm-form-grid">
                      {personalProfileFields.map((field) => {
                        const readOnly = !field.editable;

                        return (
                          <div key={field.key} className="field">
                            <label htmlFor={`profile-${field.key}`}>
                              {field.label}
                            </label>
                            <input
                              id={`profile-${field.key}`}
                              value={profileDraft[field.key] || ""}
                              onChange={(event) =>
                                setProfileDraft((current) => ({
                                  ...current,
                                  [field.key]: event.target.value,
                                }))
                              }
                              readOnly={readOnly}
                              disabled={readOnly}
                              className={readOnly ? "field-readonly" : ""}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {addressProfileFields.length > 0 && (
                  <div className="profile-section">
                    <h3>Endereco</h3>
                    <div className="crm-form-grid">
                      {addressProfileFields.map((field) => {
                        const readOnly = !field.editable;

                        return (
                          <div key={field.key} className="field">
                            <label htmlFor={`profile-${field.key}`}>
                              {field.label}
                            </label>
                            <input
                              id={`profile-${field.key}`}
                              value={profileDraft[field.key] || ""}
                              onChange={(event) =>
                                setProfileDraft((current) => ({
                                  ...current,
                                  [field.key]: event.target.value,
                                }))
                              }
                              readOnly={readOnly}
                              disabled={readOnly}
                              className={readOnly ? "field-readonly" : ""}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="crm-modal-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => setIsProfileModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn solid">
                    Salvar alteracoes
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {isParentModalOpen && (
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => {
              setIsParentModalOpen(false);
              setParentForm(INITIAL_PARENT_FORM);
            }}
          >
            <section
              className="crm-modal crm-modal-wide"
              role="dialog"
              aria-modal="true"
              aria-label="Adicionar responsavel"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Novo responsavel</h2>
              <form
                className="crm-form-grid parent-modal-form"
                onSubmit={onCreateParent}
              >
                <div className="parent-fields-grid">
                  <div className="field">
                    <label htmlFor="parent-name">Nome</label>
                    <input
                      id="parent-name"
                      value={parentForm.name}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-document">CPF</label>
                    <input
                      id="parent-document"
                      value={maskCpf(parentForm.document)}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          document: normalizeDigits(event.target.value).slice(
                            0,
                            11,
                          ),
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-email">Email</label>
                    <input
                      id="parent-email"
                      type="email"
                      value={parentForm.email}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-contact">Contato</label>
                    <input
                      id="parent-contact"
                      value={maskPhone(parentForm.contact)}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          contact: normalizeDigits(event.target.value).slice(
                            0,
                            11,
                          ),
                        }))
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-birth-date">
                      Data de nascimento
                    </label>
                    <input
                      id="parent-birth-date"
                      type="date"
                      value={parentForm.birthDate}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          birthDate: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-children">Children IDs</label>
                    <input
                      id="parent-children"
                      value={parentForm.children}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          children: event.target.value,
                        }))
                      }
                      placeholder="id1, id2"
                    />
                  </div>
                </div>

                <div className="profile-section parent-address-section">
                  <h3>Endereco</h3>
                  <div className="parent-address-grid">
                    <div className="field">
                      <label htmlFor="parent-address-street">Rua</label>
                      <input
                        id="parent-address-street"
                        value={parentForm.addressStreet}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressStreet: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-address-number">Numero</label>
                      <input
                        id="parent-address-number"
                        value={parentForm.addressNumber}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressNumber: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-address-district">Bairro</label>
                      <input
                        id="parent-address-district"
                        value={parentForm.addressDistrict}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressDistrict: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-address-city">Cidade</label>
                      <input
                        id="parent-address-city"
                        value={parentForm.addressCity}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressCity: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-address-state">Estado</label>
                      <input
                        id="parent-address-state"
                        value={parentForm.addressState}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressState: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-address-zip">CEP</label>
                      <input
                        id="parent-address-zip"
                        value={maskZipCode(parentForm.addressZipCode)}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressZipCode: normalizeDigits(
                              event.target.value,
                            ).slice(0, 8),
                          }))
                        }
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-address-complement">
                        Complemento
                      </label>
                      <input
                        id="parent-address-complement"
                        value={parentForm.addressComplement}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressComplement: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-address-country">Pais</label>
                      <input
                        id="parent-address-country"
                        value={parentForm.addressCountry}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressCountry: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="crm-modal-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => {
                      setIsParentModalOpen(false);
                      setParentForm(INITIAL_PARENT_FORM);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn solid">
                    Salvar responsavel
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {isParentEditModalOpen && (
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => {
              setIsParentEditModalOpen(false);
              setEditingParentId(null);
              setParentForm(INITIAL_PARENT_FORM);
            }}
          >
            <section
              className="crm-modal crm-modal-wide"
              role="dialog"
              aria-modal="true"
              aria-label="Editar responsavel"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Editar dados do responsavel</h2>
              <form
                className="crm-form-grid parent-modal-form"
                onSubmit={onUpdateParent}
              >
                <div className="parent-fields-grid">
                  <div className="field">
                    <label htmlFor="parent-edit-name">Nome</label>
                    <input
                      id="parent-edit-name"
                      value={parentForm.name}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-edit-document">CPF</label>
                    <input
                      id="parent-edit-document"
                      value={maskCpf(parentForm.document)}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          document: normalizeDigits(event.target.value).slice(
                            0,
                            11,
                          ),
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-edit-email">Email</label>
                    <input
                      id="parent-edit-email"
                      type="email"
                      value={parentForm.email}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-edit-contact">Contato</label>
                    <input
                      id="parent-edit-contact"
                      value={maskPhone(parentForm.contact)}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          contact: normalizeDigits(event.target.value).slice(
                            0,
                            11,
                          ),
                        }))
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-edit-birth-date">
                      Data de nascimento
                    </label>
                    <input
                      id="parent-edit-birth-date"
                      type="date"
                      value={parentForm.birthDate}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          birthDate: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="parent-edit-children">Children IDs</label>
                    <input
                      id="parent-edit-children"
                      value={parentForm.children}
                      onChange={(event) =>
                        setParentForm((current) => ({
                          ...current,
                          children: event.target.value,
                        }))
                      }
                      placeholder="id1, id2"
                    />
                  </div>
                </div>

                <div className="profile-section parent-address-section">
                  <h3>Endereco</h3>
                  <div className="parent-address-grid">
                    <div className="field">
                      <label htmlFor="parent-edit-address-street">Rua</label>
                      <input
                        id="parent-edit-address-street"
                        value={parentForm.addressStreet}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressStreet: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-edit-address-number">Numero</label>
                      <input
                        id="parent-edit-address-number"
                        value={parentForm.addressNumber}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressNumber: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-edit-address-district">
                        Bairro
                      </label>
                      <input
                        id="parent-edit-address-district"
                        value={parentForm.addressDistrict}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressDistrict: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-edit-address-city">Cidade</label>
                      <input
                        id="parent-edit-address-city"
                        value={parentForm.addressCity}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressCity: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-edit-address-state">Estado</label>
                      <input
                        id="parent-edit-address-state"
                        value={parentForm.addressState}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressState: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-edit-address-zip">CEP</label>
                      <input
                        id="parent-edit-address-zip"
                        value={maskZipCode(parentForm.addressZipCode)}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressZipCode: normalizeDigits(
                              event.target.value,
                            ).slice(0, 8),
                          }))
                        }
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-edit-address-complement">
                        Complemento
                      </label>
                      <input
                        id="parent-edit-address-complement"
                        value={parentForm.addressComplement}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressComplement: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="parent-edit-address-country">Pais</label>
                      <input
                        id="parent-edit-address-country"
                        value={parentForm.addressCountry}
                        onChange={(event) =>
                          setParentForm((current) => ({
                            ...current,
                            addressCountry: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="crm-modal-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => {
                      setIsParentEditModalOpen(false);
                      setEditingParentId(null);
                      setParentForm(INITIAL_PARENT_FORM);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn solid">
                    Salvar alteracoes
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {isCollaboratorViewModalOpen && viewingCollaboratorId && (
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => {
              setIsCollaboratorViewModalOpen(false);
              setViewingCollaboratorId(null);
            }}
          >
            <section
              className="crm-modal crm-modal-wide collaborator-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Visualizar colaborador"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Detalhes do Colaborador</h2>
              {(() => {
                const collaborator = collaborators.find(
                  (c) => extractId(c) === viewingCollaboratorId,
                );
                if (!collaborator) {
                  return <p>Colaborador nao encontrado.</p>;
                }

                const flattened = flattenRecord(
                  collaborator as Record<string, unknown>,
                );
                const personalKeys = sortByPriority(
                  Object.keys(flattened).filter(
                    (key) => !key.startsWith("address."),
                  ),
                  [
                    "name",
                    "email",
                    "document",
                    "contact",
                    "birthDate",
                    "id",
                    "_id",
                    "uid",
                    "companyId",
                  ],
                );
                const addressKeys = sortByPriority(
                  Object.keys(flattened).filter((key) =>
                    key.startsWith("address."),
                  ),
                  [
                    "address.street",
                    "address.number",
                    "address.district",
                    "address.city",
                    "address.state",
                    "address.zipCode",
                    "address.complement",
                    "address.country",
                  ],
                );

                const renderCards = (keys: string[]) =>
                  keys.length > 0 ? (
                    <div className="profile-grid collaborator-grid">
                      {keys.map((key) => (
                        <article key={key} className="profile-card">
                          <span>{toFieldLabel(key)}</span>
                          <strong>
                            {maskByFieldKey(key, flattened[key]) || "-"}
                          </strong>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="crm-empty-state">Nenhum dado encontrado.</p>
                  );

                return (
                  <div className="crm-modal-sections">
                    <section className="profile-section">
                      <h3>Dados pessoais</h3>
                      {renderCards(personalKeys)}
                    </section>

                    <section className="profile-section">
                      <h3>Endereco</h3>
                      {renderCards(addressKeys)}
                    </section>
                  </div>
                );
              })()}

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => {
                    setIsCollaboratorViewModalOpen(false);
                    setViewingCollaboratorId(null);
                  }}
                >
                  Fechar
                </button>
              </div>
            </section>
          </div>
        )}

        {isCollaboratorCreateModalOpen && (
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => setIsCollaboratorCreateModalOpen(false)}
          >
            <section
              className="crm-modal crm-modal-wide collaborator-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Adicionar colaborador"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Novo Colaborador</h2>
              <form
                className="crm-form-grid collaborator-form"
                onSubmit={onCreateCollaboratorModal}
              >
                <section className="profile-section">
                  <h3>Dados pessoais</h3>
                  <div className="collaborator-section-grid">
                    <div className="field">
                      <label htmlFor="col-name">Nome</label>
                      <input
                        id="col-name"
                        value={collaboratorForm.name}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Nome completo"
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-email">Email</label>
                      <input
                        id="col-email"
                        type="email"
                        value={collaboratorForm.email}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-document">CPF/CNPJ</label>
                      <input
                        id="col-document"
                        value={maskByFieldKey(
                          "document",
                          collaboratorForm.document,
                        )}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            document: normalizeDigits(event.target.value).slice(
                              0,
                              14,
                            ),
                          }))
                        }
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-contact">Contato</label>
                      <input
                        id="col-contact"
                        value={maskPhone(collaboratorForm.contact)}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            contact: normalizeDigits(event.target.value).slice(
                              0,
                              11,
                            ),
                          }))
                        }
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-birth-date">Data de nascimento</label>
                      <input
                        id="col-birth-date"
                        type="date"
                        value={collaboratorForm.birthDate}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            birthDate: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="profile-section">
                  <h3>Endereco</h3>
                  <div className="collaborator-section-grid collaborator-address-grid">
                    <div className="field field-span-2">
                      <label htmlFor="col-address-street">Rua</label>
                      <input
                        id="col-address-street"
                        value={collaboratorForm.addressStreet}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressStreet: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-address-number">Numero</label>
                      <input
                        id="col-address-number"
                        value={collaboratorForm.addressNumber}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressNumber: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-address-district">Bairro</label>
                      <input
                        id="col-address-district"
                        value={collaboratorForm.addressDistrict}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressDistrict: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-address-city">Cidade</label>
                      <input
                        id="col-address-city"
                        value={collaboratorForm.addressCity}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressCity: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-address-state">Estado</label>
                      <input
                        id="col-address-state"
                        value={collaboratorForm.addressState}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressState: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-address-zip">CEP</label>
                      <input
                        id="col-address-zip"
                        value={maskZipCode(collaboratorForm.addressZipCode)}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressZipCode: normalizeDigits(
                              event.target.value,
                            ).slice(0, 8),
                          }))
                        }
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="field field-span-2">
                      <label htmlFor="col-address-complement">
                        Complemento
                      </label>
                      <input
                        id="col-address-complement"
                        value={collaboratorForm.addressComplement}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressComplement: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-address-country">Pais</label>
                      <input
                        id="col-address-country"
                        value={collaboratorForm.addressCountry}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressCountry: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <div className="crm-modal-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => {
                      setIsCollaboratorCreateModalOpen(false);
                      setCollaboratorForm(INITIAL_COLLABORATOR_FORM);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn solid">
                    Salvar colaborador
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {isCollaboratorEditModalOpen && editingCollaboratorId && (
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => {
              setIsCollaboratorEditModalOpen(false);
              setEditingCollaboratorId(null);
            }}
          >
            <section
              className="crm-modal crm-modal-wide collaborator-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Editar colaborador"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Editar Colaborador</h2>
              <form
                className="crm-form-grid collaborator-form"
                onSubmit={onUpdateCollaboratorModal}
              >
                <section className="profile-section">
                  <h3>Dados pessoais</h3>
                  <div className="collaborator-section-grid">
                    <div className="field">
                      <label htmlFor="col-edit-name">Nome</label>
                      <input
                        id="col-edit-name"
                        value={collaboratorForm.name}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Nome completo"
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-email">Email</label>
                      <input
                        id="col-edit-email"
                        type="email"
                        value={collaboratorForm.email}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-document">CPF/CNPJ</label>
                      <input
                        id="col-edit-document"
                        value={maskByFieldKey(
                          "document",
                          collaboratorForm.document,
                        )}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            document: normalizeDigits(event.target.value).slice(
                              0,
                              14,
                            ),
                          }))
                        }
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-contact">Contato</label>
                      <input
                        id="col-edit-contact"
                        value={maskPhone(collaboratorForm.contact)}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            contact: normalizeDigits(event.target.value).slice(
                              0,
                              11,
                            ),
                          }))
                        }
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-birth-date">
                        Data de nascimento
                      </label>
                      <input
                        id="col-edit-birth-date"
                        type="date"
                        value={collaboratorForm.birthDate}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            birthDate: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="profile-section">
                  <h3>Endereco</h3>
                  <div className="collaborator-section-grid collaborator-address-grid">
                    <div className="field field-span-2">
                      <label htmlFor="col-edit-address-street">Rua</label>
                      <input
                        id="col-edit-address-street"
                        value={collaboratorForm.addressStreet}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressStreet: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-address-number">Numero</label>
                      <input
                        id="col-edit-address-number"
                        value={collaboratorForm.addressNumber}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressNumber: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-address-district">Bairro</label>
                      <input
                        id="col-edit-address-district"
                        value={collaboratorForm.addressDistrict}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressDistrict: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-address-city">Cidade</label>
                      <input
                        id="col-edit-address-city"
                        value={collaboratorForm.addressCity}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressCity: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-address-state">Estado</label>
                      <input
                        id="col-edit-address-state"
                        value={collaboratorForm.addressState}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressState: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-address-zip">CEP</label>
                      <input
                        id="col-edit-address-zip"
                        value={maskZipCode(collaboratorForm.addressZipCode)}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressZipCode: normalizeDigits(
                              event.target.value,
                            ).slice(0, 8),
                          }))
                        }
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="field field-span-2">
                      <label htmlFor="col-edit-address-complement">
                        Complemento
                      </label>
                      <input
                        id="col-edit-address-complement"
                        value={collaboratorForm.addressComplement}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressComplement: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="col-edit-address-country">Pais</label>
                      <input
                        id="col-edit-address-country"
                        value={collaboratorForm.addressCountry}
                        onChange={(event) =>
                          setCollaboratorForm((current) => ({
                            ...current,
                            addressCountry: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <div className="crm-modal-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => {
                      setIsCollaboratorEditModalOpen(false);
                      setEditingCollaboratorId(null);
                      setCollaboratorForm(INITIAL_COLLABORATOR_FORM);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn solid">
                    Salvar alteracoes
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {isCollaboratorDeleteModalOpen && pendingDeleteCollaboratorId && (
          <div
            className="crm-modal-backdrop"
            role="presentation"
            onClick={() => {
              setIsCollaboratorDeleteModalOpen(false);
              setPendingDeleteCollaboratorId(null);
            }}
          >
            <section
              className="crm-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Confirmar exclusao"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Confirmar exclusao</h2>
              <p>Quer mesmo excluir este colaborador?</p>

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => {
                    setIsCollaboratorDeleteModalOpen(false);
                    setPendingDeleteCollaboratorId(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={async () => {
                    if (pendingDeleteCollaboratorId) {
                      await deleteCollaboratorMut.mutateAsync(
                        pendingDeleteCollaboratorId,
                      );
                    }

                    setIsCollaboratorDeleteModalOpen(false);
                    setPendingDeleteCollaboratorId(null);
                  }}
                >
                  Excluir
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
