import { describe, expect, it } from "vitest";
import { MASTER_SECTION_ITEMS } from "../data";
import type { MasterSectionId } from "../types";

const ALL_SECTION_IDS: MasterSectionId[] = [
  "overview",
  "profile",
  "admins",
  "companies",
  "collaborators",
  "parents",
  "children",
  "attendances",
  "bootstrap",
];

describe("MASTER_SECTION_ITEMS", () => {
  it("covers every MasterSectionId exactly once", () => {
    const itemIds = MASTER_SECTION_ITEMS.map((item) => item.id);

    for (const id of ALL_SECTION_IDS) {
      expect(itemIds).toContain(id);
    }

    expect(new Set(itemIds).size).toBe(itemIds.length);
    expect(itemIds.length).toBe(ALL_SECTION_IDS.length);
  });

  it("every item has a non-empty label, title and description", () => {
    for (const item of MASTER_SECTION_ITEMS) {
      expect(item.label.trim()).not.toBe("");
      expect(item.title.trim()).not.toBe("");
      expect(item.description.trim()).not.toBe("");
    }
  });
});
