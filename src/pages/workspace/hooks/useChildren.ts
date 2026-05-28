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
import { listActiveCheckins } from "../../../api/modules/attendanceApi";
import { buildBackendAddressPayload } from "../../../api/address";
import { listParents } from "../../../api/modules/parentApi";
import type { ChildFormState, ListItem } from "../types";
import { INITIAL_CHILD_FORM, PAGE_SIZE } from "../constants";
import {
  buildCreateChildPayload,
  sanitizeChildFormStateForPayload,
} from "../childPayload";
import {
  extractId,
  matchesSearch,
  toChildFormState,
  paginate,
  normalizeDigits,
  parseIdList,
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

  const [isChildCreateModalOpen, setIsChildCreateModalOpen] = useState(false);
  const [isChildViewModalOpen, setIsChildViewModalOpen] = useState(false);
  const [isChildEditModalOpen, setIsChildEditModalOpen] = useState(false);
  const [isChildDeleteModalOpen, setIsChildDeleteModalOpen] = useState(false);
  const [isChildAssignParentsModalOpen, setIsChildAssignParentsModalOpen] =
    useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [viewingChildId, setViewingChildId] = useState<string | null>(null);
  const [pendingDeleteChildId, setPendingDeleteChildId] = useState<
    string | null
  >(null);
  const [assigningChildParentsId, setAssigningChildParentsId] = useState<
    string | null
  >(null);
  const [childForm, setChildForm] =
    useState<ChildFormState>(INITIAL_CHILD_FORM);
  const [childCreateParentSearch, setChildCreateParentSearch] = useState("");
  const [childParentsSearch, setChildParentsSearch] = useState("");
  const [assigningChildParentIds, setAssigningChildParentIds] = useState<
    string[]
  >([]);

  const childrenQuery = useQuery({
    queryKey: ["children", currentCompanyScope, role],
    queryFn: () => listChildren(currentCompanyScope),
    enabled: section === "children" || section === "parents",
  });

  const parentsQuery = useQuery({
    queryKey: ["parents", currentCompanyScope, role],
    queryFn: () => listParents(currentCompanyScope),
    enabled:
      !isAdminOrMaster && (section === "parents" || section === "children"),
  });

  const activeAttendancesQuery = useQuery({
    queryKey: ["children", "active-checkins", currentCompanyScope, role],
    queryFn: () => listActiveCheckins(currentCompanyScope),
    enabled: section === "children" || section === "parents",
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

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

  const children = childrenQuery.data || [];
  const parents = parentsQuery.data || [];
  const activeAttendances = activeAttendancesQuery.data || [];

  const activeChildIds = useMemo(
    () =>
      new Set(
        activeAttendances
          .map((attendance) => String(attendance.childId || ""))
          .filter(Boolean),
      ),
    [activeAttendances],
  );

  const filteredCollection = children.filter((item: ListItem) =>
    matchesSearch(item as ListItem, search),
  );

  const orderedCollection = filteredCollection
    .map((item, index) => ({
      item,
      index,
      isActive: activeChildIds.has(extractId(item)),
    }))
    .sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }

      return left.index - right.index;
    })
    .map(({ item }) => item);

  const totalPages = Math.max(
    1,
    Math.ceil(orderedCollection.length / PAGE_SIZE),
  );
  const pagedCollection = paginate(orderedCollection, page, PAGE_SIZE);

  const assigningChildParentOptions = useMemo(() => {
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

  const childCreateParentOptions = useMemo(() => {
    const term = childCreateParentSearch.trim().toLowerCase();

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
  }, [parents, childCreateParentSearch]);

  async function onCreateChildModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = buildCreateChildPayload({
      childForm,
      parents: parents as ListItem[],
      currentCompanyScope,
    });

    if (!payload.name) {
      setStatusMessage("Nome da crianca e obrigatorio.");
      return;
    }

    if (childForm.inheritParentAddress && !payload.parents?.[0]) {
      setStatusMessage(
        "Selecione um responsavel para herdar o endereco antes de salvar.",
      );
      return;
    }

    await createChildMut.mutateAsync({
      ...payload,
    });

    setChildForm(INITIAL_CHILD_FORM);
    setIsChildCreateModalOpen(false);
  }

  function openChildCreateModal() {
    setEditingChildId(null);
    setViewingChildId(null);
    setChildCreateParentSearch("");
    setChildParentsSearch("");
    setChildForm(INITIAL_CHILD_FORM);
    setIsChildCreateModalOpen(true);
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

    const addressPayload = buildBackendAddressPayload(childForm);

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
      healthInfo: sanitizeChildFormStateForPayload(childForm).healthInfo,
      address: addressPayload,
    };

    await updateChildMut.mutateAsync({ id: editingChildId, payload });
    setIsChildEditModalOpen(false);
    setEditingChildId(null);
    setChildForm(INITIAL_CHILD_FORM);
  }

  function openChildEditModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage("Nao foi possivel abrir a edicao desta crianca.");
      return;
    }

    setEditingChildId(id);
    setChildForm(toChildFormState(item));
    setChildCreateParentSearch("");
    setChildParentsSearch("");
    setIsChildEditModalOpen(true);
  }

  function openChildViewModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage("Nao foi possivel abrir a visualizacao desta crianca.");
      return;
    }

    setViewingChildId(id);
    setChildForm(toChildFormState(item));
    setChildParentsSearch("");
    setIsChildViewModalOpen(true);
  }

  async function onDeleteChild(childId: string) {
    await deleteChildMut.mutateAsync(childId);
  }

  function openChildAssignParentsModal(childId: string) {
    if (!childId) {
      setStatusMessage("ID da crianca nao informado.");
      return;
    }

    const childData = children.find(
      (item: ListItem) => extractId(item) === childId,
    ) as ListItem | undefined;

    setAssigningChildParentsId(childId);

    if (childData) {
      const currentParentIds = parseIdList(childData.parents);
      setAssigningChildParentIds(currentParentIds);
    } else {
      setAssigningChildParentIds([]);
    }

    setChildParentsSearch("");
    setIsChildAssignParentsModalOpen(true);
  }

  async function onAssignParentsToChild(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!assigningChildParentsId) {
      setStatusMessage("Nao foi possivel vincular responsaveis.");
      return;
    }

    await assignParentsMut.mutateAsync({
      childId: assigningChildParentsId,
      parentIds: assigningChildParentIds,
    });

    setIsChildAssignParentsModalOpen(false);
    setAssigningChildParentsId(null);
    setAssigningChildParentIds([]);
    setChildParentsSearch("");
  }

  function toggleAssignChildParentSelection(parentId: string) {
    setAssigningChildParentIds((current) => {
      const selected = new Set(current);
      if (selected.has(parentId)) {
        selected.delete(parentId);
      } else {
        selected.add(parentId);
      }
      return Array.from(selected);
    });
  }

  return {
    isChildCreateModalOpen,
    setIsChildCreateModalOpen,
    isChildViewModalOpen,
    setIsChildViewModalOpen,
    isChildEditModalOpen,
    setIsChildEditModalOpen,
    isChildDeleteModalOpen,
    setIsChildDeleteModalOpen,
    isChildAssignParentsModalOpen,
    setIsChildAssignParentsModalOpen,
    editingChildId,
    setEditingChildId,
    viewingChildId,
    setViewingChildId,
    pendingDeleteChildId,
    setPendingDeleteChildId,
    assigningChildParentsId,
    setAssigningChildParentsId,
    childForm,
    setChildForm,
    childCreateParentSearch,
    setChildCreateParentSearch,
    childParentsSearch,
    setChildParentsSearch,
    assigningChildParentIds,
    setAssigningChildParentIds,
    childrenQuery,
    parentsQuery,
    activeAttendancesQuery,
    createChildMut,
    updateChildMut,
    deleteChildMut,
    assignParentsMut,
    children,
    parents,
    activeChildIds,
    filteredCollection,
    totalPages,
    pagedCollection,
    assigningChildParentOptions,
    childCreateParentOptions,
    onCreateChildModal,
    openChildCreateModal,
    onUpdateChildModal,
    openChildViewModal,
    openChildEditModal,
    onDeleteChild,
    openChildAssignParentsModal,
    onAssignParentsToChild,
    toggleAssignChildParentSelection,
  };
}
