import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const catalog = readFileSync(new URL("../../docs/hedging/component_catalog.md", import.meta.url), "utf8");

describe("Component catalog documentation", () => {
  it("contains the required section structure", () => {
    for (const section of [
      "## 1. Purpose",
      "## 2. Layer Overview",
      "## 3. Canonical Source-Of-Truth Components",
      "## 4. Modern Projected Components",
      "## 5. Classic Projected Components",
      "## 6. Deprecated Aliases",
      "## 7. Visibility/Projection Listeners",
      "## 8. Physical Volume And Double-Counting Rules",
      "## 9. Formula Summary",
      "## 10. Examples",
    ]) {
      assert.match(catalog, new RegExp(escapeRegExp(section)));
    }
  });

  it("mentions all canonical Peaks components", () => {
    for (const component of [
      "allocation.peak.sys",
      "allocation.peak.epad",
      "base.sys",
      "base.epad",
      "peak.sys",
      "peak.epad",
    ]) {
      assert.match(catalog, new RegExp(`\\b${escapeRegExp(component)}\\b`));
    }
  });

  it("marks all Modern projected components as projected and not source of truth", () => {
    for (const component of ["modern.base.sys", "modern.base.epad", "modern.peak.sys", "modern.peak.epad"]) {
      assert.match(catalog, new RegExp(`### \`${escapeRegExp(component)}\`[\\s\\S]*?persisted = no, projected only`));
    }
    assert.match(catalog, /They are not persisted as source-of-truth transaction component codes\./);
  });

  it("marks all Classic projected components as projected and not source of truth", () => {
    for (const component of ["classic.offpeak.sys", "classic.offpeak.epad", "classic.peak.sys", "classic.peak.epad"]) {
      assert.match(catalog, new RegExp(`### \`${escapeRegExp(component)}\`[\\s\\S]*?persisted = no, projected only`));
    }
    assert.match(catalog, /Classic means Peak\/Offpeak levels\./);
  });

  it("lists deprecated aliases and compatibility rules", () => {
    for (const alias of [
      "allocation.peak -> allocation.peak.sys / allocation.peak.epad",
      "peak.premium.sys -> peak.sys",
      "peak.premium.epad -> peak.epad",
      "peak.modern.sys -> peak.sys",
      "peak.modern.epad -> peak.epad",
      "PeaksModern -> Peaks.Modern",
      "PeaksClassic -> Peaks.Classic",
    ]) {
      assert.match(catalog, new RegExp(escapeRegExp(alias)));
    }
    assert.match(catalog, /aliases are not a production migration strategy/);
  });

  it("states sys and epad must not be summed as physical volume", () => {
    assert.match(catalog, /Never sum sys and epad as physical customer volume\./);
    assert.match(catalog, /Use one effective volume carrier, usually sys/);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
