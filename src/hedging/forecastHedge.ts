import type { PrototypeDatabase } from "../database/schema.ts";
import {
  DatabaseError,
  type Calloff,
  type CustomerTransaction,
  type ProductConfiguration,
  type ProductConfigurationComponent,
} from "../database/types.ts";
import { getPortfolioProductComponents, getQFactorValuesBySet, insertCalloff, insertTransaction } from "../database/repository.ts";
import { isPeaksModernPortfolio } from "./applicationConfig.ts";

const PEAKS_MODERN_PRODUCT_NAME = "PeaksModern";
const BASE_COMPONENTS = ["base.sys", "base.epad"];

export class ForecastHedgeError extends Error {
  readonly code: "invalid_input" | "not_found";

  constructor(code: "invalid_input" | "not_found", message: string) {
    super(message);
    this.code = code;
    this.name = "ForecastHedgeError";
  }
}

export type ForecastHedgeProfileInput = {
  portfolio_id: string;
  start_month: string | undefined;
  end_month: string | undefined;
  percentage: string | number | undefined;
};

export type ForecastHedgeProfileRowInput = {
  month: string;
  hedge_mwh: string | number | undefined;
};

export type ForecastHedgeAcceptInput = ForecastHedgeProfileInput & {
  rows: ForecastHedgeProfileRowInput[];
  date?: string;
  calloff_id?: string;
};

export type ForecastHedgeProfileRow = {
  month: string;
  forecast_mwh: number;
  percentage: number;
  hedge_mwh: number;
  hedge_mw: number;
  calendar_total_h: number;
};

export type ForecastHedgeProfile = {
  portfolio_id: string;
  start_month: string;
  end_month: string;
  percentage: number;
  rows: ForecastHedgeProfileRow[];
};

export type ForecastHedgeAcceptResult = {
  calloff: Calloff;
  transactions: CustomerTransaction[];
  profile: ForecastHedgeProfile;
};

type NormalizedInput = {
  portfolio_id: string;
  start_month: string;
  end_month: string;
  percentage: number;
};

export function getForecastHedgeMonthRange(startMonth: string, endMonth: string): string[] {
  assertMonth(startMonth, "start_month");
  assertMonth(endMonth, "end_month");
  if (endMonth < startMonth) {
    throw new ForecastHedgeError("invalid_input", "end_month must be greater than or equal to start_month");
  }

  const months: string[] = [];
  let [year, month] = startMonth.split("-").map(Number);
  const end = Number(endMonth.replace("-", ""));

  while (year * 100 + month <= end) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

export function buildForecastHedgeProfile(
  database: PrototypeDatabase,
  input: ForecastHedgeProfileInput,
): ForecastHedgeProfile {
  const normalized = validateProfileInput(database, input);
  const months = getForecastHedgeMonthRange(normalized.start_month, normalized.end_month);

  return {
    ...normalized,
    rows: months.map((month) => {
      const forecast = getForecast(database, normalized.portfolio_id, month);
      const calendar = getCalendar(database, month);
      return updateForecastHedgeProfileRow({
        month,
        forecast_mwh: forecast.mwh,
        calendar_total_h: calendar.total_h,
        hedge_mwh: forecast.mwh * normalized.percentage,
      });
    }),
  };
}

export function updateForecastHedgeProfileRow(input: {
  month: string;
  forecast_mwh: number;
  calendar_total_h: number;
  hedge_mwh: string | number | undefined;
}): ForecastHedgeProfileRow {
  const hedgeMwh = parseRequiredNumber(input.hedge_mwh, "Hedge MWh");
  if (hedgeMwh < 0) {
    throw new ForecastHedgeError("invalid_input", "Hedge MWh must be greater than or equal to 0");
  }
  if (input.forecast_mwh < 0) {
    throw new ForecastHedgeError("invalid_input", "forecast_mwh must be greater than or equal to 0");
  }
  if (input.calendar_total_h <= 0) {
    throw new ForecastHedgeError("invalid_input", "calendar total_h must be greater than zero");
  }

  return {
    month: input.month,
    forecast_mwh: input.forecast_mwh,
    calendar_total_h: input.calendar_total_h,
    hedge_mwh: roundMwh(hedgeMwh),
    hedge_mw: roundMw(hedgeMwh / input.calendar_total_h),
    percentage: input.forecast_mwh === 0 ? 0 : roundDecimal(hedgeMwh / input.forecast_mwh),
  };
}

export function acceptForecastHedgeProfile(
  database: PrototypeDatabase,
  input: ForecastHedgeAcceptInput,
): ForecastHedgeAcceptResult {
  const normalized = validateProfileInput(database, input);
  const months = getForecastHedgeMonthRange(normalized.start_month, normalized.end_month);
  if (input.rows.length !== months.length) {
    throw new ForecastHedgeError("invalid_input", "profile rows must match selected month range");
  }

  const rowsByMonth = new Map(input.rows.map((row) => [row.month, row]));
  const profile: ForecastHedgeProfile = {
    ...normalized,
    rows: months.map((month) => {
      const postedRow = rowsByMonth.get(month);
      if (!postedRow) {
        throw new ForecastHedgeError("invalid_input", `missing profile row for ${month}`);
      }
      const forecast = getForecast(database, normalized.portfolio_id, month);
      const calendar = getCalendar(database, month);
      return updateForecastHedgeProfileRow({
        month,
        forecast_mwh: forecast.mwh,
        calendar_total_h: calendar.total_h,
        hedge_mwh: postedRow.hedge_mwh,
      });
    }),
  };

  const calloff = createForecastHedgeCalloff(database, {
    portfolio_id: normalized.portfolio_id,
    date: input.date ?? currentIsoDate(),
    calloff_id: input.calloff_id,
  });
  const transactions = createForecastHedgeTransactions(database, { calloff, rows: profile.rows });

  return { calloff, transactions, profile };
}

export function createForecastHedgeCalloff(
  database: PrototypeDatabase,
  input: { portfolio_id: string; date: string; calloff_id?: string },
): Calloff {
  if (!isPeaksModernPortfolio(database, input.portfolio_id)) {
    throw new ForecastHedgeError("invalid_input", "Hedge Forecast is only available for PeaksModern portfolios");
  }

  const product = getPeaksModernProduct(database);
  return wrapDatabaseError(() =>
    insertCalloff(database, {
      calloff_id: input.calloff_id ?? nextCalloffId(database),
      product_id: product.product_id,
      portfolio_id: input.portfolio_id,
      date: input.date,
    }),
  );
}

export function createForecastHedgeTransactions(
  database: PrototypeDatabase,
  input: { calloff: Calloff; rows: ForecastHedgeProfileRow[] },
): CustomerTransaction[] {
  const components = getBaseComponents(database, input.calloff.product_id);
  const transactions: CustomerTransaction[] = [];

  for (const row of input.rows) {
    for (const component of components) {
      const qFactor = getQFactorForComponentMonth(database, input.calloff.portfolio_id, component, row.month);
      transactions.push(
        wrapDatabaseError(() =>
          insertTransaction(database, {
            transaction_id: nextTransactionId(database, input.calloff.calloff_id, row.month, component.component),
            calloff_id: input.calloff.calloff_id,
            month: row.month,
            productcomponent_id: component.productcomponent_id,
            mw: row.hedge_mw,
            q_factor: qFactor,
          }),
        ),
      );
    }
  }

  return transactions;
}

function validateProfileInput(database: PrototypeDatabase, input: ForecastHedgeProfileInput): NormalizedInput {
  const portfolioId = String(input.portfolio_id ?? "").trim();
  if (!portfolioId) {
    throw new ForecastHedgeError("invalid_input", "portfolio_id is required");
  }
  if (!isPeaksModernPortfolio(database, portfolioId)) {
    throw new ForecastHedgeError("invalid_input", "Hedge Forecast is only available for PeaksModern portfolios");
  }

  const startMonth = String(input.start_month ?? "").trim();
  const endMonth = String(input.end_month ?? "").trim();
  getForecastHedgeMonthRange(startMonth, endMonth);

  const percentagePercent = parseRequiredNumber(input.percentage, "percentage");
  if (percentagePercent < 0 || percentagePercent > 100) {
    throw new ForecastHedgeError("invalid_input", "percentage must be between 0 and 100");
  }

  return {
    portfolio_id: portfolioId,
    start_month: startMonth,
    end_month: endMonth,
    percentage: roundDecimal(percentagePercent / 100),
  };
}

function getForecast(database: PrototypeDatabase, portfolioId: string, month: string) {
  const forecast = [...database.forecasts.values()].find(
    (candidate) => candidate.portfolio_id === portfolioId && candidate.month === month,
  );
  if (!forecast) {
    throw new ForecastHedgeError("not_found", `missing forecast row for ${portfolioId} ${month}`);
  }
  return forecast;
}

function getCalendar(database: PrototypeDatabase, month: string) {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    throw new ForecastHedgeError("not_found", `missing calendar row for ${month}`);
  }
  return calendar;
}

function getPeaksModernProduct(database: PrototypeDatabase): ProductConfiguration {
  const product = [...database.productConfigurations.values()].find((candidate) => candidate.name === PEAKS_MODERN_PRODUCT_NAME);
  if (!product) {
    throw new ForecastHedgeError("not_found", "missing PeaksModern product configuration");
  }
  return product;
}

function getBaseComponents(database: PrototypeDatabase, productId: string): ProductConfigurationComponent[] {
  return BASE_COMPONENTS.map((componentCode) => {
    const component = [...database.productConfigurationComponents.values()].find(
      (candidate) => candidate.product_id === productId && candidate.component === componentCode,
    );
    if (!component) {
      throw new ForecastHedgeError("not_found", `missing ${componentCode} product component`);
    }
    return component;
  });
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
    throw new ForecastHedgeError("not_found", `missing portfolio product component for ${component.component}`);
  }

  const qFactorSet = database.qFactorSets.get(portfolioComponent.qfactor_set_id);
  if (!qFactorSet || qFactorSet.component !== component.component) {
    throw new ForecastHedgeError("not_found", `missing Q-factor set for ${component.component}`);
  }

  const value = getQFactorValuesBySet(database, qFactorSet.qfactor_set_id).find((candidate) => candidate.month === month);
  if (!value) {
    throw new ForecastHedgeError("not_found", `missing Q-factor value for ${component.component} ${month}`);
  }

  return value.value;
}

function assertMonth(value: string, label: string): void {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw new ForecastHedgeError("invalid_input", `${label} must use YYYY-MM format`);
  }

  const month = Number(value.slice(5, 7));
  if (month < 1 || month > 12) {
    throw new ForecastHedgeError("invalid_input", `${label} must use YYYY-MM format`);
  }
}

function parseRequiredNumber(value: string | number | undefined, label: string): number {
  if (value === undefined || value === "") {
    throw new ForecastHedgeError("invalid_input", `${label} is required`);
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ForecastHedgeError("invalid_input", `${label} must be numeric`);
  }
  return parsed;
}

function nextCalloffId(database: PrototypeDatabase): string {
  return `CALLOFF_FORECAST_HEDGE_${String(database.calloffs.size + 1).padStart(4, "0")}`;
}

function nextTransactionId(database: PrototypeDatabase, calloffId: string, month: string, component: string): string {
  const sequence = String(database.transactions.size + 1).padStart(5, "0");
  return `TX_${calloffId}_${month}_${component.replaceAll(".", "_")}_${sequence}`;
}

function currentIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function roundMwh(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

function roundMw(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function roundDecimal(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function wrapDatabaseError<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw new ForecastHedgeError(error.code === "not_found" ? "not_found" : "invalid_input", error.message);
    }
    throw error;
  }
}
