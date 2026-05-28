import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "../WorkspaceContext";
import { extractId, normalizeDigits } from "../formatter";
import { listChildren } from "../../../api/modules/childApi";
import { listParents } from "../../../api/modules/parentApi";
import { listCollaborators } from "../../../api/modules/collaboratorApi";
import {
  checkin,
  checkout,
  getCompanyLastCheckinAndCheckout,
  listCompanyLast10Attendances,
  listActiveCheckins,
  type CheckinPayload,
  type CheckoutPayload,
} from "../../../api/modules/attendanceApi";
import type {
  Attendance,
  Child,
  Collaborator,
  Parent,
} from "../../../domain/entities";

type DashboardAttendanceItem = Attendance & {
  childDisplayName: string;
  collaboratorDisplayName: string;
  checkInLabel: string;
  checkInEpoch: number;
};

type DashboardAttendanceCardItem = {
  id: string;
  childDisplayName: string;
  collaboratorDisplayName: string;
  checkInLabel: string;
  checkOutLabel: string;
  checkInEpoch: number;
  checkOutEpoch: number;
  sortEpoch: number;
};

function toEpoch(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (value instanceof Date) {
    const parsed = value.getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record._seconds === "number") {
      return record._seconds * 1000;
    }
    if (typeof record.seconds === "number") {
      return record.seconds * 1000;
    }
  }

  return 0;
}

function formatDateTime(value: unknown): string {
  const epoch = toEpoch(value);
  if (!epoch) {
    return "";
  }

  return new Date(epoch).toLocaleString("pt-BR");
}

function getAttendanceCheckInValue(item: Attendance): unknown {
  return (
    item.checkInTime ||
    (item as Record<string, unknown>).checkedInAt ||
    (item as Record<string, unknown>).checkInAt ||
    (item as Record<string, unknown>).checkedInTime
  );
}

function getAttendanceCheckOutValue(item: Attendance): unknown {
  return (
    item.checkedOutAt ||
    (item as Record<string, unknown>).checkOutTime ||
    (item as Record<string, unknown>).checkOutAt ||
    (item as Record<string, unknown>).checkedOutTime
  );
}

function isAttendanceLike(value: unknown): value is Attendance {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("childId" in value ||
      "checkInTime" in value ||
      "checkedInAt" in value ||
      "checkedOutAt" in value ||
      "checkOutTime" in value)
  );
}

function getAttendanceFromRecord(
  payload: unknown,
  keys: string[],
): Attendance | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (isAttendanceLike(value)) {
      return value;
    }
  }

  return null;
}

function resolveLatestAttendancePair(payload: unknown): {
  lastCheckin: Attendance | null;
  lastCheckout: Attendance | null;
} {
  if (Array.isArray(payload)) {
    return {
      lastCheckin: isAttendanceLike(payload[0]) ? payload[0] : null,
      lastCheckout: isAttendanceLike(payload[1]) ? payload[1] : null,
    };
  }

  if (isAttendanceLike(payload)) {
    return {
      lastCheckin: payload,
      lastCheckout: payload,
    };
  }

  return {
    lastCheckin: getAttendanceFromRecord(payload, [
      "lastCheckin",
      "lastCheckIn",
      "checkin",
      "checkIn",
      "lastCheckinAttendance",
      "lastCheckInAttendance",
    ]),
    lastCheckout: getAttendanceFromRecord(payload, [
      "lastCheckout",
      "lastCheckOut",
      "checkout",
      "checkOut",
      "lastCheckoutAttendance",
      "lastCheckOutAttendance",
    ]),
  };
}

function toDashboardAttendanceCardItem(
  item: Attendance | null,
): DashboardAttendanceCardItem | null {
  if (!item) {
    return null;
  }

  const checkInValue = getAttendanceCheckInValue(item);
  const checkOutValue = getAttendanceCheckOutValue(item);
  const checkInEpoch = toEpoch(checkInValue);
  const checkOutEpoch = toEpoch(checkOutValue);

  return {
    id: String(item.id || ""),
    childDisplayName:
      getChildName(item, "Crianca sem nome") || "Crianca sem nome",
    collaboratorDisplayName:
      getCollaboratorName(item, "Colaborador sem nome") ||
      "Colaborador sem nome",
    checkInLabel: formatDateTime(checkInValue),
    checkOutLabel: formatDateTime(checkOutValue),
    checkInEpoch,
    checkOutEpoch,
    sortEpoch: Math.max(checkInEpoch, checkOutEpoch),
  };
}

function getSnapshotName(snapshot: unknown, fallback: string): string {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return fallback;
  }

  const record = snapshot as Record<string, unknown>;
  return String(record.name || fallback);
}

function getCollaboratorName(item: Attendance, fallback: string): string {
  return (
    getSnapshotName(item.collaboratorCheckedInSnapshot, fallback) ||
    getSnapshotName(item.collaboratorCheckedOutSnapshot, fallback) ||
    fallback
  );
}

function getChildName(item: Attendance, fallback: string): string {
  return getSnapshotName(item.childSnapshot, fallback) || fallback;
}

function resolveParentName(item: Parent): string {
  return String(item.name || "Responsavel sem nome");
}

function resolveChildName(item: Child): string {
  return String(item.name || "Crianca sem nome");
}

export function useDashboard() {
  const queryClient = useQueryClient();
  const {
    role,
    section,
    setStatusMessage,
    currentCompanyScope,
    isAdminOrMaster,
  } = useWorkspaceContext();

  const [checkinChildSearch, setCheckinChildSearch] = useState("");
  const [selectedCheckinChildId, setSelectedCheckinChildId] = useState("");
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [checkinResponsibleSearch, setCheckinResponsibleSearch] = useState("");
  const [selectedCheckinResponsibleId, setSelectedCheckinResponsibleId] =
    useState("");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedCheckoutAttendance, setSelectedCheckoutAttendance] =
    useState<DashboardAttendanceItem | null>(null);
  const [checkoutResponsibleDocument, setCheckoutResponsibleDocument] =
    useState("");

  const childrenQuery = useQuery({
    queryKey: ["dashboard", "children", currentCompanyScope, role],
    queryFn: () => listChildren(currentCompanyScope),
    enabled: section === "dashboard",
    staleTime: 60_000,
  });

  const parentsQuery = useQuery({
    queryKey: ["dashboard", "parents", currentCompanyScope, role],
    queryFn: () => listParents(currentCompanyScope),
    enabled: section === "dashboard",
    staleTime: 60_000,
  });

  const collaboratorsQuery = useQuery({
    queryKey: ["dashboard", "collaborators", currentCompanyScope, role],
    queryFn: () => listCollaborators(currentCompanyScope),
    enabled: section === "dashboard" && role === "company",
    staleTime: 60_000,
  });

  const activeAttendancesQuery = useQuery({
    queryKey: ["dashboard", "active-attendances", currentCompanyScope, role],
    queryFn: () => listActiveCheckins(currentCompanyScope),
    enabled: section === "dashboard",
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  const latestCheckinAndCheckoutQuery = useQuery({
    queryKey: [
      "dashboard",
      "last-checkin-and-checkout",
      currentCompanyScope,
      role,
    ],
    queryFn: () => getCompanyLastCheckinAndCheckout(currentCompanyScope),
    enabled: section === "dashboard",
    staleTime: 60_000,
  });

  const last10AttendancesQuery = useQuery({
    queryKey: ["dashboard", "last10", currentCompanyScope, role],
    queryFn: () => listCompanyLast10Attendances(currentCompanyScope),
    enabled: section === "dashboard",
    staleTime: 60_000,
  });

  const checkinMut = useMutation<unknown, Error, CheckinPayload>({
    mutationFn: checkin,
    onSuccess: async () => {
      setStatusMessage("Check-in realizado com sucesso.");
      setCheckinChildSearch("");
      setSelectedCheckinChildId("");
      setIsCheckinModalOpen(false);
      setCheckinResponsibleSearch("");
      setSelectedCheckinResponsibleId("");
      setCheckinNotes("");
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      setStatusMessage(error.message);
    },
  });

  const checkoutMut = useMutation<unknown, Error, CheckoutPayload>({
    mutationFn: checkout,
    onSuccess: async () => {
      setStatusMessage("Check-out realizado com sucesso.");
      setIsCheckoutModalOpen(false);
      setSelectedCheckoutAttendance(null);
      setCheckoutResponsibleDocument("");
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      setStatusMessage(error.message);
    },
  });

  const children = (childrenQuery.data || []) as Child[];
  const parents = (parentsQuery.data || []) as Parent[];
  const collaborators = (collaboratorsQuery.data || []) as Collaborator[];
  const activeAttendances = (activeAttendancesQuery.data || []) as Attendance[];
  const latestAttendancePair = useMemo(
    () => resolveLatestAttendancePair(latestCheckinAndCheckoutQuery.data),
    [latestCheckinAndCheckoutQuery.data],
  );
  const latestCheckinCard = useMemo(
    () => toDashboardAttendanceCardItem(latestAttendancePair.lastCheckin),
    [latestAttendancePair.lastCheckin],
  );
  const latestCheckoutCard = useMemo(
    () => toDashboardAttendanceCardItem(latestAttendancePair.lastCheckout),
    [latestAttendancePair.lastCheckout],
  );
  const last10AttendanceCards = useMemo(
    () =>
      ((last10AttendancesQuery.data || []) as Attendance[])
        .map((item) => toDashboardAttendanceCardItem(item))
        .filter((item): item is DashboardAttendanceCardItem => item !== null)
        .sort((left, right) => right.sortEpoch - left.sortEpoch),
    [last10AttendancesQuery.data],
  );

  const childOptions = useMemo(
    () =>
      children
        .map((item) => ({
          id: extractId(item),
          name: resolveChildName(item),
        }))
        .filter((option) => {
          const term = checkinChildSearch.trim().toLowerCase();
          if (!option.id) {
            return false;
          }
          if (!term) {
            return true;
          }
          return (
            option.name.toLowerCase().includes(term) ||
            option.id.toLowerCase().includes(term)
          );
        }),
    [children, checkinChildSearch],
  );

  const selectedCheckinChild = useMemo(
    () =>
      children.find((item) => extractId(item) === selectedCheckinChildId) ||
      null,
    [children, selectedCheckinChildId],
  );

  const responsibleOptions = useMemo(() => {
    if (!selectedCheckinChildId) {
      return [];
    }

    const childParentIds = selectedCheckinChild?.parents
      ? Array.isArray(selectedCheckinChild.parents)
        ? selectedCheckinChild.parents
        : (selectedCheckinChild.parents as unknown as string)
            .split(",")
            .map((id: string) => id.trim())
      : [];

    return parents
      .filter((parent) => childParentIds.includes(extractId(parent)))
      .map((item) => ({
        id: extractId(item),
        name: resolveParentName(item),
      }))
      .filter((option) => {
        const term = checkinResponsibleSearch.trim().toLowerCase();
        if (!option.id) {
          return false;
        }
        if (!term) {
          return true;
        }
        return (
          option.name.toLowerCase().includes(term) ||
          option.id.toLowerCase().includes(term)
        );
      });
  }, [
    parents,
    selectedCheckinChild,
    selectedCheckinChildId,
    checkinResponsibleSearch,
  ]);

  const dashboardAttendances = useMemo<DashboardAttendanceItem[]>(() => {
    return activeAttendances
      .map((item) => {
        const childName =
          getChildName(item, "Crianca sem nome") || "Crianca sem nome";
        const collaboratorName =
          getCollaboratorName(item, "Colaborador sem nome") ||
          "Colaborador sem nome";
        const checkInValue = getAttendanceCheckInValue(item);

        return {
          ...item,
          childDisplayName: childName,
          collaboratorDisplayName: collaboratorName,
          checkInLabel: formatDateTime(checkInValue),
          checkInEpoch: toEpoch(checkInValue),
        };
      })
      .sort((left, right) => right.checkInEpoch - left.checkInEpoch);
  }, [activeAttendances]);

  const dashboardMetrics = {
    totalChildren: children.length,
    totalParents: parents.length,
    totalCollaborators: collaborators.length,
    totalActiveAttendances: dashboardAttendances.length,
  };

  function toggleCheckinChildSelection(childId: string) {
    setSelectedCheckinChildId(childId);
  }

  function toggleCheckinResponsibleSelection(parentId: string) {
    setSelectedCheckinResponsibleId(parentId);
  }

  function openCheckinModal() {
    setCheckinChildSearch("");
    setSelectedCheckinChildId("");
    setCheckinResponsibleSearch("");
    setSelectedCheckinResponsibleId("");
    setCheckinNotes("");
    setIsCheckinModalOpen(true);
  }

  function closeCheckinModal() {
    setIsCheckinModalOpen(false);
    setCheckinResponsibleSearch("");
    setSelectedCheckinResponsibleId("");
    setCheckinNotes("");
  }

  function openCheckoutModal(attendance: DashboardAttendanceItem) {
    setSelectedCheckoutAttendance(attendance);
    setCheckoutResponsibleDocument("");
    setIsCheckoutModalOpen(true);
  }

  function closeCheckoutModal() {
    setIsCheckoutModalOpen(false);
    setSelectedCheckoutAttendance(null);
    setCheckoutResponsibleDocument("");
  }

  async function onCheckinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCheckinChildId) {
      setStatusMessage("Selecione uma crianca para registrar o check-in.");
      return;
    }

    if (!selectedCheckinResponsibleId) {
      setStatusMessage("Selecione o responsavel que esta fazendo o check-in.");
      return;
    }

    if (isAdminOrMaster && !currentCompanyScope) {
      setStatusMessage("Informe o companyId para registrar o check-in.");
      return;
    }

    await checkinMut.mutateAsync({
      childId: selectedCheckinChildId,
      responsibleIdWhoCheckedInId: selectedCheckinResponsibleId,
      notes: checkinNotes.trim() || undefined,
      companyId: currentCompanyScope,
    });
  }

  async function onCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCheckoutAttendance?.childId) {
      setStatusMessage("Selecione uma crianca valida para o check-out.");
      return;
    }

    const responsibleDocument = normalizeDigits(
      checkoutResponsibleDocument,
    ).slice(0, 11);

    if (!responsibleDocument) {
      setStatusMessage("CPF do responsavel e obrigatorio para check-out.");
      return;
    }

    if (isAdminOrMaster && !currentCompanyScope) {
      setStatusMessage("Informe o companyId para realizar o check-out.");
      return;
    }

    await checkoutMut.mutateAsync({
      childId: selectedCheckoutAttendance.childId,
      responsibleDocument,
      companyId: currentCompanyScope,
    });
  }

  return {
    childrenQuery,
    parentsQuery,
    collaboratorsQuery,
    activeAttendancesQuery,
    latestCheckinAndCheckoutQuery,
    last10AttendancesQuery,
    checkinMut,
    checkoutMut,
    checkinChildSearch,
    setCheckinChildSearch,
    selectedCheckinChildId,
    toggleCheckinChildSelection,
    isCheckinModalOpen,
    setIsCheckinModalOpen,
    checkinResponsibleSearch,
    setCheckinResponsibleSearch,
    selectedCheckinResponsibleId,
    toggleCheckinResponsibleSelection,
    checkinNotes,
    setCheckinNotes,
    openCheckinModal,
    closeCheckinModal,
    childOptions,
    responsibleOptions,
    dashboardMetrics,
    dashboardAttendances,
    latestCheckinCard,
    latestCheckoutCard,
    last10AttendanceCards,
    isCheckoutModalOpen,
    selectedCheckoutAttendance,
    checkoutResponsibleDocument,
    setCheckoutResponsibleDocument,
    openCheckoutModal,
    closeCheckoutModal,
    onCheckinSubmit,
    onCheckoutSubmit,
  };
}
