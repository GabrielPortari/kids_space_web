import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CrmSidebar } from "./components/CrmSidebar";
import { OverviewSection } from "./sections/OverviewSection";
import { AdminsSection } from "./sections/AdminsSection";
import { CompaniesSection } from "./sections/CompaniesSection";
import { ProfileSection } from "./sections/ProfileSection";
import { CollaboratorsSection } from "./sections/CollaboratorsSection";
import { ParentsSection } from "./sections/ParentsSection";
import { ChildrenSection } from "./sections/ChildrenSection";
import { AttendanceSection } from "./sections/AttendanceSection";
import { BootstrapSection } from "./sections/BootstrapSection";
import { MASTER_SECTION_ITEMS } from "./data";
import { listCompanies } from "../../api/modules/companyApi";
import type { Company } from "../../domain/entities";
import type { MasterSectionId } from "./types";

export type CompanyOption = { id: string; name: string };

export function MasterPanelPage() {
  const [section, setSection] = useState<MasterSectionId>("overview");
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(
    null,
  );

  const companiesQuery = useQuery({
    queryKey: ["master", "companies", "all"],
    queryFn: () => listCompanies(),
  });

  const allCompanies: CompanyOption[] = (companiesQuery.data || []).map(
    (c: Company) => ({
      id: c.id,
      name: c.name ?? "Empresa sem nome",
    }),
  );

  function renderSection() {
    switch (section) {
      case "overview":
        return <OverviewSection />;
      case "profile":
        return <ProfileSection />;
      case "companies":
        return <CompaniesSection />;
      case "collaborators":
        return <CollaboratorsSection companyId={selectedCompany?.id} />;
      case "parents":
        return <ParentsSection companyId={selectedCompany?.id} />;
      case "children":
        return <ChildrenSection companyId={selectedCompany?.id} />;
      case "attendances":
        return <AttendanceSection companyId={selectedCompany?.id} />;
      case "bootstrap":
        return <BootstrapSection />;
      case "admins":
        return <AdminsSection />;
    }
  }

  return (
    <main className="crm-shell">
      <CrmSidebar
        sections={MASTER_SECTION_ITEMS.map(({ id, label }) => ({ id, label }))}
        activeSection={section}
        onSelect={setSection}
        companies={allCompanies}
        selectedCompany={selectedCompany}
        onSelectCompany={(company) => setSelectedCompany(company)}
        onClearCompany={() => setSelectedCompany(null)}
      />

      <section className="crm-main">{renderSection()}</section>
    </main>
  );
}
