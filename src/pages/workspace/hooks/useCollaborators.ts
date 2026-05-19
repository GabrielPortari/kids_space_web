import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import {
  createCollaborator,
  deleteCollaborator,
  listCollaborators,
  updateCollaborator,
  type CreateCollaboratorPayload,
} from "../../../api/modules/collaboratorApi";
import { buildBackendAddressPayload } from "../../../api/address";
import { listCollaboratorsAdmin } from "../../../api/modules/adminApi";
import type { CollaboratorFormState, ListItem } from "../types";
import { INITIAL_COLLABORATOR_FORM } from "../constants";
import {
  extractId,
  normalizeDigits,
  matchesSearch,
  toCollaboratorFormState,
} from "../formatter";
import { useWorkspaceContext } from "../WorkspaceContext";
import { PAGE_SIZE } from "../constants";
import { paginate } from "../formatter";

export function useCollaborators() {
  const queryClient = useQueryClient();
  const {
    role,
    section,
    search,
    page,
    setStatusMessage,
    isAdminOrMaster,
    canManageCollaborators,
    currentCompanyScope,
  } = useWorkspaceContext();

  // State
  const [isCollaboratorCreateModalOpen, setIsCollaboratorCreateModalOpen] =
    useState(false);
  const [isCollaboratorViewModalOpen, setIsCollaboratorViewModalOpen] =
    useState(false);
  const [isCollaboratorEditModalOpen, setIsCollaboratorEditModalOpen] =
    useState(false);
  const [isCollaboratorDeleteModalOpen, setIsCollaboratorDeleteModalOpen] =
    useState(false);
  const [viewingCollaboratorId, setViewingCollaboratorId] = useState<
    string | null
  >(null);
  const [editingCollaboratorId, setEditingCollaboratorId] = useState<
    string | null
  >(null);
  const [pendingDeleteCollaboratorId, setPendingDeleteCollaboratorId] =
    useState<string | null>(null);
  const [collaboratorForm, setCollaboratorForm] =
    useState<CollaboratorFormState>(INITIAL_COLLABORATOR_FORM);

  // Queries
  const collaboratorsQuery = useQuery({
    queryKey: ["collaborators", currentCompanyScope, role],
    queryFn: () =>
      isAdminOrMaster
        ? listCollaboratorsAdmin(currentCompanyScope)
        : listCollaborators(currentCompanyScope),
    enabled: canManageCollaborators && section === "collaborators",
  });

  // Mutations
  const createCollaboratorMut = useMutation<
    unknown,
    Error,
    CreateCollaboratorPayload
  >({
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

  const deleteCollaboratorMut = useMutation<unknown, Error, string>({
    mutationFn: deleteCollaborator,
    onSuccess: async () => {
      setStatusMessage("Colaborador excluido com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["collaborators"] });
    },
  });

  // Derived
  const collaborators = collaboratorsQuery.data || [];
  const filteredCollection = collaborators.filter((item: ListItem) =>
    matchesSearch(item as ListItem, search),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCollection.length / PAGE_SIZE),
  );
  const pagedCollection = paginate(filteredCollection, page, PAGE_SIZE);

  // Handlers
  async function onCreateCollaboratorModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = collaboratorForm.name.trim();
    const email = collaboratorForm.email.trim();
    const document = normalizeDigits(collaboratorForm.document).slice(0, 14);
    const contact = normalizeDigits(collaboratorForm.contact).slice(0, 11);
    const birthDate = collaboratorForm.birthDate.trim();

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
      address: buildBackendAddressPayload(collaboratorForm),
      companyId: currentCompanyScope,
    });

    setIsCollaboratorCreateModalOpen(false);
    setCollaboratorForm(INITIAL_COLLABORATOR_FORM);
  }

  function openCollaboratorCreateModal() {
    setEditingCollaboratorId(null);
    setViewingCollaboratorId(null);
    setCollaboratorForm(INITIAL_COLLABORATOR_FORM);
    setIsCollaboratorCreateModalOpen(true);
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
      address: buildBackendAddressPayload(collaboratorForm),
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
    setCollaboratorForm(toCollaboratorFormState(item));
    setIsCollaboratorViewModalOpen(true);
  }

  function openCollaboratorEditModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage("Nao foi possivel abrir a edicao.");
      return;
    }

    setEditingCollaboratorId(id);
    setCollaboratorForm(toCollaboratorFormState(item));
    setIsCollaboratorEditModalOpen(true);
  }

  async function onDeleteCollaborator() {
    if (!pendingDeleteCollaboratorId) {
      setStatusMessage(
        "Nao foi possivel identificar o colaborador para deletar.",
      );
      return;
    }

    await deleteCollaboratorMut.mutateAsync(pendingDeleteCollaboratorId);
    setIsCollaboratorDeleteModalOpen(false);
    setPendingDeleteCollaboratorId(null);
  }

  return {
    // state
    isCollaboratorCreateModalOpen,
    setIsCollaboratorCreateModalOpen,
    isCollaboratorViewModalOpen,
    setIsCollaboratorViewModalOpen,
    isCollaboratorEditModalOpen,
    setIsCollaboratorEditModalOpen,
    isCollaboratorDeleteModalOpen,
    setIsCollaboratorDeleteModalOpen,
    viewingCollaboratorId,
    setViewingCollaboratorId,
    editingCollaboratorId,
    setEditingCollaboratorId,
    pendingDeleteCollaboratorId,
    setPendingDeleteCollaboratorId,
    collaboratorForm,
    setCollaboratorForm,

    // queries/mutations
    collaboratorsQuery,
    createCollaboratorMut,
    updateCollaboratorMut,
    deleteCollaboratorMut,

    // derived
    collaborators,
    filteredCollection,
    totalPages,
    pagedCollection,

    // handlers
    onCreateCollaboratorModal,
    openCollaboratorCreateModal,
    onUpdateCollaboratorModal,
    openCollaboratorViewModal,
    openCollaboratorEditModal,
    onDeleteCollaborator,
  };
}
