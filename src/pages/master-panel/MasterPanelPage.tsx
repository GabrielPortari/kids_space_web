import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CrmSidebar } from "./components/CrmSidebar";
import { SectionTemplate } from "./components/SectionTemplate";
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
    (c: Record<string, unknown>) => ({
      id: String(c.id || c._id || ""),
      name: String(c.name || "Empresa sem nome"),
    }),
  );

  const currentItem = useMemo(
    () =>
      MASTER_SECTION_ITEMS.find((item) => item.id === section) ||
      MASTER_SECTION_ITEMS[0],
    [section],
  );

  const showTemplateFallback =
    section !== "overview" &&
    section !== "admins" &&
    section !== "profile" &&
    section !== "companies" &&
    section !== "collaborators" &&
    section !== "parents" &&
    section !== "children" &&
    section !== "attendances" &&
    section !== "bootstrap";

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

      <section className="crm-main">
        {section === "overview" && <OverviewSection />}
        {section === "profile" && <ProfileSection />}
        {section === "companies" && <CompaniesSection />}
        {section === "collaborators" && (
          <CollaboratorsSection companyId={selectedCompany?.id} />
        )}
        {section === "parents" && (
          <ParentsSection companyId={selectedCompany?.id} />
        )}
        {section === "children" && (
          <ChildrenSection companyId={selectedCompany?.id} />
        )}
        {section === "attendances" && (
          <AttendanceSection companyId={selectedCompany?.id} />
        )}
        {section === "bootstrap" && <BootstrapSection />}
        {section === "admins" && <AdminsSection />}
        {showTemplateFallback && <SectionTemplate item={currentItem} />}
      </section>
    </main>
  );
}
