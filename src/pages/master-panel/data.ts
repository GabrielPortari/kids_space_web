import type { MasterSectionItem } from "./types";

export const MASTER_SECTION_ITEMS: MasterSectionItem[] = [
  {
    id: "overview",
    label: "Visão geral",
    title: "Visão geral do master",
    description:
      "Resumo operacional e pontos de entrada para administração global.",
    badge: "home",
  },
  {
    id: "profile",
    label: "Meu perfil",
    title: "Meu perfil",
    description: "Dados da conta autenticada e contexto atual do master.",
  },
  {
    id: "admins",
    label: "Admins",
    title: "Gestão de admins",
    description:
      "Cadastro, edição, consulta e remoção de administradores do sistema.",
    badge: "core",
  },
  {
    id: "companies",
    label: "Companies",
    title: "Empresas",
    description:
      "Visão consolidada das empresas e seus dados para escopo global.",
  },
  {
    id: "collaborators",
    label: "Collaborators",
    title: "Colaboradores",
    description:
      "Lista global e ações operacionais de colaboradores por empresa.",
  },
  {
    id: "parents",
    label: "Responsáveis",
    title: "Responsáveis",
    description:
      "Consulta e manutenção de responsáveis vinculados às empresas.",
  },
  {
    id: "children",
    label: "Crianças",
    title: "Crianças",
    description:
      "Gestão de crianças, vínculos e dados aninhados por companhia.",
  },
  {
    id: "attendances",
    label: "Atendimentos",
    title: "Atendimentos",
    description:
      "Check-ins, check-outs e histórico consolidado do sistema.",
  },
  {
    id: "bootstrap",
    label: "Bootstrap master",
    title: "Bootstrap do primeiro master",
    description:
      "Fluxo exclusivo para criação do primeiro administrador mestre.",
    badge: "init",
  },
];