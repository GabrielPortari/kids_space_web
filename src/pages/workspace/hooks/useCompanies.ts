import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import {
  createCompany,
  deleteCompany,
  listCompanies,
  updateCompany,
  type UpdateCompanyPayload,
} from "../../../api/modules/companyApi";
import { bootstrapAdmin } from "../../../api/modules/adminApi";
import type { CompanyFormState, ListItem } from "../types";
import { INITIAL_COMPANY_FORM, PAGE_SIZE } from "../constants";
import {
  extractId,
  normalizeDigits,
  toCompanyFormState,
  matchesSearch,
  paginate,
} from "../formatter";
import { useWorkspaceContext } from "../WorkspaceContext";

export function useCompanies() {
  const queryClient = useQueryClient();
  const {
    section,
    search,
    page,
    setStatusMessage,
    isAdminOrMaster,
    companyScope,
  } = useWorkspaceContext();

  // State
  const [isCompanyCreateModalOpen, setIsCompanyCreateModalOpen] =
    useState(false);
  const [isCompanyEditModalOpen, setIsCompanyEditModalOpen] = useState(false);
  const [isCompanyDeleteModalOpen, setIsCompanyDeleteModalOpen] =
    useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [pendingDeleteCompanyId, setPendingDeleteCompanyId] = useState<
    string | null
  >(null);
  const [companyForm, setCompanyForm] =
    useState<CompanyFormState>(INITIAL_COMPANY_FORM);

  // Queries
  const companiesQuery = useQuery({
    queryKey: ["companies", companyScope],
    queryFn: () => listCompanies(companyScope || undefined),
    enabled: section === "companies" && isAdminOrMaster,
  });

  // Mutations
  const createCompanyMut = useMutation<unknown, Error, Record<string, unknown>>(
    {
      mutationFn: createCompany,
      onSuccess: async () => {
        setStatusMessage("Company criada.");
        await queryClient.invalidateQueries({ queryKey: ["companies"] });
      },
    },
  );

  const updateCompanyMut = useMutation<
    unknown,
    Error,
    { id: string; payload: UpdateCompanyPayload }
  >({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateCompany(id, payload),
    onSuccess: async () => {
      setStatusMessage("Company atualizada.");
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const deleteCompanyMut = useMutation<unknown, Error, string>({
    mutationFn: deleteCompany,
    onSuccess: async () => {
      setStatusMessage("Company removida.");
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const bootstrapAdminMut = useMutation<
    unknown,
    Error,
    { bootstrapKey: string; name: string; email: string; password: string }
  >({
    mutationFn: bootstrapAdmin,
    onSuccess: () => setStatusMessage("Admin bootstrap criado com sucesso."),
  });

  // Derived
  const companies = companiesQuery.data || [];
  const filteredCollection = companies.filter((item: ListItem) =>
    matchesSearch(item as ListItem, search),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCollection.length / PAGE_SIZE),
  );
  const pagedCollection = paginate(filteredCollection, page, PAGE_SIZE);

  // Handlers
  async function onCreateCompanyModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = companyForm.name.trim();
    const legalName = companyForm.legalName.trim();
    const cnpj = normalizeDigits(companyForm.cnpj).slice(0, 14);
    const contact = normalizeDigits(companyForm.contact).slice(0, 11);
    const email = companyForm.email.trim();

    const addressEntries = {
      street: companyForm.addressStreet.trim(),
      number: companyForm.addressNumber.trim(),
      district: companyForm.addressDistrict.trim(),
      city: companyForm.addressCity.trim(),
      state: companyForm.addressState.trim(),
      zipCode: normalizeDigits(companyForm.addressZipCode),
      complement: companyForm.addressComplement.trim(),
      country: companyForm.addressCountry.trim(),
    };

    const compactAddress = Object.fromEntries(
      Object.entries(addressEntries).filter(([, value]) => Boolean(value)),
    );

    if (!name) {
      setStatusMessage("Nome da company e obrigatorio.");
      return;
    }

    await createCompanyMut.mutateAsync({
      name,
      legalName: legalName || undefined,
      cnpj: cnpj || undefined,
      contact: contact || undefined,
      email: email || undefined,
      address:
        Object.keys(compactAddress).length > 0 ? compactAddress : undefined,
    });

    setCompanyForm(INITIAL_COMPANY_FORM);
    setIsCompanyCreateModalOpen(false);
  }

  async function onUpdateCompanyModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingCompanyId) {
      setStatusMessage("Nao foi possivel identificar a company.");
      return;
    }

    const name = companyForm.name.trim();
    const legalName = companyForm.legalName.trim();
    const cnpj = normalizeDigits(companyForm.cnpj).slice(0, 14);
    const contact = normalizeDigits(companyForm.contact).slice(0, 11);
    const email = companyForm.email.trim();

    const addressEntries = {
      street: companyForm.addressStreet.trim(),
      number: companyForm.addressNumber.trim(),
      district: companyForm.addressDistrict.trim(),
      city: companyForm.addressCity.trim(),
      state: companyForm.addressState.trim(),
      zipCode: normalizeDigits(companyForm.addressZipCode),
      complement: companyForm.addressComplement.trim(),
      country: companyForm.addressCountry.trim(),
    };

    const compactAddress = Object.fromEntries(
      Object.entries(addressEntries).filter(([, value]) => Boolean(value)),
    );

    if (!name) {
      setStatusMessage("Nome da company e obrigatorio.");
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      legalName: legalName || undefined,
      cnpj: cnpj || undefined,
      contact: contact || undefined,
      email: email || undefined,
      address:
        Object.keys(compactAddress).length > 0 ? compactAddress : undefined,
    };

    await updateCompanyMut.mutateAsync({ id: editingCompanyId, payload });
    setIsCompanyEditModalOpen(false);
    setEditingCompanyId(null);
    setCompanyForm(INITIAL_COMPANY_FORM);
  }

  function openCompanyEditModal(item: ListItem) {
    const id = extractId(item);
    if (!id) {
      setStatusMessage("Nao foi possivel abrir a edicao desta company.");
      return;
    }

    setEditingCompanyId(id);
    setCompanyForm(toCompanyFormState(item));
    setIsCompanyEditModalOpen(true);
  }

  async function onDeleteCompany(companyId: string) {
    await deleteCompanyMut.mutateAsync(companyId);
  }

  async function onBootstrapAdmin(payload: {
    bootstrapKey: string;
    name: string;
    email: string;
    password: string;
  }) {
    const { bootstrapKey, name, email, password } = payload;

    if (!bootstrapKey || !name || !email || !password) {
      setStatusMessage("Preencha bootstrap key, nome, email e senha.");
      return;
    }

    await bootstrapAdminMut.mutateAsync({
      bootstrapKey,
      name,
      email,
      password,
    });
  }

  return {
    // state
    isCompanyCreateModalOpen,
    setIsCompanyCreateModalOpen,
    isCompanyEditModalOpen,
    setIsCompanyEditModalOpen,
    isCompanyDeleteModalOpen,
    setIsCompanyDeleteModalOpen,
    editingCompanyId,
    setEditingCompanyId,
    pendingDeleteCompanyId,
    setPendingDeleteCompanyId,
    companyForm,
    setCompanyForm,

    // queries/mutations
    companiesQuery,
    createCompanyMut,
    updateCompanyMut,
    deleteCompanyMut,
    bootstrapAdminMut,

    // derived
    companies,
    filteredCollection,
    totalPages,
    pagedCollection,

    // handlers
    onCreateCompanyModal,
    onUpdateCompanyModal,
    openCompanyEditModal,
    onDeleteCompany,
    onBootstrapAdmin,
  };
}
