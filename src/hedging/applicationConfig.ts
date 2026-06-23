import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerPortfolio } from "../database/types.ts";
import { canonicalProductPackageName } from "../database/canonicalComponents.ts";

export type HedgingFeatureId =
  | "buy-baseloads"
  | "baseloads-calloff-list"
  | "legacy-calloff-list"
  | "modern-calloff-transaction-list"
  | "portfolio-details"
  | "position-report"
  | "financial-settlement"
  | "forecast"
  | "forecast-hedge"
  | "data-viewer";

export type ApplicationVariantId = "none" | "baseloads" | "peaks-classic" | "peaks-modern" | "unsupported";

export type HedgingFeature = {
  feature_id: HedgingFeatureId;
  label: string;
  available: boolean;
  unavailable_reason?: string;
};

export type ApplicationConfig = {
  variant_id: ApplicationVariantId;
  title: string;
  context: string;
  accent: "baseloads" | "peaks-classic" | "peaks-modern" | "neutral";
  features: HedgingFeature[];
};

export function getApplicationFeaturesForPortfolio(database: PrototypeDatabase, portfolioId?: string): ApplicationConfig {
  const selectedPortfolio = portfolioId ? database.portfolios.get(portfolioId) : undefined;
  if (!selectedPortfolio) {
    return {
      variant_id: "none",
      title: "Select portfolio",
      context: "Select a portfolio to open an application variant.",
      accent: "neutral",
      features: [],
    };
  }

  if (isBaseloadsPortfolio(database, selectedPortfolio.portfolio_id)) {
    return {
      variant_id: "baseloads",
      title: "Baseloads application",
      context: "Baseloads hedge purchase, position and settlement workflow.",
      accent: "baseloads",
      features: [
        feature("portfolio-details", "Portfolio Details"),
        feature("buy-baseloads", "Buy Baseloads"),
        feature("baseloads-calloff-list", "Baseloads Calloff List"),
        feature("position-report", "Position Report"),
        feature("financial-settlement", "Financial Settlement"),
        feature("data-viewer", "Data Viewer"),
      ],
    };
  }

  if (isPeaksModernPortfolio(database, selectedPortfolio.portfolio_id)) {
    return {
      variant_id: "peaks-modern",
      title: "Peaks.Modern application",
      context: "Peaks.Modern workspace for modern base and peak forecast hedging.",
      accent: "peaks-modern",
      features: [
        feature("portfolio-details", "Portfolio Details"),
        feature("forecast", "Forecast"),
        feature("forecast-hedge", "Hedge Forecast"),
        feature("modern-calloff-transaction-list", "Calloff Transaction List"),
        feature("data-viewer", "Data Viewer"),
      ],
    };
  }

  if (isPeaksClassicPortfolio(database, selectedPortfolio.portfolio_id)) {
    return {
      variant_id: "peaks-classic",
      title: "Peaks.Classic application",
      context: "Peaks.Classic legacy projection workspace for Peak and Offpeak calloff rows.",
      accent: "peaks-classic",
      features: [
        feature("portfolio-details", "Portfolio Details"),
        feature("legacy-calloff-list", "Calloff Transaction List"),
        feature("data-viewer", "Data Viewer"),
      ],
    };
  }

  return {
    variant_id: "unsupported",
    title: "Unsupported application",
    context: "Selected portfolio does not have an application variant in this PoC.",
    accent: "neutral",
    features: [
      feature("portfolio-details", "Portfolio Details"),
      unavailableFeature("forecast", "Forecast", "Selected portfolio does not support Forecast in this PoC."),
      unavailableFeature("forecast-hedge", "Hedge Forecast", "Selected portfolio does not support Hedge Forecast in this PoC."),
      unavailableFeature("data-viewer", "Data Viewer", "Selected portfolio does not support Data Viewer in this PoC."),
    ],
  };
}

export function resolveActiveFeature(
  database: PrototypeDatabase,
  portfolioId: string | undefined,
  requestedFeatureId: HedgingFeatureId | undefined,
): HedgingFeatureId {
  const features = getApplicationFeaturesForPortfolio(database, portfolioId).features.filter((candidate) => candidate.available);
  if (requestedFeatureId && features.some((feature) => feature.feature_id === requestedFeatureId)) {
    return requestedFeatureId;
  }
  return features[0]?.feature_id ?? "portfolio-details";
}

export function isBaseloadsPortfolio(database: PrototypeDatabase, portfolioId: string): boolean {
  return getProductConfigurationNameForPortfolio(database, database.portfolios.get(portfolioId)) === "Baseloads";
}

export function isPeaksModernPortfolio(database: PrototypeDatabase, portfolioId: string): boolean {
  return canonicalProductPackageName(getProductConfigurationNameForPortfolio(database, database.portfolios.get(portfolioId)) ?? "") === "Peaks.Modern";
}

export function isPeaksClassicPortfolio(database: PrototypeDatabase, portfolioId: string): boolean {
  return canonicalProductPackageName(getProductConfigurationNameForPortfolio(database, database.portfolios.get(portfolioId)) ?? "") === "Peaks.Classic";
}

export function getProductConfigurationNameForPortfolio(
  database: PrototypeDatabase,
  portfolio: CustomerPortfolio | undefined,
): string | undefined {
  if (!portfolio) {
    return undefined;
  }

  const productIds = new Set(
    [...database.portfolioProductComponents.values()]
      .filter((component) => component.portfolio_id === portfolio.portfolio_id)
      .map((component) => database.productConfigurationComponents.get(component.productcomponent_id)?.product_id)
      .filter((productId): productId is string => Boolean(productId)),
  );

  if (productIds.size !== 1) {
    return undefined;
  }

  return database.productConfigurations.get([...productIds][0])?.name;
}

function feature(featureId: HedgingFeatureId, label: string): HedgingFeature {
  return {
    feature_id: featureId,
    label,
    available: true,
  };
}

function unavailableFeature(featureId: HedgingFeatureId, label: string, reason: string): HedgingFeature {
  return {
    feature_id: featureId,
    label,
    available: false,
    unavailable_reason: reason,
  };
}
