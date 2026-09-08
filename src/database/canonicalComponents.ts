import type { ComponentCategory, ComponentHourBasis, ProductConfigurationComponent } from "./types.ts";

export type ComponentCodeConcept =
  | "canonical"
  | "projected"
  | "compatibility_alias"
  | "reserved"
  | "unknown_adjustment";

export type ComponentMetadata = {
  component_category: ComponentCategory;
  hour_basis: ComponentHourBasis;
};

export const PRODUCT_PACKAGE_ALIASES = new Map([
  ["PeaksClassic", "Peaks.Classic"],
  ["PeaksModern", "Peaks.Modern"],
  ["ProfilesClassic", "Profiles.Classic"],
  ["ProfilesModern", "Profiles.Modern"],
]);

export const COMPONENT_ALIASES = new Map([
  ["peak.modern.sys", "peak.sys"],
  ["peak.modern.epad", "peak.epad"],
  ["peak.premium.sys", "peak.sys"],
  ["peak.premium.epad", "peak.epad"],
]);

export const TARGET_CANONICAL_PEAKS_COMPONENT_CODES = [
  "allocation.peak.sys",
  "allocation.peak.epad",
  "base.sys",
  "base.epad",
  "peak.sys",
  "peak.epad",
] as const;

export const PROJECTED_ONLY_COMPONENT_CODES = [
  "modern.base.sys",
  "modern.base.epad",
  "modern.peak.sys",
  "modern.peak.epad",
  "classic.offpeak.sys",
  "classic.offpeak.epad",
  "classic.peak.sys",
  "classic.peak.epad",
] as const;

export const COMPATIBILITY_ALIAS_COMPONENT_CODES = [
  "allocation.peak",
  "peak.modern.sys",
  "peak.modern.epad",
  "peak.premium.sys",
  "peak.premium.epad",
] as const;

export const RESERVED_COMPONENT_CODES = [
  "base",
  "sys",
  "epad",
  "base.classic.sys",
  "base.classic.epad",
  "peak",
  "offpeak",
  "peak.classic.sys",
  "peak.classic.epad",
  "profile.peak",
  "profile.15m",
  "profile.sys",
  "profile.epad",
  "volume",
  "volume.flex",
  "fixed",
  "calendar",
  "currency.sek",
] as const;

const COMPONENT_METADATA = new Map<string, ComponentMetadata>([
  ["allocation.peak", { component_category: "allocation", hour_basis: "peak_h" }],
  ["allocation.peak.sys", { component_category: "allocation", hour_basis: "peak_h" }],
  ["allocation.peak.epad", { component_category: "allocation", hour_basis: "peak_h" }],
  ["base", { component_category: "base", hour_basis: "total_h" }],
  ["base.sys", { component_category: "base", hour_basis: "total_h" }],
  ["base.epad", { component_category: "base", hour_basis: "total_h" }],
  ["base.classic.sys", { component_category: "base", hour_basis: "total_h" }],
  ["base.classic.epad", { component_category: "base", hour_basis: "total_h" }],
  ["peak", { component_category: "peak", hour_basis: "peak_h" }],
  ["offpeak", { component_category: "peak", hour_basis: "offpeak_h" }],
  ["peak.classic.sys", { component_category: "peak", hour_basis: "peak_h" }],
  ["peak.classic.epad", { component_category: "peak", hour_basis: "peak_h" }],
  ["peak.sys", { component_category: "peak", hour_basis: "peak_h" }],
  ["peak.epad", { component_category: "peak", hour_basis: "peak_h" }],
  ["profile.peak", { component_category: "profile", hour_basis: "peak_h" }],
  ["profile.15m", { component_category: "profile", hour_basis: "total_h" }],
  ["profile.sys", { component_category: "profile", hour_basis: "total_h" }],
  ["profile.epad", { component_category: "profile", hour_basis: "total_h" }],
  ["volume", { component_category: "volume", hour_basis: "total_h" }],
  ["volume.flex", { component_category: "volume", hour_basis: "total_h" }],
  ["fixed", { component_category: "adjustment", hour_basis: "none" }],
  ["calendar", { component_category: "adjustment", hour_basis: "none" }],
  ["currency.sek", { component_category: "currency", hour_basis: "none" }],
]);

export function canonicalProductPackageName(name: string): string {
  return PRODUCT_PACKAGE_ALIASES.get(name) ?? name;
}

export function canonicalComponentCode(component: string): string {
  return COMPONENT_ALIASES.get(component) ?? component;
}

export function componentCodeConcept(component: string): ComponentCodeConcept {
  if (isProjectedOnlyComponentCode(component)) {
    return "projected";
  }
  if (isCompatibilityAliasComponentCode(component)) {
    return "compatibility_alias";
  }
  if (TARGET_CANONICAL_PEAKS_COMPONENT_CODES.includes(component as (typeof TARGET_CANONICAL_PEAKS_COMPONENT_CODES)[number])) {
    return "canonical";
  }
  if (isReservedComponentCode(component)) {
    return "reserved";
  }
  return "unknown_adjustment";
}

export function isCanonicalSourceOfTruthComponentCode(component: string): boolean {
  return TARGET_CANONICAL_PEAKS_COMPONENT_CODES.includes(
    canonicalComponentCode(component) as (typeof TARGET_CANONICAL_PEAKS_COMPONENT_CODES)[number],
  );
}

export function isProjectedOnlyComponentCode(component: string): boolean {
  return PROJECTED_ONLY_COMPONENT_CODES.includes(component as (typeof PROJECTED_ONLY_COMPONENT_CODES)[number]);
}

export function isCompatibilityAliasComponentCode(component: string): boolean {
  return COMPATIBILITY_ALIAS_COMPONENT_CODES.includes(component as (typeof COMPATIBILITY_ALIAS_COMPONENT_CODES)[number]);
}

export function isReservedComponentCode(component: string): boolean {
  return RESERVED_COMPONENT_CODES.includes(canonicalComponentCode(component) as (typeof RESERVED_COMPONENT_CODES)[number]);
}

export function isPersistableComponentCode(component: string): boolean {
  const concept = componentCodeConcept(component);
  return concept === "canonical" || concept === "compatibility_alias" || concept === "reserved";
}

export function isKnownComponentCode(component: string): boolean {
  return componentCodeConcept(component) !== "unknown_adjustment";
}

export function getComponentMetadata(component: string): ComponentMetadata {
  const metadata = COMPONENT_METADATA.get(canonicalComponentCode(component));
  if (!metadata) {
    return { component_category: "adjustment", hour_basis: "none" };
  }
  return metadata;
}

export function getComponentCategory(component: string | ProductConfigurationComponent): ComponentCategory {
  if (typeof component === "string") {
    return getComponentMetadata(component).component_category;
  }
  return component.component_category ?? getComponentMetadata(component.component).component_category;
}

export function getComponentHourBasis(component: string | ProductConfigurationComponent): ComponentHourBasis {
  if (typeof component === "string") {
    return getComponentMetadata(component).hour_basis;
  }
  return component.hour_basis ?? getComponentMetadata(component.component).hour_basis;
}

export function isMarketProjectionComponent(component: string | ProductConfigurationComponent): boolean {
  const category = getComponentCategory(component);
  return category === "base" || category === "peak" || category === "profile";
}

export function isCustomerProjectionComponent(component: string | ProductConfigurationComponent): boolean {
  return getComponentCategory(component) !== "adjustment";
}

export function isInternalProjectionComponent(_component: string | ProductConfigurationComponent): boolean {
  return true;
}
