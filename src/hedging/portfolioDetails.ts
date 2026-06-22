import type { PrototypeDatabase } from "../database/schema.ts";
import { getProductConfigurationNameForPortfolio } from "./features.ts";

export type PortfolioDetails = {
  portfolio_id: string;
  portfolio_name: string;
  customer_name: string;
  customer_number: string;
  price_area: string;
  product_configuration_name?: string;
  calendar_id: string;
};

export function getPortfolioDetails(database: PrototypeDatabase, portfolioId: string): PortfolioDetails | undefined {
  const portfolio = database.portfolios.get(portfolioId);
  if (!portfolio) {
    return undefined;
  }

  const customer = database.customers.get(portfolio.customer_id);

  return {
    portfolio_id: portfolio.portfolio_id,
    portfolio_name: portfolio.name,
    customer_name: customer?.name ?? "Unknown customer",
    customer_number: portfolio.customer_number,
    price_area: portfolio.price_area,
    product_configuration_name: getProductConfigurationNameForPortfolio(database, portfolio),
    calendar_id: portfolio.calendar_id,
  };
}
