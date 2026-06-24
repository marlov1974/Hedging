import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COMPATIBILITY_ALIAS_COMPONENT_CODES,
  PROJECTED_ONLY_COMPONENT_CODES,
  RESERVED_COMPONENT_CODES,
  TARGET_CANONICAL_PEAKS_COMPONENT_CODES,
  canonicalComponentCode,
  componentCodeConcept,
  getComponentMetadata,
  isCanonicalSourceOfTruthComponentCode,
  isCompatibilityAliasComponentCode,
  isKnownComponentCode,
  isMarketProjectionComponent,
  isPersistableComponentCode,
  isProjectedOnlyComponentCode,
  isReservedComponentCode,
} from "../../src/database/canonicalComponents.ts";
import { createSchema } from "../../src/database/schema.ts";
import { insertProductConfiguration, insertProductConfigurationComponent, insertQFactorSet } from "../../src/database/repository.ts";
import { DatabaseError } from "../../src/database/types.ts";

describe("component code classification", () => {
  it("recognizes target Peaks canonical components as source-of-truth capable", () => {
    for (const component of TARGET_CANONICAL_PEAKS_COMPONENT_CODES) {
      assert.equal(componentCodeConcept(component), "canonical");
      assert.equal(isCanonicalSourceOfTruthComponentCode(component), true);
      assert.equal(isPersistableComponentCode(component), true);
      assert.equal(isProjectedOnlyComponentCode(component), false);
      assert.equal(isKnownComponentCode(component), true);
    }
  });

  it("recognizes Modern projected component names as projected-only", () => {
    for (const component of ["modern.base.sys", "modern.base.epad", "modern.peak.sys", "modern.peak.epad"]) {
      assert.ok(PROJECTED_ONLY_COMPONENT_CODES.includes(component as (typeof PROJECTED_ONLY_COMPONENT_CODES)[number]));
      assert.equal(componentCodeConcept(component), "projected");
      assert.equal(isProjectedOnlyComponentCode(component), true);
      assert.equal(isPersistableComponentCode(component), false);
      assert.equal(isKnownComponentCode(component), true);
    }
  });

  it("recognizes Classic projected component names as projected-only", () => {
    for (const component of ["classic.offpeak.sys", "classic.offpeak.epad", "classic.peak.sys", "classic.peak.epad"]) {
      assert.ok(PROJECTED_ONLY_COMPONENT_CODES.includes(component as (typeof PROJECTED_ONLY_COMPONENT_CODES)[number]));
      assert.equal(componentCodeConcept(component), "projected");
      assert.equal(isProjectedOnlyComponentCode(component), true);
      assert.equal(isPersistableComponentCode(component), false);
      assert.equal(isKnownComponentCode(component), true);
    }
  });

  it("keeps deprecated aliases explicit and persistable for compatibility", () => {
    for (const component of COMPATIBILITY_ALIAS_COMPONENT_CODES) {
      assert.equal(componentCodeConcept(component), "compatibility_alias");
      assert.equal(isCompatibilityAliasComponentCode(component), true);
      assert.equal(isPersistableComponentCode(component), true);
    }

    assert.equal(canonicalComponentCode("peak.premium.sys"), "peak.sys");
    assert.equal(canonicalComponentCode("peak.premium.epad"), "peak.epad");
    assert.equal(canonicalComponentCode("peak.modern.sys"), "peak.sys");
    assert.equal(canonicalComponentCode("peak.modern.epad"), "peak.epad");
    assert.equal(canonicalComponentCode("allocation.peak"), "allocation.peak");
    assert.equal(getComponentMetadata("allocation.peak").component_category, "allocation");
  });

  it("keeps older metadata entries reserved rather than target Peaks canonical", () => {
    for (const component of ["base.classic.sys", "peak.classic.epad", "profile.15m", "volume.flex", "fixed", "calendar"]) {
      assert.ok(RESERVED_COMPONENT_CODES.includes(component as (typeof RESERVED_COMPONENT_CODES)[number]));
      assert.equal(componentCodeConcept(component), "reserved");
      assert.equal(isReservedComponentCode(component), true);
      assert.equal(isPersistableComponentCode(component), true);
      assert.equal(isCanonicalSourceOfTruthComponentCode(component), false);
    }
  });

  it("keeps market projection excluding allocation components", () => {
    assert.equal(isMarketProjectionComponent("allocation.peak.sys"), false);
    assert.equal(isMarketProjectionComponent("allocation.peak.epad"), false);
    assert.equal(isMarketProjectionComponent("currency.eursek"), false);
    assert.equal(isMarketProjectionComponent("base.sys"), true);
    assert.equal(isMarketProjectionComponent("peak.sys"), true);
  });

  it("recognizes EUR/SEK currency component as persistable currency metadata", () => {
    assert.equal(componentCodeConcept("currency.eursek"), "reserved");
    assert.equal(isPersistableComponentCode("currency.eursek"), true);
    assert.equal(getComponentMetadata("currency.eursek").component_category, "currency");
    assert.equal(getComponentMetadata("currency.eursek").hour_basis, "none");
  });

  it("rejects projected-only names where persisted product components are required", () => {
    const database = createSchema();
    insertProductConfiguration(database, { product_id: "PRO99", name: "Synthetic Product" });

    for (const component of ["modern.base.sys", "classic.peak.sys"]) {
      assert.throws(
        () =>
          insertProductConfigurationComponent(database, {
            productcomponent_id: `PRO99:${component}`,
            product_id: "PRO99",
            name: `${component} component`,
            component,
            productitem: component.split(".")[0],
          }),
        (error) =>
          error instanceof DatabaseError &&
          error.code === "invalid_input" &&
          error.message.includes("projected-only component code"),
      );
    }
  });

  it("rejects projected-only names where persisted q-factor components are required", () => {
    for (const component of ["modern.peak.epad", "classic.offpeak.sys"]) {
      assert.throws(
        () =>
          insertQFactorSet(createSchema(), {
            qfactor_set_id: `Q-${component}`,
            name: `${component} Q-factor`,
            component,
            description: "Projected names are view-only",
          }),
        (error) =>
          error instanceof DatabaseError &&
          error.code === "invalid_input" &&
          error.message.includes("projected-only component code"),
      );
    }
  });
});
