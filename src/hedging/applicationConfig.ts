import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerPortfolio } from "../database/types.ts";
import { canonicalProductPackageName } from "../database/canonicalComponents.ts";

export type HedgingFeatureId =
  | "buy-baseloads"
  | "calloff-list"
  | "baseloads-calloff-list"
  | "legacy-calloff-list"
  | "modern-calloff-transaction-list"
  | "portfolio-details"
  | "position"
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

export type DataViewerPerspectiveId = PerspectiveId | "canonical";

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

export function getDataViewerPerspectiveOptions(): Array<{ perspective_id: DataViewerPerspectiveId; label: string }> {
  return [{ perspective_id: "canonical", label: "Canonical" }, ...getPerspectiveOptions()];
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
  _requestedPerspectiveId?: string,
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

  return {
    variant_id: "baseloads",
    perspective_id: "baseloads",
    title: "Universal model demo",
    context:
      "This demo uses one canonical portfolio. Each feature can show the same data from different perspectives: Baseloads, Classic and Modern.",
    accent: "neutral",
    features: [
      feature("portfolio-details", "Portfolio Details"),
      feature("forecast", "Forecast"),
      feature("forecast-hedge", "Hedge Forecast"),
      feature("calloff-list", "Calloff List"),
      feature("position-report", "Position Report"),
      feature("position", "Position"),
      feature("data-viewer", "Data Viewer"),
      feature("buy-baseloads", "Hedge Baseload"),
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
