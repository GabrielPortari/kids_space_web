export type MasterSectionId =
  | "overview"
  | "profile"
  | "admins"
  | "companies"
  | "collaborators"
  | "parents"
  | "children"
  | "attendances"
  | "bootstrap";

export type MasterSectionItem = {
  id: MasterSectionId;
  label: string;
  title: string;
  description: string;
  badge?: string;
};