import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyCompany, updateMyCompany } from "../../../api/modules/companyApi";
import {
  getMyCollaborator,
  updateMyCollaborator,
} from "../../../api/modules/profileApi";
import { companyUpdateSchema } from "../validators";
import {
  flattenRecord,
  maskByFieldKey,
  sortByPriority,
  toFieldLabel,
} from "../formatter";
import type { ProfileFieldConfig } from "../types";
import { useWorkspaceContext } from "../WorkspaceContext";

export function useProfile() {
  const queryClient = useQueryClient();
  const {
    role,
    session,
    section,
    setStatusMessage,
    isCompany,
    isCollaborator,
  } = useWorkspaceContext();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});

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

  const updateMyCompanyMut = useMutation<
    unknown,
    Error,
    import("../../../api/modules/companyApi").UpdateCompanyPayload
  >({
    mutationFn: updateMyCompany,
    onSuccess: async () => {
      setStatusMessage("Dados da company atualizados.");
      await queryClient.invalidateQueries({ queryKey: ["my-company"] });
    },
  });

  const updateMyCollaboratorMut = useMutation<
    unknown,
    Error,
    { name?: string; contact?: string }
  >({
    mutationFn: ({ name, contact }) => updateMyCollaborator({ name, contact }),
    onSuccess: async () => {
      setStatusMessage("Seu perfil foi atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["my-collaborator"] });
    },
  });

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

  const personalProfileFields = useMemo(
    () =>
      sortByPriority(
        profileFields
          .filter((field) => !field.key.startsWith("address."))
          .map((field) => field.key),
        personalPriorityOrder,
      ).map(
        (key) =>
          profileFields.find(
            (field) => field.key === key,
          ) as ProfileFieldConfig,
      ),
    [profileFields],
  );

  const addressProfileFields = useMemo(
    () =>
      sortByPriority(
        profileFields
          .filter((field) => field.key.startsWith("address."))
          .map((field) => field.key),
        addressPriorityOrder,
      ).map(
        (key) =>
          profileFields.find(
            (field) => field.key === key,
          ) as ProfileFieldConfig,
      ),
    [profileFields],
  );

  function openProfileEditModal() {
    const nextDraft: Record<string, string> = {};

    profileFields.forEach((field) => {
      nextDraft[field.key] = field.value;
    });

    setProfileDraft(nextDraft);
    setIsProfileModalOpen(true);
  }

  async function onSaveProfileModal(event: React.FormEvent<HTMLFormElement>) {
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

  return {
    // state
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileDraft,
    setProfileDraft,

    // derived data
    profileData,
    profileFields,
    personalProfileFields,
    addressProfileFields,
    editableKeys,

    // mutations
    updateMyCompanyMut,
    updateMyCollaboratorMut,
    myCompanyQuery,
    myCollaboratorQuery,

    // handlers
    openProfileEditModal,
    onSaveProfileModal,
  };
}
