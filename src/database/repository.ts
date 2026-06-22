import type { PrototypeDatabase } from "./schema.ts";
import {
  DatabaseError,
  type Calendar,
  type Customer,
  type CustomerForecast,
  type CustomerPortfolio,
  type CustomerPortfolioWithForecasts,
  type PriceComponent,
  type ProductConfiguration,
  type ProductConfigurationComponent,
  type ProductConfigurationWithComponents,
} from "./types.ts";
import { assertFiniteNumber, assertKnownComponentCode, assertMonth, assertRequiredString } from "./validation.ts";

export function insertCustomer(database: PrototypeDatabase, input: Customer): Customer {
  assertUniqueKey(database.customers, input.customer_id, "customer_id");
  assertRequiredString(input.name, "name");
  assertRequiredString(input.customer_number, "customer_number");

  if (database.customersByNumber.has(input.customer_number)) {
    throw new DatabaseError("duplicate_key", `customer_number ${input.customer_number} already exists`);
  }

  database.customers.set(input.customer_id, input);
  database.customersByNumber.set(input.customer_number, input.customer_id);
  return input;
}

export function insertCalendar(database: PrototypeDatabase, input: Calendar): Calendar {
  assertUniqueKey(database.calendars, input.calendar_id, "calendar_id");
  assertMonth(input.month, "month");
  assertFiniteNumber(input.total_h, "total_h");
  assertFiniteNumber(input.peak_h, "peak_h");

  if (input.peak_h > input.total_h) {
    throw new DatabaseError("invalid_input", "peak_h must be less than or equal to total_h");
  }

  database.calendars.set(input.calendar_id, input);
  return input;
}

export function insertCustomerPortfolio(database: PrototypeDatabase, input: CustomerPortfolio): CustomerPortfolio {
  assertUniqueKey(database.portfolios, input.portfolio_id, "portfolio_id");
  assertRequiredString(input.name, "name");
  assertRequiredString(input.price_area, "price_area");

  const customer = database.customers.get(input.customer_id);
  if (!customer) {
    throw new DatabaseError("not_found", `customer_id ${input.customer_id} does not exist`);
  }

  if (!database.calendars.has(input.calendar_id)) {
    throw new DatabaseError("not_found", `calendar_id ${input.calendar_id} does not exist`);
  }

  if (input.customer_number !== customer.customer_number) {
    throw new DatabaseError("invalid_input", "portfolio customer_number must match linked customer");
  }

  database.portfolios.set(input.portfolio_id, input);
  return input;
}

export function insertCustomerForecast(database: PrototypeDatabase, input: CustomerForecast): CustomerForecast {
  assertUniqueKey(database.forecasts, input.forecast_id, "forecast_id");
  assertMonth(input.month, "month");
  assertFiniteNumber(input.mwh, "mwh");
  assertFiniteNumber(input.peak_pct, "peak_pct");

  if (!database.portfolios.has(input.portfolio_id)) {
    throw new DatabaseError("not_found", `portfolio_id ${input.portfolio_id} does not exist`);
  }

  const portfolioMonthKey = forecastKey(input.portfolio_id, input.month);
  if (database.forecastsByPortfolioMonth.has(portfolioMonthKey)) {
    throw new DatabaseError("duplicate_key", `forecast already exists for ${input.portfolio_id} ${input.month}`);
  }

  database.forecasts.set(input.forecast_id, input);
  database.forecastsByPortfolioMonth.set(portfolioMonthKey, input.forecast_id);
  return input;
}

export function insertProductConfiguration(database: PrototypeDatabase, input: ProductConfiguration): ProductConfiguration {
  assertUniqueKey(database.productConfigurations, input.product_id, "product_id");
  assertRequiredString(input.name, "name");

  database.productConfigurations.set(input.product_id, input);
  return input;
}

export function insertProductConfigurationComponent(
  database: PrototypeDatabase,
  input: ProductConfigurationComponent,
): ProductConfigurationComponent {
  assertUniqueKey(database.productConfigurationComponents, input.productcomponent_id, "productcomponent_id");
  assertRequiredString(input.name, "name");
  assertRequiredString(input.productitem, "productitem");
  assertKnownComponentCode(input.component);

  if (!database.productConfigurations.has(input.product_id)) {
    throw new DatabaseError("not_found", `product_id ${input.product_id} does not exist`);
  }

  database.productConfigurationComponents.set(input.productcomponent_id, input);
  return input;
}

export function insertPriceComponent(database: PrototypeDatabase, input: PriceComponent): PriceComponent {
  assertUniqueKey(database.priceComponents, input.pricecomponent_id, "pricecomponent_id");
  assertFiniteNumber(input.price, "price");
  assertRequiredString(input.currency, "currency");

  if (!database.productConfigurationComponents.has(input.productcomponent_id)) {
    throw new DatabaseError("not_found", `productcomponent_id ${input.productcomponent_id} does not exist`);
  }

  database.priceComponents.set(input.pricecomponent_id, input);
  return input;
}

export function getCustomerPortfolioWithForecasts(
  database: PrototypeDatabase,
  portfolioId: string,
): CustomerPortfolioWithForecasts | undefined {
  const portfolio = database.portfolios.get(portfolioId);
  if (!portfolio) {
    return undefined;
  }

  const customer = database.customers.get(portfolio.customer_id);
  const calendar = database.calendars.get(portfolio.calendar_id);
  if (!customer || !calendar) {
    return undefined;
  }

  const forecasts = [...database.forecasts.values()]
    .filter((forecast) => forecast.portfolio_id === portfolioId)
    .sort((left, right) => left.month.localeCompare(right.month));

  return { portfolio, customer, calendar, forecasts };
}

export function getProductConfigurationWithComponents(
  database: PrototypeDatabase,
  productId: string,
): ProductConfigurationWithComponents | undefined {
  const product = database.productConfigurations.get(productId);
  if (!product) {
    return undefined;
  }

  const components = [...database.productConfigurationComponents.values()]
    .filter((component) => component.product_id === productId)
    .sort((left, right) => left.productcomponent_id.localeCompare(right.productcomponent_id))
    .map((component) => ({
      component,
      price_components: [...database.priceComponents.values()]
        .filter((priceComponent) => priceComponent.productcomponent_id === component.productcomponent_id)
        .sort((left, right) => left.pricecomponent_id.localeCompare(right.pricecomponent_id)),
    }));

  return { product, components };
}

function assertUniqueKey<T>(map: Map<string, T>, key: string, fieldName: string): void {
  assertRequiredString(key, fieldName);
  if (map.has(key)) {
    throw new DatabaseError("duplicate_key", `${fieldName} ${key} already exists`);
  }
}

function forecastKey(portfolioId: string, month: string): string {
  return `${portfolioId}|${month}`;
}
