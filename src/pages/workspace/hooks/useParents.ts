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
  const [isParentEditModalOpen, setIsParentEditModalOpen] = useState(false);
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [parentForm, setParentForm] =
    useState<ParentFormState>(INITIAL_PARENT_FORM);
  const [parentChildrenSearch, setParentChildrenSearch] = useState("");

  // Query
  const parentsQuery = useQuery({
    queryKey: ["parents", currentCompanyScope, role],
    queryFn: () => listParents(currentCompanyScope),
    enabled:
      !isAdminOrMaster &&
      (section === "parents" || section === "links" || section === "children"),
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

  const selectedParentChildrenIds = useMemo(
    () => parseIdList(parentForm.children),
    [parentForm.children],
  );

  // We'll need children from context, but for now we create an empty array
  // This will be passed from useChildren hook
  const parentChildrenOptions = useMemo(() => [], [parentChildrenSearch]);

  function toggleParentChildSelection(childId: string) {
    setParentForm((current) => {
      const selected = new Set(parseIdList(current.children));
      if (selected.has(childId)) {
        selected.delete(childId);
      } else {
        selected.add(childId);
      }

      return {
        ...current,
        children: Array.from(selected).join(", "),
      };
    });
  }

  // Handlers
  async function onCreateParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = parentForm.name.trim();
    const document = normalizeDigits(parentForm.document);
    const email = parentForm.email.trim();
    const contact = parentForm.contact.trim();
    const birthDate = parentForm.birthDate.trim();
    const children = parseIdList(parentForm.children);

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
    setParentChildrenSearch("");
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
    const children = parseIdList(parentForm.children);

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
    setParentChildrenSearch("");
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

  async function onDeleteParent(parentId: string) {
    await deleteParentMut.mutateAsync(parentId);
  }

  return {
    // state
    isParentModalOpen,
    setIsParentModalOpen,
    isParentEditModalOpen,
    setIsParentEditModalOpen,
    editingParentId,
    setEditingParentId,
    parentForm,
    setParentForm,
    parentChildrenSearch,
    setParentChildrenSearch,

    // queries/mutations
    parentsQuery,
    createParentMut,
    updateParentMut,
    deleteParentMut,
    assignChildrenMut,

    // derived
    parents,
    filteredParents,
    selectedParentChildrenIds,
    parentChildrenOptions,

    // handlers
    onCreateParent,
    onUpdateParent,
    openParentEditModal,
    onDeleteParent,
    toggleParentChildSelection,
  };
}
