import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import {
  assignParentsToChild,
  createChild,
  deleteChild,
  listChildren,
  updateChild,
  type CreateChildPayload,
} from "../../../api/modules/childApi";
import { listChildrenAdmin } from "../../../api/modules/adminApi";
import { listParents } from "../../../api/modules/parentApi";
import type { ChildFormState, ListItem } from "../types";
import { INITIAL_CHILD_FORM, PAGE_SIZE } from "../constants";
import {
  extractId,
  normalizeDigits,
  parseIdList,
  matchesSearch,
  toChildFormState,
  paginate,
} from "../formatter";
import { useWorkspaceContext } from "../WorkspaceContext";

export function useChildren() {
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

  // State
  const [isChildCreateModalOpen, setIsChildCreateModalOpen] = useState(false);
  const [isChildEditModalOpen, setIsChildEditModalOpen] = useState(false);
  const [isChildDeleteModalOpen, setIsChildDeleteModalOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [pendingDeleteChildId, setPendingDeleteChildId] = useState<
    string | null
  >(null);
  const [childForm, setChildForm] =
    useState<ChildFormState>(INITIAL_CHILD_FORM);
  const [childParentsSearch, setChildParentsSearch] = useState("");

  // Queries
  const childrenQuery = useQuery({
    queryKey: ["children", currentCompanyScope, role],
    queryFn: () =>
      isAdminOrMaster
        ? listChildrenAdmin(currentCompanyScope)
        : listChildren(currentCompanyScope),
    enabled:
      section === "children" || section === "links" || section === "parents",
  });

  const parentsQuery = useQuery({
    queryKey: ["parents", currentCompanyScope, role],
    queryFn: () => listParents(currentCompanyScope),
    enabled:
      !isAdminOrMaster &&
      (section === "parents" || section === "links" || section === "children"),
  });

  // Mutations
  const createChildMut = useMutation<unknown, Error, CreateChildPayload>({
    mutationFn: createChild,
    onSuccess: async () => {
      setStatusMessage("Crianca criada.");
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const updateChildMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateChild(id, payload),
    onSuccess: async () => {
      setStatusMessage("Crianca atualizada.");
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const deleteChildMut = useMutation<unknown, Error, string>({
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

  // Derived
  const children = childrenQuery.data || [];
  const parents = parentsQuery.data || [];
  const filteredCollection = children.filter((item: ListItem) =>
    matchesSearch(item as ListItem, search),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCollection.length / PAGE_SIZE),
  );
  const pagedCollection = paginate(filteredCollection, page, PAGE_SIZE);

  const selectedChildParentIds = useMemo(
    () => parseIdList(childForm.parents),
    [childForm.parents],
  );

  const childParentOptions = useMemo(() => {
    const term = childParentsSearch.trim().toLowerCase();

    return (parents as ListItem[])
      .map((item) => {
        const id = extractId(item);
        return {
          id,
          name: String(item.name || "Responsavel sem nome"),
        };
      })
      .filter((option) => {
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
  }, [parents, childParentsSearch]);

  function toggleChildParentSelection(parentId: string) {
    setChildForm((current) => {
      const selected = new Set(parseIdList(current.parents));
      if (selected.has(parentId)) {
        selected.delete(parentId);
      } else {
        selected.add(parentId);
      }

      return {
        ...current,
        parents: Array.from(selected).join(", "),
      };
    });
  }

  // Handlers
  async function onCreateChildModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = childForm.name.trim();
    const document = normalizeDigits(childForm.document).slice(0, 11);
    const email = childForm.email.trim();
    const contact = normalizeDigits(childForm.contact).slice(0, 11);
    const birthDate = childForm.birthDate.trim();
    const parents = parseIdList(childForm.parents);

    const childAddressEntries = {
      street: childForm.addressStreet.trim(),
      number: childForm.addressNumber.trim(),
      district: childForm.addressDistrict.trim(),
      city: childForm.addressCity.trim(),
      state: childForm.addressState.trim(),
      zipCode: normalizeDigits(childForm.addressZipCode).slice(0, 8),
      complement: childForm.addressComplement.trim(),
      country: childForm.addressCountry.trim(),
    };

    const compactChildAddress = Object.fromEntries(
      Object.entries(childAddressEntries).filter(([, value]) => Boolean(value)),
    );

    let addressPayload: Record<string, string> | undefined =
      Object.keys(compactChildAddress).length > 0
        ? compactChildAddress
        : undefined;

    if (childForm.inheritParentAddress) {
      if (!parents.length) {
        setStatusMessage(
          "Selecione ao menos um responsavel para herdar endereco.",
        );
        return;
      }

      const sourceParent = (parentsQuery.data || []).find(
        (item: ListItem) => extractId(item) === parents[0],
      ) as ListItem | undefined;

      const sourceAddress =
        sourceParent?.address &&
        typeof sourceParent.address === "object" &&
        !Array.isArray(sourceParent.address)
          ? (sourceParent.address as Record<string, unknown>)
          : {};

      const inheritedAddressEntries = {
        street: String(sourceAddress.street || "").trim(),
        number: String(sourceAddress.number || "").trim(),
        district: String(sourceAddress.district || "").trim(),
        city: String(sourceAddress.city || "").trim(),
        state: String(sourceAddress.state || "").trim(),
        zipCode: normalizeDigits(String(sourceAddress.zipCode || "")).slice(
          0,
          8,
        ),
        complement: String(sourceAddress.complement || "").trim(),
        country: String(sourceAddress.country || "").trim(),
      };

      const compactInheritedAddress = Object.fromEntries(
        Object.entries(inheritedAddressEntries).filter(([, value]) =>
          Boolean(value),
        ),
      );

      addressPayload =
        Object.keys(compactInheritedAddress).length > 0
          ? compactInheritedAddress
          : undefined;
    }

    if (!name) {
      setStatusMessage("Nome da crianca e obrigatorio.");
      return;
    }

    await createChildMut.mutateAsync({
      name,
      document: document || undefined,
      email: email || undefined,
      contact: contact || undefined,
      birthDate: birthDate || undefined,
      parents: parents.length ? parents : undefined,
      address: addressPayload,
      companyId: currentCompanyScope,
    });

    setChildForm(INITIAL_CHILD_FORM);
    setChildParentsSearch("");
    setIsChildCreateModalOpen(false);
  }

  async function onUpdateChildModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingChildId) {
      setStatusMessage("Nao foi possivel identificar a crianca.");
      return;
    }

    const name = childForm.name.trim();
    const document = normalizeDigits(childForm.document).slice(0, 11);
    const email = childForm.email.trim();
    const contact = normalizeDigits(childForm.contact).slice(0, 11);
    const birthDate = childForm.birthDate.trim();
    const parents = parseIdList(childForm.parents);

    const childAddressEntries = {
      street: childForm.addressStreet.trim(),
      number: childForm.addressNumber.trim(),
      district: childForm.addressDistrict.trim(),
      city: childForm.addressCity.trim(),
      state: childForm.addressState.trim(),
      zipCode: normalizeDigits(childForm.addressZipCode).slice(0, 8),
      complement: childForm.addressComplement.trim(),
      country: childForm.addressCountry.trim(),
    };

    const compactChildAddress = Object.fromEntries(
      Object.entries(childAddressEntries).filter(([, value]) => Boolean(value)),
    );

    let addressPayload: Record<string, string> | undefined =
      Object.keys(compactChildAddress).length > 0
        ? compactChildAddress
        : undefined;

    if (childForm.inheritParentAddress) {
      if (!parents.length) {
        setStatusMessage(
          "Selecione ao menos um responsavel para herdar endereco.",
        );
        return;
      }

      const sourceParent = (parentsQuery.data || []).find(
        (item: ListItem) => extractId(item) === parents[0],
      ) as ListItem | undefined;

      const sourceAddress =
        sourceParent?.address &&
        typeof sourceParent.address === "object" &&
        !Array.isArray(sourceParent.address)
          ? (sourceParent.address as Record<string, unknown>)
          : {};

      const inheritedAddressEntries = {
        street: String(sourceAddress.street || "").trim(),
        number: String(sourceAddress.number || "").trim(),
        district: String(sourceAddress.district || "").trim(),
        city: String(sourceAddress.city || "").trim(),
        state: String(sourceAddress.state || "").trim(),
        zipCode: normalizeDigits(String(sourceAddress.zipCode || "")).slice(
          0,
          8,
        ),
        complement: String(sourceAddress.complement || "").trim(),
        country: String(sourceAddress.country || "").trim(),
      };

      const compactInheritedAddress = Object.fromEntries(
        Object.entries(inheritedAddressEntries).filter(([, value]) =>
          Boolean(value),
        ),
      );

      addressPayload =
        Object.keys(compactInheritedAddress).length > 0
          ? compactInheritedAddress
          : undefined;
    }

    if (!name) {
      setStatusMessage("Nome da crianca e obrigatorio.");
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      document: document || undefined,
      email: email || undefined,
      contact: contact || undefined,
      birthDate: birthDate || undefined,
      parents: parents.length ? parents : undefined,
      address: addressPayload,
    };

    await updateChildMut.mutateAsync({ id: editingChildId, payload });
    setIsChildEditModalOpen(false);
    setEditingChildId(null);
    setChildForm(INITIAL_CHILD_FORM);
    setChildParentsSearch("");
  }

  function openChildEditModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage("Nao foi possivel abrir a edicao desta crianca.");
      return;
    }

    setEditingChildId(id);
    setChildForm(toChildFormState(item));
    setChildParentsSearch("");
    setIsChildEditModalOpen(true);
  }

  async function onDeleteChild(childId: string) {
    await deleteChildMut.mutateAsync(childId);
  }

  return {
    // state
    isChildCreateModalOpen,
    setIsChildCreateModalOpen,
    isChildEditModalOpen,
    setIsChildEditModalOpen,
    isChildDeleteModalOpen,
    setIsChildDeleteModalOpen,
    editingChildId,
    setEditingChildId,
    pendingDeleteChildId,
    setPendingDeleteChildId,
    childForm,
    setChildForm,
    childParentsSearch,
    setChildParentsSearch,

    // queries/mutations
    childrenQuery,
    parentsQuery,
    createChildMut,
    updateChildMut,
    deleteChildMut,
    assignParentsMut,

    // derived
    children,
    parents,
    filteredCollection,
    totalPages,
    pagedCollection,
    selectedChildParentIds,
    childParentOptions,

    // handlers
    onCreateChildModal,
    onUpdateChildModal,
    openChildEditModal,
    onDeleteChild,
    toggleChildParentSelection,
  };
}
