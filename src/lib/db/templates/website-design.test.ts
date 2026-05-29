import { describe, it, expect } from "vitest";
import {
  websiteMilestones,
  websiteFileCategories,
  websiteTemplates,
} from "./website-design";
import type { BriefField, BriefSection } from "../schema";

/**
 * The portal is template-driven — milestones, file categories, and brief
 * structures live in config, not code. These invariants guard against the kind
 * of typo (duplicate slug, missing itemSchema, gap in milestone order) that
 * would silently break the client UI or the project snapshot at creation time.
 */

const dupes = (arr: string[]) =>
  arr.filter((v, i) => arr.indexOf(v) !== i);

describe("website milestones", () => {
  it("has unique slugs", () => {
    expect(dupes(websiteMilestones.milestones.map((m) => m.slug))).toEqual([]);
  });

  it("is ordered 1..N with no gaps or duplicates", () => {
    const orders = websiteMilestones.milestones
      .map((m) => m.order)
      .sort((a, b) => a - b);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
  });

  it("gives every milestone a label", () => {
    for (const m of websiteMilestones.milestones) {
      expect(m.label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("website file categories", () => {
  it("has unique slugs", () => {
    expect(dupes(websiteFileCategories.categories.map((c) => c.slug))).toEqual([]);
  });
});

describe("website brief templates", () => {
  it("ships Basic and Standard", () => {
    expect(websiteTemplates.map((t) => t.name)).toEqual(["Basic", "Standard"]);
  });

  for (const template of websiteTemplates) {
    describe(`${template.name} template`, () => {
      const sections = template.briefStructure.sections;

      it("has unique section slugs", () => {
        expect(dupes(sections.map((s) => s.slug))).toEqual([]);
      });

      it("has unique field keys within each section", () => {
        for (const section of sections) {
          expect(dupes(section.fields.map((f) => f.key))).toEqual([]);
        }
      });

      it("gives structured_list fields an itemSchema, and plain fields none", () => {
        const check = (fields: BriefField[]) => {
          for (const f of fields) {
            if (f.type === "structured_list") {
              expect(f.itemSchema, `${f.key} needs itemSchema`).toBeTruthy();
              expect(f.itemSchema!.length).toBeGreaterThan(0);
            }
          }
        };
        const walk = (section: BriefSection) => check(section.fields);
        sections.forEach(walk);
      });

      it("gives select / checkbox_list fields non-empty options", () => {
        for (const section of sections) {
          for (const f of section.fields) {
            if (f.type === "select" || f.type === "checkbox_list") {
              expect(f.options, `${f.key} needs options`).toBeTruthy();
              expect(f.options!.length).toBeGreaterThan(0);
            }
          }
        }
      });
    });
  }
});
