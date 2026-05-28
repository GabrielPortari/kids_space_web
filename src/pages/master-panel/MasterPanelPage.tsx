import { useMemo, useState } from "react";
import { CrmSidebar } from "./components/CrmSidebar";
import { SectionTemplate } from "./components/SectionTemplate";
import { OverviewSection } from "./sections/OverviewSection";
import { AdminsSection } from "./sections/AdminsSection";
import { MASTER_SECTION_ITEMS } from "./data";
import type { MasterSectionId } from "./types";

export function MasterPanelPage() {
  const [section, setSection] = useState<MasterSectionId>("overview");

  const currentItem = useMemo(
    () =>
      MASTER_SECTION_ITEMS.find((item) => item.id === section) ||
      MASTER_SECTION_ITEMS[0],
    [section],
  );

  return (
    <main className="crm-shell">
      <CrmSidebar
        sections={MASTER_SECTION_ITEMS.map(({ id, label }) => ({ id, label }))}
        activeSection={section}
        onSelect={setSection}
      />

      <section className="crm-main">
        {section === "overview" && <OverviewSection />}
        {section === "admins" && <AdminsSection />}
        {section !== "overview" && section !== "admins" && (
          <SectionTemplate item={currentItem} />
        )}
      </section>
    </main>
  );
}