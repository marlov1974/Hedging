import type { PrototypeDatabase } from "../database/schema.ts";
import {
  DatabaseError,
  type Calloff,
  type CustomerTransaction,
  type ProductConfiguration,
  type ProductConfigurationComponent,
} from "../database/types.ts";
import { getPortfolioProductComponents, getQFactorValuesBySet, insertCalloff, insertTransaction } from "../database/repository.ts";
import { getCanonicalForecastForPriceArea, SUPPORTED_PRICE_AREAS, type SupportedPriceArea } from "../database/eventForecasts.ts";
import { resolveConfiguredComponentPrice } from "../hedging/componentPricing.ts";
import { expandPeriodMonths, findPurchasePeriod, type PurchasePeriodOption } from "./periodOptions.ts";

const BASELOADS_PRODUCT_NAME = "Baseloads";
const BASELOADS_PORTFOLIO_ID = "CUS00-0";
const BASELOADS_COMPONENTS = ["base.sys", "base.epad"];

export type BaseloadsPurchaseInput = {
  portfolio_id: string;
  mw: number;
  period_id: string;
  date?: string;
  calloff_id?: string;
};

export type BaseloadsPurchaseResult = {
  calloff: Calloff;
  transactions: CustomerTransaction[];
  period: PurchasePeriodOption;
};

export type BaseloadsRebalanceInput = {
  portfolio_id: string;
  period_id: string;
  price_area?: string;
  target_percentage_of_forecast?: string | number;
  date?: string;
  calloff_id?: string;
};

export type BaseloadsRebalanceRow = {
  month: string;
  target_base_mwh: number;
  current_base_mwh: number;
  rebalance_delta_mwh: number;
  derivative_name: string;
};

export type BaseloadsRebalanceResult = {
  calloff: Calloff | null;
  transactions: CustomerTransaction[];
  period: PurchasePeriodOption;
  price_area: SupportedPriceArea;
  target_percentage: number;
  rows: BaseloadsRebalanceRow[];
};

export class PurchaseError extends Error {
  readonly code: "invalid_input" | "not_found";

  constructor(code: "invalid_input" | "not_found", message: string) {
    super(message);
    this.code = code;
    this.name = "PurchaseError";
  }
}

export function purchaseBaseloads(database: PrototypeDatabase, input: BaseloadsPurchaseInput): BaseloadsPurchaseResult {
  const period = validatePurchaseInput(input);
  const calloff = createBaseloadsCalloff(database, {
    portfolio_id: input.portfolio_id,
    date: input.date ?? currentIsoDate(),
    delivery_start_month: period.start_month,
    delivery_end_month: period.end_month,
    calloff_id: input.calloff_id,
  });
  const transactions = createBaseloadsTransactions(database, {
    calloff,
    period,
    mw: input.mw,
  });

  return { calloff, transactions, period };
}

export function rebalanceBaseloadsToForecast(
  database: PrototypeDatabase,
  input: BaseloadsRebalanceInput,
): BaseloadsRebalanceResult {
  const period = validateRebalanceInput(database, input);
  const priceArea = normalizePriceArea(input.price_area);
  const targetPercentage = parseTargetPercentage(input.target_percentage_of_forecast);
  const rows = buildBaseloadsRebalanceRows(database, {
    portfolio_id: input.portfolio_id,
    period,
    price_area: priceArea,
    target_percentage: targetPercentage,
  });
  const activeRows = rows.filter((row) => Math.abs(row.rebalance_delta_mwh) > 0.000001);
  if (activeRows.length === 0) {
    return {
      calloff: null,
      transactions: [],
      period,
      price_area: priceArea,
      target_percentage: targetPercentage,
      rows,
    };
  }

  const calloff = createBaseloadsCalloff(database, {
    portfolio_id: input.portfolio_id,
    date: input.date ?? currentIsoDate(),
    delivery_start_month: period.start_month,
    delivery_end_month: period.end_month,
    calloff_id: input.calloff_id,
  });
  const transactions = createBaseloadsRebalanceTransactions(database, {
    calloff,
    price_area: priceArea,
    rows: activeRows,
  });

  return {
    calloff,
    transactions,
    period,
    price_area: priceArea,
    target_percentage: targetPercentage,
    rows,
  };
}

export function createBaseloadsCalloff(
  database: PrototypeDatabase,
  input: { portfolio_id: string; date: string; delivery_start_month: string; delivery_end_month: string; calloff_id?: string },
): Calloff {
  const product = getBaseloadsProduct(database);

  if (!input.portfolio_id) {
    throw new PurchaseError("invalid_input", "portfolio is required");
  }

  if (input.portfolio_id !== BASELOADS_PORTFOLIO_ID) {
    throw new PurchaseError("invalid_input", "portfolio is not linked to the Baseloads purchase flow");
  }

  if (!database.portfolios.has(input.portfolio_id)) {
    throw new PurchaseError("not_found", `portfolio_id ${input.portfolio_id} does not exist`);
  }

  return wrapDatabaseError(() =>
    insertCalloff(database, {
      calloff_id: input.calloff_id ?? nextCalloffId(database),
      product_id: product.product_id,
      portfolio_id: input.portfolio_id,
      date: input.date,
      delivery_start_month: input.delivery_start_month,
      delivery_end_month: input.delivery_end_month,
    }),
  );
}

export function createBaseloadsTransactions(
  database: PrototypeDatabase,
  input: { calloff: Calloff; period: PurchasePeriodOption; mw: number },
): CustomerTransaction[] {
  const components = getBaseloadsComponents(database, input.calloff.product_id);
  const months = expandPeriodMonths(input.period);
  const transactions: CustomerTransaction[] = [];

  for (const month of months) {
    for (const component of components) {
      const qFactor = getQFactorForComponentMonth(database, input.calloff.portfolio_id, component, month);
      const transaction = wrapDatabaseError(() =>
        insertTransaction(database, {
          transaction_id: nextTransactionId(database, input.calloff.calloff_id, month, component.component),
          calloff_id: input.calloff.calloff_id,
          month,
          productcomponent_id: component.productcomponent_id,
          mw: input.mw,
          q_factor: qFactor,
        }),
      );
      transactions.push(transaction);
    }
  }

  return transactions;
}

export function createBaseloadsRebalanceTransactions(
  database: PrototypeDatabase,
  input: { calloff: Calloff; price_area: SupportedPriceArea; rows: BaseloadsRebalanceRow[] },
): CustomerTransaction[] {
  const components = getBaseloadsComponents(database, input.calloff.product_id);
  const transactions: CustomerTransaction[] = [];

  for (const row of input.rows) {
    const calendar = getCalendar(database, row.month);
    const mw = roundQuantity(row.rebalance_delta_mwh / calendar.total_h);
    for (const component of components) {
      const qFactor = getQFactorForComponentMonth(database, input.calloff.portfolio_id, component, row.month);
      const transaction = wrapDatabaseError(() =>
        insertTransaction(database, {
          transaction_id: nextTransactionId(database, input.calloff.calloff_id, row.month, component.component),
          calloff_id: input.calloff.calloff_id,
          month: row.month,
          productcomponent_id: component.productcomponent_id,
          synthetic_derivative_name: row.derivative_name,
          price_area: input.price_area,
          mw,
          q_factor: qFactor,
          quantity: mw,
          quantity_type: "MW",
          price: resolveConfiguredComponentPrice(database, component, qFactor),
          price_type: "EUR_PER_MWH",
          factor: qFactor,
          factor_type: "Q_FACTOR",
        }),
      );
      transactions.push(transaction);
    }
  }

  return transactions;
}

export function getBaseloadsPortfolioOptions(database: PrototypeDatabase): Array<{ portfolio_id: string; label: string }> {
  const portfolio = database.portfolios.get(BASELOADS_PORTFOLIO_ID);
  if (!portfolio) {
    return [];
  }

  return [{ portfolio_id: portfolio.portfolio_id, label: portfolio.name }];
}

function validatePurchaseInput(input: BaseloadsPurchaseInput): PurchasePeriodOption {
  if (!input.portfolio_id) {
    throw new PurchaseError("invalid_input", "portfolio is required");
  }

  if (typeof input.mw !== "number" || !Number.isFinite(input.mw)) {
    throw new PurchaseError("invalid_input", "MW must be numeric");
  }

  if (input.mw <= 0) {
    throw new PurchaseError("invalid_input", "MW must be greater than zero");
  }

  if (!input.period_id) {
    throw new PurchaseError("invalid_input", "period is required");
  }

  const period = findPurchasePeriod(input.period_id);
  if (!period) {
    throw new PurchaseError("invalid_input", `unknown period option ${input.period_id}`);
  }

  return period;
}

function validateRebalanceInput(database: PrototypeDatabase, input: BaseloadsRebalanceInput): PurchasePeriodOption {
  if (!input.portfolio_id) {
    throw new PurchaseError("invalid_input", "portfolio is required");
  }

  if (input.portfolio_id !== BASELOADS_PORTFOLIO_ID) {
    throw new PurchaseError("invalid_input", "portfolio is not linked to the Baseloads rebalance flow");
  }

  if (!database.portfolios.has(input.portfolio_id)) {
    throw new PurchaseError("not_found", `portfolio_id ${input.portfolio_id} does not exist`);
  }

  if (!input.period_id) {
    throw new PurchaseError("invalid_input", "period is required");
  }

  const period = findPurchasePeriod(input.period_id);
  if (!period) {
    throw new PurchaseError("invalid_input", `unknown period option ${input.period_id}`);
  }

  normalizePriceArea(input.price_area);
  parseTargetPercentage(input.target_percentage_of_forecast);
  return period;
}

function buildBaseloadsRebalanceRows(
  database: PrototypeDatabase,
  input: {
    portfolio_id: string;
    period: PurchasePeriodOption;
    price_area: SupportedPriceArea;
    target_percentage: number;
  },
): BaseloadsRebalanceRow[] {
  return expandPeriodMonths(input.period).map((month) => {
    const forecast = getCanonicalForecastForPriceArea(database, input.portfolio_id, month, input.price_area);
    if (!forecast) {
      throw new PurchaseError("not_found", `missing forecast row for ${input.portfolio_id} ${month} ${input.price_area}`);
    }
    const targetBaseMwh = forecast.mwh * input.target_percentage;
    const currentBaseMwh = getCurrentBaseSysMwh(database, input.portfolio_id, month);
    const deltaMwh = targetBaseMwh - currentBaseMwh;
    return {
      month,
      target_base_mwh: roundQuantity(targetBaseMwh),
      current_base_mwh: roundQuantity(currentBaseMwh),
      rebalance_delta_mwh: roundQuantity(deltaMwh),
      derivative_name: formatBaseloadsRebalanceDerivativeName(month, input.price_area),
    };
  });
}

function getCurrentBaseSysMwh(database: PrototypeDatabase, portfolioId: string, month: string): number {
  const calloffIds = new Set(
    [...database.calloffs.values()].filter((calloff) => calloff.portfolio_id === portfolioId).map((calloff) => calloff.calloff_id),
  );
  return [...database.transactions.values()]
    .filter((transaction) => transaction.month === month && calloffIds.has(transaction.calloff_id))
    .reduce((sum, transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
      if (component?.component !== "base.sys") {
        return sum;
      }
      return sum + transactionMw(transaction) * getCalendar(database, month).total_h;
    }, 0);
}

function normalizePriceArea(value: string | undefined): SupportedPriceArea {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!SUPPORTED_PRICE_AREAS.includes(normalized as SupportedPriceArea)) {
    throw new PurchaseError("invalid_input", "price_area must be STO, MAL, LUL or SUN");
  }
  return normalized as SupportedPriceArea;
}

function parseTargetPercentage(value: string | number | undefined): number {
  if (value === undefined || value === "") {
    throw new PurchaseError("invalid_input", "target_percentage_of_forecast is required");
  }
  const percentage = Number(value);
  if (!Number.isFinite(percentage)) {
    throw new PurchaseError("invalid_input", "target_percentage_of_forecast must be numeric");
  }
  if (percentage < 0 || percentage > 100) {
    throw new PurchaseError("invalid_input", "target_percentage_of_forecast must be between 0 and 100");
  }
  return roundQuantity(percentage / 100);
}

function getBaseloadsProduct(database: PrototypeDatabase): ProductConfiguration {
  const product = [...database.productConfigurations.values()].find((candidate) => candidate.name === BASELOADS_PRODUCT_NAME);
  if (!product) {
    throw new PurchaseError("not_found", "missing Baseloads product configuration");
  }

  return product;
}

function getBaseloadsComponents(database: PrototypeDatabase, productId: string): ProductConfigurationComponent[] {
  const components = BASELOADS_COMPONENTS.map((componentCode) => {
    const component = [...database.productConfigurationComponents.values()].find(
      (candidate) => candidate.product_id === productId && candidate.component === componentCode,
    );
    if (!component) {
      throw new PurchaseError("not_found", `missing ${componentCode} product component`);
    }
    return component;
  });

  return components;
}

function getQFactorForComponentMonth(
  database: PrototypeDatabase,
  portfolioId: string,
  component: ProductConfigurationComponent,
  month: string,
): number {
  const portfolioComponent = getPortfolioProductComponents(database, portfolioId).find(
    (candidate) => candidate.productcomponent_id === component.productcomponent_id,
  );
  if (!portfolioComponent) {
    throw new PurchaseError("not_found", `missing portfolio product component for ${component.component}`);
  }

  const qFactorSet = database.qFactorSets.get(portfolioComponent.qfactor_set_id);
  if (!qFactorSet || qFactorSet.component !== component.component) {
    throw new PurchaseError("not_found", `missing Q-factor set for ${component.component}`);
  }

  const value = getQFactorValuesBySet(database, qFactorSet.qfactor_set_id).find((candidate) => candidate.month === month);
  if (!value) {
    throw new PurchaseError("not_found", `missing Q-factor value for ${component.component} ${month}`);
  }

  return value.value;
}

function getCalendar(database: PrototypeDatabase, month: string) {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    throw new PurchaseError("not_found", `missing calendar row for ${month}`);
  }
  return calendar;
}

function transactionMw(transaction: CustomerTransaction): number {
  return transaction.quantity_type === "MW" && transaction.quantity !== undefined ? transaction.quantity : transaction.mw;
}

function formatBaseloadsRebalanceDerivativeName(month: string, priceArea: SupportedPriceArea): string {
  return `Baseloads Rebalance Month ${month} ${priceArea}`;
}

function roundQuantity(value: number): number {
  return Number(value.toFixed(6));
}

function nextCalloffId(database: PrototypeDatabase): string {
  return `CAL${String(database.calloffs.size).padStart(2, "0")}`;
}

function nextTransactionId(database: PrototypeDatabase, calloffId: string, _month: string, _component: string): string {
  const calloffTransactionCount = [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloffId).length;
  return `${calloffId}-${String(calloffTransactionCount).padStart(3, "0")}`;
}

function currentIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function wrapDatabaseError<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw new PurchaseError(error.code === "not_found" ? "not_found" : "invalid_input", error.message);
    }
    throw error;
  }
}
