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
export type PerspectiveId = "baseloads" | "classic" | "modern";

export type PerspectiveOption = {
  perspective_id: PerspectiveId;
  label: string;
};

export type HedgingFeature = {
  feature_id: HedgingFeatureId;
  label: string;
  available: boolean;
  unavailable_reason?: string;
};

export type ApplicationConfig = {
  variant_id: ApplicationVariantId;
  perspective_id: PerspectiveId | "none";
  title: string;
  context: string;
  accent: "baseloads" | "peaks-classic" | "peaks-modern" | "neutral";
  features: HedgingFeature[];
};

export function getPerspectiveOptions(): PerspectiveOption[] {
  return [
    { perspective_id: "baseloads", label: "Baseloads" },
    { perspective_id: "classic", label: "Classic" },
    { perspective_id: "modern", label: "Modern" },
  ];
}

export function parsePerspectiveId(value: string | undefined, fallback: PerspectiveId = "baseloads"): PerspectiveId {
  const normalized = String(value ?? "").trim();
  return getPerspectiveOptions().some((option) => option.perspective_id === normalized)
    ? (normalized as PerspectiveId)
    : fallback;
}

export function defaultPerspectiveForPortfolio(database: PrototypeDatabase, portfolioId?: string): PerspectiveId {
  if (!portfolioId) {
    return "baseloads";
  }
  if (isPeaksModernPortfolio(database, portfolioId)) {
    return "modern";
  }
  if (isPeaksClassicPortfolio(database, portfolioId)) {
    return "classic";
  }
  return "baseloads";
}

export function getApplicationFeaturesForPortfolio(
  database: PrototypeDatabase,
  portfolioId?: string,
  requestedPerspectiveId?: string,
): ApplicationConfig {
  const selectedPortfolio = portfolioId ? database.portfolios.get(portfolioId) : undefined;
  if (!selectedPortfolio) {
    return {
      variant_id: "none",
      perspective_id: "none",
      title: "Select portfolio",
      context: "Select a portfolio to open an application variant.",
      accent: "neutral",
      features: [],
    };
  }

  const perspectiveId = parsePerspectiveId(requestedPerspectiveId, defaultPerspectiveForPortfolio(database, selectedPortfolio.portfolio_id));
  if (perspectiveId === "baseloads") {
    return {
      variant_id: "baseloads",
      perspective_id: perspectiveId,
      title: "Baseloads perspective",
      context:
        "Demo perspective over the selected portfolio. In production, product package contracts would control customer-visible features.",
      accent: "baseloads",
      features: [
        feature("portfolio-details", "Portfolio Details"),
        feature("forecast", "Forecast - Baseloads"),
        feature("buy-baseloads", "Hedge Baseload"),
        feature("baseloads-calloff-list", "Calloff List - Baseloads"),
        feature("position-report", "Position Report - Baseloads"),
        feature("financial-settlement", "Financial Settlement"),
        feature("data-viewer", "Data Viewer"),
      ],
    };
  }

  if (perspectiveId === "modern") {
    return {
      variant_id: "peaks-modern",
      perspective_id: perspectiveId,
      title: "Modern perspective",
      context: "Modern projection over the selected portfolio with base and peak views from canonical rows.",
      accent: "peaks-modern",
      features: [
        feature("portfolio-details", "Portfolio Details"),
        feature("forecast", "Forecast - Modern"),
        feature("forecast-hedge", "Hedge Forecast - Modern"),
        feature("modern-calloff-transaction-list", "Calloff List - Modern"),
        feature("position-report", "Position Report - Modern"),
        feature("data-viewer", "Data Viewer"),
      ],
    };
  }

  return {
    variant_id: "peaks-classic",
    perspective_id: perspectiveId,
    title: "Classic perspective",
    context: "Classic Peak/Offpeak projection over the selected portfolio from canonical rows.",
    accent: "peaks-classic",
    features: [
      feature("portfolio-details", "Portfolio Details"),
      feature("forecast", "Forecast - Classic"),
      feature("forecast-hedge", "Hedge Forecast - Classic"),
      feature("legacy-calloff-list", "Calloff List - Classic"),
      feature("position-report", "Position Report - Classic"),
      feature("data-viewer", "Data Viewer"),
    ],
  };
}

export function resolveActiveFeature(
  database: PrototypeDatabase,
  portfolioId: string | undefined,
  requestedFeatureId: HedgingFeatureId | undefined,
  perspectiveId?: string,
): HedgingFeatureId {
  const features = getApplicationFeaturesForPortfolio(database, portfolioId, perspectiveId).features.filter((candidate) => candidate.available);
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
