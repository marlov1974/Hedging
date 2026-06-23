import type { ComponentCategory, ComponentHourBasis, ProductConfigurationComponent } from "./types.ts";

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

const COMPONENT_METADATA = new Map<string, ComponentMetadata>([
  ["allocation.peak", { component_category: "allocation", hour_basis: "peak_h" }],
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

export function isKnownComponentCode(component: string): boolean {
  return COMPONENT_METADATA.has(canonicalComponentCode(component));
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
