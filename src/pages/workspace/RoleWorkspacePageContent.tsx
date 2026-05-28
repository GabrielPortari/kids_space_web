import { useWorkspaceContext } from "./WorkspaceContext";
import { SectionNav } from "./components/SectionNav";
import { StatusMessage } from "./components/StatusMessage";
import { DashboardSection } from "./sections/DashboardSection";
import { ProfileSection } from "./sections/ProfileSection";
import { CollaboratorsSection } from "./sections/CollaboratorsSection";
import { ParentsSection } from "./sections/ParentsSection";
import { ChildrenSection } from "./sections/ChildrenSection";
import { AttendanceSection } from "./sections/AttendanceSection";
import type { CrmSection } from "./types";

export function RoleWorkspacePageContent() {
  const {
    section,
    setSection,
    setSearch,
    setPage,
    setStatusMessage,
    statusMessage,
    availableSections,
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

        {section === "dashboard" && <DashboardSection />}
        {section === "profile" && <ProfileSection />}
        {section === "collaborators" && <CollaboratorsSection />}
        {section === "parents" && <ParentsSection />}
        {section === "children" && <ChildrenSection />}
        {section === "attendance" && <AttendanceSection />}
      </section>
    </main>
  );
}
