import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import {
  checkin,
  checkout,
  deleteAttendance,
  listAttendances,
  type CheckinPayload,
  type CheckoutPayload,
} from "../../../api/modules/attendanceApi";
import { listAttendancesAdmin } from "../../../api/modules/adminApi";
import type { ListItem } from "../types";
import { matchesSearch, paginate } from "../formatter";
import { useWorkspaceContext } from "../WorkspaceContext";
import { PAGE_SIZE } from "../constants";

export function useAttendance() {
  const queryClient = useQueryClient();
  const {
    role,
    section,
    search,
    page,
    setStatusMessage,
    isAdminOrMaster,
    currentCompanyScope,
  } = useWorkspaceContext();

  // Queries
  const attendancesQuery = useQuery({
    queryKey: ["attendances", currentCompanyScope, role],
    queryFn: () =>
      isAdminOrMaster
        ? listAttendancesAdmin(currentCompanyScope)
        : listAttendances(currentCompanyScope),
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

  const deleteAttendanceMut = useMutation<unknown, Error, string>({
    mutationFn: deleteAttendance,
    onSuccess: async () => {
      setStatusMessage("Attendance removida.");
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  // Derived
  const attendances = attendancesQuery.data || [];
  const filteredCollection = attendances.filter((item: ListItem) =>
    matchesSearch(item as ListItem, search),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCollection.length / PAGE_SIZE),
  );
  const pagedCollection = paginate(filteredCollection, page, PAGE_SIZE);

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

  async function onDeleteAttendance(attendanceId: string) {
    await deleteAttendanceMut.mutateAsync(attendanceId);
  }

  return {
    // queries/mutations
    attendancesQuery,
    checkinMut,
    checkoutMut,
    deleteAttendanceMut,

    // derived
    attendances,
    filteredCollection,
    totalPages,
    pagedCollection,

    // handlers
    onCheckin,
    onCheckout,
    onDeleteAttendance,
  };
}
