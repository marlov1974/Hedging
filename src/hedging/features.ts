import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerPortfolio } from "../database/types.ts";

export type PortfolioOption = {
  portfolio_id: string;
  portfolio_name: string;
  customer_name: string;
  customer_number: string;
  price_area: string;
  product_configuration_name?: string;
};

export type HedgingFeatureId =
  | "buy-baseloads"
  | "baseloads-calloff-list"
  | "portfolio-details"
  | "position-report"
  | "financial-settlement";

export type HedgingFeature = {
  feature_id: HedgingFeatureId;
  label: string;
  available: boolean;
  unavailable_reason?: string;
};

export function getPortfolioOptions(database: PrototypeDatabase): PortfolioOption[] {
  return [...database.portfolios.values()]
    .sort((left, right) => left.portfolio_id.localeCompare(right.portfolio_id))
    .map((portfolio) => {
      const customer = database.customers.get(portfolio.customer_id);
      return {
        portfolio_id: portfolio.portfolio_id,
        portfolio_name: portfolio.name,
        customer_name: customer?.name ?? "Unknown customer",
        customer_number: portfolio.customer_number,
        price_area: portfolio.price_area,
        product_configuration_name: getProductConfigurationNameForPortfolio(database, portfolio),
      };
    });
}

export function getAvailableFeaturesForPortfolio(database: PrototypeDatabase, portfolioId?: string): HedgingFeature[] {
  const selectedPortfolio = portfolioId ? database.portfolios.get(portfolioId) : undefined;
  const baseloadsAvailable = selectedPortfolio ? isBaseloadsPortfolio(database, selectedPortfolio.portfolio_id) : false;
  const reason = selectedPortfolio ? "Selected portfolio is not linked to Baseloads." : "Select a portfolio first.";

  return [
    {
      feature_id: "buy-baseloads",
      label: "Buy Baseloads",
      available: baseloadsAvailable,
      unavailable_reason: baseloadsAvailable ? undefined : reason,
    },
    {
      feature_id: "baseloads-calloff-list",
      label: "Baseloads Calloff List",
      available: baseloadsAvailable,
      unavailable_reason: baseloadsAvailable ? undefined : reason,
    },
    {
      feature_id: "portfolio-details",
      label: "Portfolio Details",
      available: Boolean(selectedPortfolio),
      unavailable_reason: selectedPortfolio ? undefined : reason,
    },
    {
      feature_id: "position-report",
      label: "Position Report",
      available: Boolean(selectedPortfolio),
      unavailable_reason: selectedPortfolio ? undefined : reason,
    },
    {
      feature_id: "financial-settlement",
      label: "Financial Settlement",
      available: baseloadsAvailable,
      unavailable_reason: baseloadsAvailable ? undefined : reason,
    },
  ];
}

export function isBaseloadsPortfolio(database: PrototypeDatabase, portfolioId: string): boolean {
  return getProductConfigurationNameForPortfolio(database, database.portfolios.get(portfolioId)) === "Baseloads";
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
