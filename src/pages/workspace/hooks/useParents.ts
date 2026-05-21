import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  assignChildrenToParent,
  createParent,
  deleteParent,
  listParents,
  type CreateParentPayload,
  updateParent,
} from "../../../api/modules/parentApi";
import { listChildren } from "../../../api/modules/childApi";
import type { ListItem, ParentFormState } from "../types";
import { INITIAL_PARENT_FORM } from "../constants";
import { buildParentPayload } from "../formPayloads";
import {
  extractId,
  matchesParentSearch,
  parseIdList,
  toParentFormState,
} from "../formatter";
import { useWorkspaceContext } from "../WorkspaceContext";

type ParentChildOption = {
  id: string;
  name: string;
};

type UseParentsResult = {
  isParentModalOpen: boolean;
  setIsParentModalOpen: Dispatch<SetStateAction<boolean>>;
  isParentViewModalOpen: boolean;
  setIsParentViewModalOpen: Dispatch<SetStateAction<boolean>>;
  isParentEditModalOpen: boolean;
  setIsParentEditModalOpen: Dispatch<SetStateAction<boolean>>;
  isParentAssignChildrenModalOpen: boolean;
  setIsParentAssignChildrenModalOpen: Dispatch<SetStateAction<boolean>>;
  editingParentId: string | null;
  setEditingParentId: Dispatch<SetStateAction<string | null>>;
  viewingParentId: string | null;
  setViewingParentId: Dispatch<SetStateAction<string | null>>;
  assigningParentChildrenId: string | null;
  setAssigningParentChildrenId: Dispatch<SetStateAction<string | null>>;
  parentForm: ParentFormState;
  setParentForm: Dispatch<SetStateAction<ParentFormState>>;
  parentChildrenSearch: string;
  setParentChildrenSearch: Dispatch<SetStateAction<string>>;
  assigningParentChildIds: string[];
  setAssigningParentChildIds: Dispatch<SetStateAction<string[]>>;
  parentsQuery: UseQueryResult<ListItem[], Error>;
  childrenQuery: UseQueryResult<ListItem[], Error>;
  createParentMut: UseMutationResult<
    unknown,
    Error,
    CreateParentPayload,
    unknown
  >;
  updateParentMut: UseMutationResult<
    unknown,
    Error,
    { id: string; payload: Partial<CreateParentPayload> },
    unknown
  >;
  deleteParentMut: UseMutationResult<unknown, Error, string, unknown>;
  assignChildrenMut: UseMutationResult<
    unknown,
    Error,
    { parentId: string; childIds: string[] },
    unknown
  >;
  parents: ListItem[];
  filteredParents: ListItem[];
  assigningParentChildOptions: ParentChildOption[];
  onCreateParent: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  openParentCreateModal: () => void;
  onUpdateParent: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  openParentViewModal: (item: ListItem) => void;
  openParentEditModal: (item: ListItem) => void;
  onDeleteParent: (parentId: string) => Promise<void>;
  openParentAssignChildrenModal: (parentId: string) => void;
  onAssignChildrenToParent: (
    event?: FormEvent<HTMLFormElement>,
  ) => Promise<void>;
  toggleAssignParentChildSelection: (childId: string) => void;
};

export function useParents(): UseParentsResult {
  const queryClient = useQueryClient();
  const {
    role,
    section,
    search,
    setStatusMessage,
    isAdminOrMaster,
    currentCompanyScope,
  } = useWorkspaceContext();

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

  const parentsQuery = useQuery<ListItem[], Error>({
    queryKey: ["parents", currentCompanyScope, role],
    queryFn: () => listParents(currentCompanyScope),
    enabled:
      !isAdminOrMaster && (section === "parents" || section === "children"),
  });

  const childrenQuery = useQuery<ListItem[], Error>({
    queryKey: ["children", currentCompanyScope, role, "parent-assign"],
    queryFn: () => listChildren(currentCompanyScope),
    enabled: section === "parents" || section === "children",
  });

  const createParentMut = useMutation<unknown, Error, CreateParentPayload>({
    mutationFn: createParent,
    onSuccess: async () => {
      setStatusMessage("Responsavel criado.");
      await queryClient.invalidateQueries({ queryKey: ["parents"] });
    },
  });

  const updateParentMut = useMutation<
    unknown,
    Error,
    { id: string; payload: Partial<CreateParentPayload> }
  >({
    mutationFn: ({ id, payload }) => updateParent(id, payload),
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

  const assignChildrenMut = useMutation<
    unknown,
    Error,
    { parentId: string; childIds: string[] }
  >({
    mutationFn: ({ parentId, childIds }) =>
      assignChildrenToParent(parentId, childIds),
    onSuccess: () =>
      setStatusMessage("Vinculo de responsavel para criancas atualizado."),
  });

  const parents = parentsQuery.data || [];
  const children = childrenQuery.data || [];
  const filteredParents = parents.filter((item: ListItem) =>
    matchesParentSearch(item as ListItem, search),
  );

  const assigningParentChildOptions = useMemo<ParentChildOption[]>(() => {
    const term = parentChildrenSearch.trim().toLowerCase();

    return (children as ListItem[])
      .map((item) => ({
        id: extractId(item),
        name: String(item.name || "Crianca sem nome"),
      }))
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
  }, [children, parentChildrenSearch]);

  async function onCreateParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = buildParentPayload(parentForm, currentCompanyScope);

    if (!payload.name) {
      setStatusMessage("Nome do responsavel e obrigatorio.");
      return;
    }

    await createParentMut.mutateAsync(payload);
    setIsParentModalOpen(false);
    setParentForm(INITIAL_PARENT_FORM);
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

    const payload = buildParentPayload(parentForm, currentCompanyScope);
    const { companyId: _companyId, ...updatePayload } = payload;

    if (!updatePayload.name) {
      setStatusMessage("Nome do responsavel e obrigatorio.");
      return;
    }

    await updateParentMut.mutateAsync({
      id: editingParentId,
      payload: updatePayload,
    });
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
    parentsQuery,
    childrenQuery,
    createParentMut,
    updateParentMut,
    deleteParentMut,
    assignChildrenMut,
    parents,
    filteredParents,
    assigningParentChildOptions,
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
