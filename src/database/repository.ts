import type { PrototypeDatabase } from "./schema.ts";
import {
  DatabaseError,
  type Calendar,
  type Calloff,
  type CalloffWithTransactions,
  type Customer,
  type CustomerForecast,
  type CustomerPortfolio,
  type CustomerPortfolioWithForecasts,
  type CustomerTransaction,
  type PriceComponent,
  type PortfolioProductComponent,
  type ProductConfiguration,
  type ProductConfigurationComponent,
  type ProductConfigurationWithComponents,
  type QFactorSet,
  type QFactorValue,
} from "./types.ts";
import { assertDate, assertFiniteNumber, assertKnownComponentCode, assertMonth, assertRequiredString } from "./validation.ts";

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

  if (!calendarExists(database, input.calendar_id)) {
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

export function insertQFactorSet(database: PrototypeDatabase, input: QFactorSet): QFactorSet {
  assertUniqueKey(database.qFactorSets, input.qfactor_set_id, "qfactor_set_id");
  assertRequiredString(input.name, "name");
  assertKnownComponentCode(input.component);
  assertRequiredString(input.description, "description");

  database.qFactorSets.set(input.qfactor_set_id, input);
  return input;
}

export function insertQFactorValue(database: PrototypeDatabase, input: QFactorValue): QFactorValue {
  assertUniqueKey(database.qFactorValues, input.qfactor_value_id, "qfactor_value_id");
  assertRequiredString(input.qfactor_set_id, "qfactor_set_id");
  assertMonth(input.month, "month");
  assertFiniteNumber(input.value, "value");

  if (!database.qFactorSets.has(input.qfactor_set_id)) {
    throw new DatabaseError("not_found", `qfactor_set_id ${input.qfactor_set_id} does not exist`);
  }

  const setMonthKey = qFactorSetMonthKey(input.qfactor_set_id, input.month);
  if (database.qFactorValuesBySetMonth.has(setMonthKey)) {
    throw new DatabaseError("duplicate_key", `qfactor value already exists for ${input.qfactor_set_id} ${input.month}`);
  }

  database.qFactorValues.set(input.qfactor_value_id, input);
  database.qFactorValuesBySetMonth.set(setMonthKey, input.qfactor_value_id);
  return input;
}

export function insertPortfolioProductComponent(
  database: PrototypeDatabase,
  input: PortfolioProductComponent,
): PortfolioProductComponent {
  assertUniqueKey(database.portfolioProductComponents, input.portfolio_productcomponent_id, "portfolio_productcomponent_id");
  assertRequiredString(input.portfolio_id, "portfolio_id");
  assertRequiredString(input.productcomponent_id, "productcomponent_id");
  assertRequiredString(input.qfactor_set_id, "qfactor_set_id");

  if (!database.portfolios.has(input.portfolio_id)) {
    throw new DatabaseError("not_found", `portfolio_id ${input.portfolio_id} does not exist`);
  }

  const productComponent = database.productConfigurationComponents.get(input.productcomponent_id);
  if (!productComponent) {
    throw new DatabaseError("not_found", `productcomponent_id ${input.productcomponent_id} does not exist`);
  }

  const qFactorSet = database.qFactorSets.get(input.qfactor_set_id);
  if (!qFactorSet) {
    throw new DatabaseError("not_found", `qfactor_set_id ${input.qfactor_set_id} does not exist`);
  }

  if (qFactorSet.component !== productComponent.component) {
    throw new DatabaseError("invalid_input", "qfactor set component must match product component component");
  }

  database.portfolioProductComponents.set(input.portfolio_productcomponent_id, input);
  return input;
}

export function insertCalloff(database: PrototypeDatabase, input: Calloff): Calloff {
  assertUniqueKey(database.calloffs, input.calloff_id, "calloff_id");
  assertRequiredString(input.product_id, "product_id");
  assertRequiredString(input.portfolio_id, "portfolio_id");
  assertDate(input.date, "date");
  assertMonth(input.delivery_start_month, "delivery_start_month");
  assertMonth(input.delivery_end_month, "delivery_end_month");

  if (input.delivery_end_month < input.delivery_start_month) {
    throw new DatabaseError("invalid_input", "delivery_end_month must be greater than or equal to delivery_start_month");
  }

  if (!database.productConfigurations.has(input.product_id)) {
    throw new DatabaseError("not_found", `product_id ${input.product_id} does not exist`);
  }

  if (!database.portfolios.has(input.portfolio_id)) {
    throw new DatabaseError("not_found", `portfolio_id ${input.portfolio_id} does not exist`);
  }

  database.calloffs.set(input.calloff_id, input);
  return input;
}

export function insertTransaction(database: PrototypeDatabase, input: CustomerTransaction): CustomerTransaction {
  assertUniqueKey(database.transactions, input.transaction_id, "transaction_id");
  assertRequiredString(input.calloff_id, "calloff_id");
  assertMonth(input.month, "month");
  assertRequiredString(input.productcomponent_id, "productcomponent_id");
  assertFiniteNumber(input.mw, "mw");
  assertFiniteNumber(input.q_factor, "q_factor");

  const calloff = database.calloffs.get(input.calloff_id);
  if (!calloff) {
    throw new DatabaseError("not_found", `calloff_id ${input.calloff_id} does not exist`);
  }

  const productComponent = database.productConfigurationComponents.get(input.productcomponent_id);
  if (!productComponent) {
    throw new DatabaseError("not_found", `productcomponent_id ${input.productcomponent_id} does not exist`);
  }

  if (productComponent.product_id !== calloff.product_id) {
    throw new DatabaseError("invalid_input", "transaction productcomponent_id must belong to calloff product_id");
  }

  database.transactions.set(input.transaction_id, input);
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
  const calendar = findCalendar(database, portfolio.calendar_id);
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

export function getPortfolioProductComponents(
  database: PrototypeDatabase,
  portfolioId: string,
): PortfolioProductComponent[] {
  return [...database.portfolioProductComponents.values()]
    .filter((component) => component.portfolio_id === portfolioId)
    .sort((left, right) => left.portfolio_productcomponent_id.localeCompare(right.portfolio_productcomponent_id));
}

export function getQFactorValuesBySet(database: PrototypeDatabase, qFactorSetId: string): QFactorValue[] {
  return [...database.qFactorValues.values()]
    .filter((value) => value.qfactor_set_id === qFactorSetId)
    .sort((left, right) => left.month.localeCompare(right.month));
}

export function getCalloffWithTransactions(
  database: PrototypeDatabase,
  calloffId: string,
): CalloffWithTransactions | undefined {
  const calloff = database.calloffs.get(calloffId);
  if (!calloff) {
    return undefined;
  }

  return {
    calloff,
    transactions: getSortedTransactions(database).filter((transaction) => transaction.calloff_id === calloffId),
  };
}

export function getTransactionsByPortfolio(database: PrototypeDatabase, portfolioId: string): CustomerTransaction[] {
  const calloffIds = new Set(
    [...database.calloffs.values()]
      .filter((calloff) => calloff.portfolio_id === portfolioId)
      .map((calloff) => calloff.calloff_id),
  );

  return getSortedTransactions(database).filter((transaction) => calloffIds.has(transaction.calloff_id));
}

export function getTransactionsByProduct(database: PrototypeDatabase, productId: string): CustomerTransaction[] {
  const calloffIds = new Set(
    [...database.calloffs.values()]
      .filter((calloff) => calloff.product_id === productId)
      .map((calloff) => calloff.calloff_id),
  );

  return getSortedTransactions(database).filter((transaction) => calloffIds.has(transaction.calloff_id));
}

function assertUniqueKey<T>(map: Map<string, T>, key: string, fieldName: string): void {
  assertRequiredString(key, fieldName);
  if (map.has(key)) {
    throw new DatabaseError("duplicate_key", `${fieldName} ${key} already exists`);
  }
}

function getSortedTransactions(database: PrototypeDatabase): CustomerTransaction[] {
  return [...database.transactions.values()].sort((left, right) => {
    const monthOrder = left.month.localeCompare(right.month);
    if (monthOrder !== 0) {
      return monthOrder;
    }

    return left.transaction_id.localeCompare(right.transaction_id);
  });
}

function forecastKey(portfolioId: string, month: string): string {
  return `${portfolioId}|${month}`;
}

function qFactorSetMonthKey(qFactorSetId: string, month: string): string {
  return `${qFactorSetId}|${month}`;
}

function calendarExists(database: PrototypeDatabase, calendarId: string): boolean {
  return Boolean(findCalendar(database, calendarId));
}

function findCalendar(database: PrototypeDatabase, calendarId: string): Calendar | undefined {
  const exact = database.calendars.get(calendarId);
  if (exact) {
    return exact;
  }

  return [...database.calendars.values()]
    .filter((calendar) => calendar.calendar_id.startsWith(`${calendarId}:`))
    .sort((left, right) => left.month.localeCompare(right.month))[0];
}
