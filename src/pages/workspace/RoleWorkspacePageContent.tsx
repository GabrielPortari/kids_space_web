import { Link } from "react-router-dom";
import { useWorkspaceContext } from "./WorkspaceContext";
import { SectionNav } from "./components/SectionNav";
import { StatusMessage } from "./components/StatusMessage";
import { ProfileSection } from "./sections/ProfileSection";
import { CollaboratorsSection } from "./sections/CollaboratorsSection";
import { ParentsSection } from "./sections/ParentsSection";
import { ChildrenSection } from "./sections/ChildrenSection";
import { AttendanceSection } from "./sections/AttendanceSection";
import { LinksSection } from "./sections/LinksSection";
import { CompaniesSection } from "./sections/CompaniesSection";
import { BootstrapSection } from "./sections/BootstrapSection";
import type { CrmSection } from "./types";

export function RoleWorkspacePageContent({
  logout,
}: {
  logout: () => Promise<void>;
}) {
  const {
    section,
    setSection,
    setSearch,
    setPage,
    setStatusMessage,
    statusMessage,
    availableSections,
    isAdminOrMaster,
  } = useWorkspaceContext();

  const handleSectionChange = (newSection: CrmSection) => {
    setSection(newSection);
    setSearch("");
    setPage(1);
    setStatusMessage(null);
  };

  const visibleSections = availableSections;

  return (
    <main className="crm-shell">
      <SectionNav
        sections={visibleSections}
        activeSection={section}
        onSelect={handleSectionChange}
      />

      <section className="crm-main">
        <StatusMessage message={statusMessage} />

        {section === "profile" && <ProfileSection />}
        {section === "companies" && isAdminOrMaster && <CompaniesSection />}
        {section === "collaborators" && <CollaboratorsSection />}
        {section === "parents" && <ParentsSection />}
        {section === "children" && <ChildrenSection />}
        {section === "links" && <LinksSection />}
        {section === "attendance" && <AttendanceSection />}
        {section === "master-bootstrap" && isAdminOrMaster && (
          <BootstrapSection />
        )}
      </section>
    </main>
  );
}
