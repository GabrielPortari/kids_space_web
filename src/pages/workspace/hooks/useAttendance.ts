import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import {
  checkin,
  checkout,
  listAttendances,
  type CheckinPayload,
  type CheckoutPayload,
} from "../../../api/modules/attendanceApi";
import { getChildName } from "../../../api/modules/childApi";
import type { ListItem } from "../types";
import { matchesSearch, paginate } from "../formatter";
import { useWorkspaceContext } from "../WorkspaceContext";
import { PAGE_SIZE } from "../constants";

export function useAttendance() {
  const queryClient = useQueryClient();
  const { role, section, search, page, setStatusMessage, currentCompanyScope } =
    useWorkspaceContext();

  // State
  const [isAttendanceViewModalOpen, setIsAttendanceViewModalOpen] =
    useState(false);
  const [viewingAttendanceId, setViewingAttendanceId] = useState<string | null>(
    null,
  );
  const [viewingAttendance, setViewingAttendance] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [childNamesMap, setChildNamesMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [requestedChildIds, setRequestedChildIds] = useState<Set<string>>(
    new Set(),
  );

  // Queries
  const attendancesQuery = useQuery({
    queryKey: ["attendances", currentCompanyScope, role],
    queryFn: () => listAttendances(currentCompanyScope),
    enabled: section === "attendance",
  });

  // Mutations
  const checkinMut = useMutation<unknown, Error, CheckinPayload>({
    mutationFn: checkin,
    onSuccess: async () => {
      setStatusMessage("Check-in realizado.");
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  const checkoutMut = useMutation<unknown, Error, CheckoutPayload>({
    mutationFn: checkout,
    onSuccess: async () => {
      setStatusMessage("Check-out realizado.");
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  // Resolve child names
  const attendances = attendancesQuery.data || [];
  const resolvedAttendances = attendances.map((item: any) => ({
    ...item,
    childName:
      childNamesMap.get(item.childId) || item.childName || "Crianca sem nome",
  }));

  // Derived
  const filteredCollection = resolvedAttendances.filter((item: ListItem) =>
    matchesSearch(item as ListItem, search),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCollection.length / PAGE_SIZE),
  );
  const pagedCollection = paginate(filteredCollection, page, PAGE_SIZE);

  // Resolve child names from endpoint
  useEffect(() => {
    const unresolvedChildIds = attendances
      .map((item: any) => item.childId)
      .filter(
        (childId: string) =>
          childId &&
          !childNamesMap.has(childId) &&
          !requestedChildIds.has(childId),
      );

    if (unresolvedChildIds.length === 0) return;

    (async () => {
      const newNames = new Map(childNamesMap);
      const newRequested = new Set(requestedChildIds);

      await Promise.all(
        unresolvedChildIds.map(async (childId: string) => {
          newRequested.add(childId);
          const name = await getChildName(childId);
          if (name) {
            newNames.set(childId, name);
          }
        }),
      );

      setChildNamesMap(newNames);
      setRequestedChildIds(newRequested);
    })();
  }, [attendances]);

  // Handlers
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

  function openAttendanceViewModal(item: Record<string, unknown>) {
    setViewingAttendance(item);
    setViewingAttendanceId(String(item.id || ""));
    setIsAttendanceViewModalOpen(true);
  }

  return {
    // state
    isAttendanceViewModalOpen,
    setIsAttendanceViewModalOpen,
    viewingAttendanceId,
    setViewingAttendanceId,
    viewingAttendance,
    setViewingAttendance,

    // queries/mutations
    attendancesQuery,
    checkinMut,
    checkoutMut,

    // derived
    attendances: resolvedAttendances,
    filteredCollection,
    totalPages,
    pagedCollection,

    // handlers
    onCheckin,
    onCheckout,
    openAttendanceViewModal,
  };
}
