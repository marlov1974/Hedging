import type { PrototypeDatabase } from "../database/schema.ts";
import {
  getApplicationFeaturesForPortfolio,
  getProductConfigurationNameForPortfolio,
  isBaseloadsPortfolio,
  type HedgingFeature,
  type HedgingFeatureId,
} from "./applicationConfig.ts";

export type PortfolioOption = {
  portfolio_id: string;
  portfolio_name: string;
  customer_name: string;
  customer_number: string;
  price_area: string;
  product_configuration_name?: string;
};

export type { HedgingFeature, HedgingFeatureId };

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
  return getApplicationFeaturesForPortfolio(database, portfolioId).features;
}

export { getProductConfigurationNameForPortfolio, isBaseloadsPortfolio };
