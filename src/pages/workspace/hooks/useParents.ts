import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import {
  assignChildrenToParent,
  createParent,
  deleteParent,
  listParents,
  type CreateParentPayload,
  updateParent,
} from "../../../api/modules/parentApi";
import { buildBackendAddressPayload } from "../../../api/address";
import type { ParentFormState, ListItem } from "../types";
import { INITIAL_PARENT_FORM } from "../constants";
import {
  extractId,
  normalizeDigits,
  parseIdList,
  matchesParentSearch,
  toParentFormState,
} from "../formatter";
import { useWorkspaceContext } from "../WorkspaceContext";

export function useParents() {
  const queryClient = useQueryClient();
  const {
    role,
    section,
    search,
    setStatusMessage,
    isAdminOrMaster,
    currentCompanyScope,
  } = useWorkspaceContext();

  // State
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [isParentViewModalOpen, setIsParentViewModalOpen] = useState(false);
  const [isParentEditModalOpen, setIsParentEditModalOpen] = useState(false);
  const [isParentAssignChildrenModalOpen, setIsParentAssignChildrenModalOpen] =
    useState(false);
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [viewingParentId, setViewingParentId] = useState<string | null>(null);
  const [assigningParentChildrenId, setAssigningParentChildrenId] = useState<
    string | null
  >(null);
  const [parentForm, setParentForm] =
    useState<ParentFormState>(INITIAL_PARENT_FORM);
  const [parentChildrenSearch, setParentChildrenSearch] = useState("");
  const [assigningParentChildIds, setAssigningParentChildIds] = useState<
    string[]
  >([]);

  // Query
  const parentsQuery = useQuery({
    queryKey: ["parents", currentCompanyScope, role],
    queryFn: () => listParents(currentCompanyScope),
    enabled:
      !isAdminOrMaster && (section === "parents" || section === "children"),
  });

  // Mutations
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

  const deleteParentMut = useMutation<unknown, Error, string>({
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

  // Derived
  const parents = parentsQuery.data || [];
  const filteredParents = parents.filter((item: ListItem) =>
    matchesParentSearch(item as ListItem, search),
  );

  const assigningParentChildOptions = useMemo(() => [], [parentChildrenSearch]);

  // Handlers
  async function onCreateParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = parentForm.name.trim();
    const document = normalizeDigits(parentForm.document);
    const email = parentForm.email.trim();
    const contact = parentForm.contact.trim();
    const birthDate = parentForm.birthDate.trim();

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
      address: buildBackendAddressPayload(parentForm),
    };

    await createParentMut.mutateAsync(payload);
    setParentForm(INITIAL_PARENT_FORM);
    setIsParentModalOpen(false);
  }

  function openParentCreateModal() {
    setEditingParentId(null);
    setViewingParentId(null);
    setParentChildrenSearch("");
    setParentForm(INITIAL_PARENT_FORM);
    setIsParentModalOpen(true);
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
      address: buildBackendAddressPayload(parentForm),
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
    setParentChildrenSearch("");
    setIsParentEditModalOpen(true);
  }

  function openParentViewModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage(
        "Nao foi possivel abrir a visualizacao deste responsavel.",
      );
      return;
    }

    setViewingParentId(id);
    setParentForm(toParentFormState(item));
    setParentChildrenSearch("");
    setIsParentViewModalOpen(true);
  }

  async function onDeleteParent(parentId: string) {
    await deleteParentMut.mutateAsync(parentId);
  }

  function openParentAssignChildrenModal(parentId: string) {
    if (!parentId) {
      setStatusMessage("ID do responsavel nao informado.");
      return;
    }

    const parentData = parents.find(
      (item: ListItem) => extractId(item) === parentId,
    ) as ListItem | undefined;

    setAssigningParentChildrenId(parentId);

    if (parentData) {
      const currentChildIds = parseIdList(parentData.children);
      setAssigningParentChildIds(currentChildIds);
    } else {
      setAssigningParentChildIds([]);
    }

    setParentChildrenSearch("");
    setIsParentAssignChildrenModalOpen(true);
  }

  async function onAssignChildrenToParent(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!assigningParentChildrenId) {
      setStatusMessage("Nao foi possivel vincular criancas.");
      return;
    }

    await assignChildrenMut.mutateAsync({
      parentId: assigningParentChildrenId,
      childIds: assigningParentChildIds,
    });

    setIsParentAssignChildrenModalOpen(false);
    setAssigningParentChildrenId(null);
    setAssigningParentChildIds([]);
    setParentChildrenSearch("");
  }

  function toggleAssignParentChildSelection(childId: string) {
    setAssigningParentChildIds((current) => {
      const selected = new Set(current);
      if (selected.has(childId)) {
        selected.delete(childId);
      } else {
        selected.add(childId);
      }
      return Array.from(selected);
    });
  }

  return {
    // state
    isParentModalOpen,
    setIsParentModalOpen,
    isParentViewModalOpen,
    setIsParentViewModalOpen,
    isParentEditModalOpen,
    setIsParentEditModalOpen,
    isParentAssignChildrenModalOpen,
    setIsParentAssignChildrenModalOpen,
    editingParentId,
    setEditingParentId,
    viewingParentId,
    setViewingParentId,
    assigningParentChildrenId,
    setAssigningParentChildrenId,
    parentForm,
    setParentForm,
    parentChildrenSearch,
    setParentChildrenSearch,
    assigningParentChildIds,
    setAssigningParentChildIds,

    // queries/mutations
    parentsQuery,
    createParentMut,
    updateParentMut,
    deleteParentMut,
    assignChildrenMut,

    // derived
    parents,
    filteredParents,
    assigningParentChildOptions,

    // handlers
    onCreateParent,
    openParentCreateModal,
    onUpdateParent,
    openParentViewModal,
    openParentEditModal,
    onDeleteParent,
    openParentAssignChildrenModal,
    onAssignChildrenToParent,
    toggleAssignParentChildSelection,
  };
}
