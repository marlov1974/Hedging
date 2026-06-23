import type { PrototypeDatabase } from "../database/schema.ts";
import {
  DatabaseError,
  type Calloff,
  type CustomerTransaction,
  type ProductConfiguration,
  type ProductConfigurationComponent,
} from "../database/types.ts";
import { getPortfolioProductComponents, getQFactorValuesBySet, insertCalloff, insertTransaction } from "../database/repository.ts";
import { canonicalProductPackageName } from "../database/canonicalComponents.ts";
import type { PerspectiveId } from "./applicationConfig.ts";
import { ClassicProjectionError, convertClassicHedgeToCanonical, deriveClassicFromForecast } from "./classicProjection.ts";
import { convertModernHedgeToCanonical, deriveModernFromForecast, ModernProjectionError } from "./modernProjection.ts";

const PEAKS_MODERN_PRODUCT_NAME = "Peaks.Modern";
const PEAKS_CLASSIC_PRODUCT_NAME = "Peaks.Classic";
const FORECAST_HEDGE_COMPONENTS = [
  "allocation.peak.sys",
  "allocation.peak.epad",
  "base.sys",
  "base.epad",
  "peak.sys",
  "peak.epad",
];

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
  perspective_id?: PerspectiveId;
};

export type ForecastHedgeProfileRowInput = {
  month: string;
  modern_base_mwh?: string | number | undefined;
  modern_peak_mwh?: string | number | undefined;
  classic_offpeak_mwh?: string | number | undefined;
  classic_peak_mwh?: string | number | undefined;
};

export type ForecastHedgeAcceptInput = ForecastHedgeProfileInput & {
  rows: ForecastHedgeProfileRowInput[];
  date?: string;
  calloff_id?: string;
};

export type ForecastHedgeProfileRow = {
  month: string;
  forecast_mwh: number;
  forecast_peak_pct: number;
  forecast_modern_base_mwh: number;
  forecast_modern_peak_mwh: number;
  forecast_classic_offpeak_mwh: number;
  forecast_classic_peak_mwh: number;
  percentage: number;
  modern_base_mwh: number;
  modern_peak_mwh: number;
  modern_base_mw: number;
  modern_peak_mw: number;
  classic_offpeak_mwh: number;
  classic_peak_mwh: number;
  classic_offpeak_mw: number;
  classic_peak_mw: number;
  allocation_peak_mw: number;
  canonical_base_mw: number;
  canonical_peak_mw: number;
  total_mwh: number;
  peak_level_mwh: number;
  calendar_total_h: number;
  calendar_peak_h: number;
};

export type ForecastHedgeProfile = {
  portfolio_id: string;
  start_month: string;
  end_month: string;
  percentage: number;
  perspective_id: PerspectiveId;
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
  perspective_id: PerspectiveId;
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
      const modernForecast = deriveModernFromForecast({
        total_mwh: forecast.mwh,
        peak_pct: forecast.peak_pct,
        total_h: calendar.total_h,
        peak_h: calendar.peak_h,
      });
      const classicForecast = deriveClassicFromForecast({
        total_mwh: forecast.mwh,
        peak_pct: forecast.peak_pct,
        total_h: calendar.total_h,
        peak_h: calendar.peak_h,
      });
      return updateForecastHedgeProfileRow({
        month,
        perspective_id: normalized.perspective_id,
        forecast_mwh: forecast.mwh,
        forecast_peak_pct: forecast.peak_pct,
        forecast_modern_base_mwh: modernForecast.modern_base_mwh,
        forecast_modern_peak_mwh: modernForecast.modern_peak_mwh,
        forecast_classic_offpeak_mwh: classicForecast.classic_offpeak_mwh,
        forecast_classic_peak_mwh: classicForecast.classic_peak_mwh,
        calendar_total_h: calendar.total_h,
        calendar_peak_h: calendar.peak_h,
        modern_base_mwh:
          normalized.perspective_id === "classic" ? undefined : modernForecast.modern_base_mwh * normalized.percentage,
        modern_peak_mwh:
          normalized.perspective_id === "classic" ? undefined : modernForecast.modern_peak_mwh * normalized.percentage,
        classic_offpeak_mwh:
          normalized.perspective_id === "classic" ? classicForecast.classic_offpeak_mwh * normalized.percentage : undefined,
        classic_peak_mwh:
          normalized.perspective_id === "classic" ? classicForecast.classic_peak_mwh * normalized.percentage : undefined,
      });
    }),
  };
}

export function updateForecastHedgeProfileRow(input: {
  month: string;
  perspective_id?: PerspectiveId;
  forecast_mwh: number;
  forecast_peak_pct: number;
  forecast_modern_base_mwh: number;
  forecast_modern_peak_mwh: number;
  forecast_classic_offpeak_mwh?: number;
  forecast_classic_peak_mwh?: number;
  calendar_total_h: number;
  calendar_peak_h: number;
  modern_base_mwh?: string | number | undefined;
  modern_peak_mwh?: string | number | undefined;
  classic_offpeak_mwh?: string | number | undefined;
  classic_peak_mwh?: string | number | undefined;
}): ForecastHedgeProfileRow {
  if (input.forecast_mwh < 0) {
    throw new ForecastHedgeError("invalid_input", "forecast_mwh must be greater than or equal to 0");
  }
  if (input.calendar_total_h <= 0) {
    throw new ForecastHedgeError("invalid_input", "calendar total_h must be greater than zero");
  }
  if (input.calendar_peak_h <= 0) {
    throw new ForecastHedgeError("invalid_input", "calendar peak_h must be greater than zero");
  }
  if (input.calendar_total_h - input.calendar_peak_h <= 0) {
    throw new ForecastHedgeError("invalid_input", "calendar offpeak_h must be greater than zero");
  }
  if (input.forecast_peak_pct < 0) {
    throw new ForecastHedgeError("invalid_input", "forecast_peak_pct must be greater than or equal to 0");
  }

  const isClassic = input.perspective_id === "classic" || input.classic_offpeak_mwh !== undefined || input.classic_peak_mwh !== undefined;
  let canonical: {
    modern_base_mwh: number;
    modern_peak_mwh: number;
    modern_base_mw: number;
    modern_peak_mw: number;
    classic_offpeak_mwh: number;
    classic_peak_mwh: number;
    classic_offpeak_mw: number;
    classic_peak_mw: number;
    allocation_peak_mw: number;
    canonical_base_mw: number;
    canonical_peak_mw: number;
    total_mwh: number;
    peak_level_mwh: number;
  };

  if (isClassic) {
    const classicOffpeakMwh = parseRequiredNumber(input.classic_offpeak_mwh, "Offpeak MWh");
    const classicPeakMwh = parseRequiredNumber(input.classic_peak_mwh, "Peak MWh");
    try {
      const classic = convertClassicHedgeToCanonical({
        classic_offpeak_mwh: classicOffpeakMwh,
        classic_peak_mwh: classicPeakMwh,
        total_h: input.calendar_total_h,
        peak_h: input.calendar_peak_h,
      });
      canonical = {
        modern_base_mwh: 0,
        modern_peak_mwh: 0,
        modern_base_mw: 0,
        modern_peak_mw: 0,
        classic_offpeak_mwh: classic.classic_offpeak_mwh,
        classic_peak_mwh: classic.classic_peak_mwh,
        classic_offpeak_mw: classic.classic_offpeak_mw,
        classic_peak_mw: classic.classic_peak_mw,
        allocation_peak_mw: classic.allocation_peak_mw,
        canonical_base_mw: classic.canonical_base_mw,
        canonical_peak_mw: classic.canonical_peak_mw,
        total_mwh: classic.total_mwh,
        peak_level_mwh: classic.classic_peak_mwh,
      };
    } catch (error) {
      if (error instanceof ClassicProjectionError) {
        throw new ForecastHedgeError("invalid_input", error.message);
      }
      throw error;
    }
  } else {
    const modernBaseMwh = parseRequiredNumber(input.modern_base_mwh, "Modern Base MWh");
    const modernPeakMwh = parseRequiredNumber(input.modern_peak_mwh, "Modern Peak MWh");
    try {
      const modern = convertModernHedgeToCanonical({
        modern_base_mwh: modernBaseMwh,
        modern_peak_mwh: modernPeakMwh,
        total_h: input.calendar_total_h,
        peak_h: input.calendar_peak_h,
      });
      const classic = deriveClassicFromForecast({
        total_mwh: modern.total_mwh,
        peak_pct: modern.total_mwh === 0 ? 0 : modern.peak_level_mwh / modern.total_mwh,
        total_h: input.calendar_total_h,
        peak_h: input.calendar_peak_h,
      });
      canonical = {
        modern_base_mwh: modern.modern_base_mwh,
        modern_peak_mwh: modern.modern_peak_mwh,
        modern_base_mw: modern.modern_base_mw,
        modern_peak_mw: modern.modern_peak_mw,
        classic_offpeak_mwh: classic.classic_offpeak_mwh,
        classic_peak_mwh: classic.classic_peak_mwh,
        classic_offpeak_mw: classic.classic_offpeak_mw,
        classic_peak_mw: classic.classic_peak_mw,
        allocation_peak_mw: modern.allocation_peak_mw,
        canonical_base_mw: modern.canonical_base_mw,
        canonical_peak_mw: modern.canonical_peak_mw,
        total_mwh: modern.total_mwh,
        peak_level_mwh: modern.peak_level_mwh,
      };
    } catch (error) {
      if (error instanceof ModernProjectionError || error instanceof ClassicProjectionError) {
        throw new ForecastHedgeError("invalid_input", error.message);
      }
      throw error;
    }
  }

  return {
    month: input.month,
    forecast_mwh: input.forecast_mwh,
    forecast_peak_pct: input.forecast_peak_pct,
    forecast_modern_base_mwh: roundMwh(input.forecast_modern_base_mwh),
    forecast_modern_peak_mwh: roundMwh(input.forecast_modern_peak_mwh),
    forecast_classic_offpeak_mwh: roundMwh(input.forecast_classic_offpeak_mwh ?? input.forecast_mwh * (1 - input.forecast_peak_pct)),
    forecast_classic_peak_mwh: roundMwh(input.forecast_classic_peak_mwh ?? input.forecast_mwh * input.forecast_peak_pct),
    calendar_total_h: input.calendar_total_h,
    calendar_peak_h: input.calendar_peak_h,
    modern_base_mwh: canonical.modern_base_mwh,
    modern_peak_mwh: canonical.modern_peak_mwh,
    modern_base_mw: canonical.modern_base_mw,
    modern_peak_mw: canonical.modern_peak_mw,
    classic_offpeak_mwh: canonical.classic_offpeak_mwh,
    classic_peak_mwh: canonical.classic_peak_mwh,
    classic_offpeak_mw: canonical.classic_offpeak_mw,
    classic_peak_mw: canonical.classic_peak_mw,
    allocation_peak_mw: canonical.allocation_peak_mw,
    canonical_base_mw: canonical.canonical_base_mw,
    canonical_peak_mw: canonical.canonical_peak_mw,
    total_mwh: canonical.total_mwh,
    peak_level_mwh: canonical.peak_level_mwh,
    percentage: input.forecast_mwh === 0 ? 0 : roundDecimal(canonical.total_mwh / input.forecast_mwh),
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
      const modernForecast = deriveModernFromForecast({
        total_mwh: forecast.mwh,
        peak_pct: forecast.peak_pct,
        total_h: calendar.total_h,
        peak_h: calendar.peak_h,
      });
      const classicForecast = deriveClassicFromForecast({
        total_mwh: forecast.mwh,
        peak_pct: forecast.peak_pct,
        total_h: calendar.total_h,
        peak_h: calendar.peak_h,
      });
      return updateForecastHedgeProfileRow({
        month,
        perspective_id: normalized.perspective_id,
        forecast_mwh: forecast.mwh,
        forecast_peak_pct: forecast.peak_pct,
        forecast_modern_base_mwh: modernForecast.modern_base_mwh,
        forecast_modern_peak_mwh: modernForecast.modern_peak_mwh,
        forecast_classic_offpeak_mwh: classicForecast.classic_offpeak_mwh,
        forecast_classic_peak_mwh: classicForecast.classic_peak_mwh,
        calendar_total_h: calendar.total_h,
        calendar_peak_h: calendar.peak_h,
        modern_base_mwh: postedRow.modern_base_mwh,
        modern_peak_mwh: postedRow.modern_peak_mwh,
        classic_offpeak_mwh: postedRow.classic_offpeak_mwh,
        classic_peak_mwh: postedRow.classic_peak_mwh,
      });
    }),
  };

  const calloff = createForecastHedgeCalloff(database, {
    portfolio_id: normalized.portfolio_id,
    perspective_id: normalized.perspective_id,
    date: input.date ?? currentIsoDate(),
    delivery_start_month: normalized.start_month,
    delivery_end_month: normalized.end_month,
    calloff_id: input.calloff_id,
  });
  const transactions = createForecastHedgeTransactions(database, { calloff, rows: profile.rows });

  return { calloff, transactions, profile };
}

export function createForecastHedgeCalloff(
  database: PrototypeDatabase,
  input: {
    portfolio_id: string;
    perspective_id?: PerspectiveId;
    date: string;
    delivery_start_month: string;
    delivery_end_month: string;
    calloff_id?: string;
  },
): Calloff {
  const product = getForecastHedgeProduct(database, input.perspective_id);
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

export function createForecastHedgeTransactions(
  database: PrototypeDatabase,
  input: { calloff: Calloff; rows: ForecastHedgeProfileRow[] },
): CustomerTransaction[] {
  const components = getForecastHedgeComponents(database, input.calloff.product_id);
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
            mw: transactionMwForComponent(row, component.component),
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
  if (!database.portfolios.has(portfolioId)) {
    throw new ForecastHedgeError("not_found", `portfolio_id ${portfolioId} does not exist`);
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
    perspective_id: input.perspective_id === "classic" ? "classic" : "modern",
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

function getForecastHedgeProduct(database: PrototypeDatabase, perspectiveId: PerspectiveId | undefined): ProductConfiguration {
  const productName = perspectiveId === "classic" ? PEAKS_CLASSIC_PRODUCT_NAME : PEAKS_MODERN_PRODUCT_NAME;
  const product = [...database.productConfigurations.values()].find(
    (candidate) => canonicalProductPackageName(candidate.name) === productName,
  );
  if (!product) {
    throw new ForecastHedgeError("not_found", `missing ${productName} product configuration`);
  }
  return product;
}

function getForecastHedgeComponents(database: PrototypeDatabase, productId: string): ProductConfigurationComponent[] {
  return FORECAST_HEDGE_COMPONENTS.map((componentCode) => {
    const component = [...database.productConfigurationComponents.values()].find(
      (candidate) => candidate.product_id === productId && candidate.component === componentCode,
    );
    if (!component) {
      throw new ForecastHedgeError("not_found", `missing ${componentCode} product component`);
    }
    return component;
  });
}

function transactionMwForComponent(row: ForecastHedgeProfileRow, componentCode: string): number {
  if (componentCode === "allocation.peak" || componentCode === "allocation.peak.sys" || componentCode === "allocation.peak.epad") {
    return row.allocation_peak_mw;
  }
  if (
    componentCode === "peak.sys" ||
    componentCode === "peak.epad" ||
    componentCode === "peak.premium.sys" ||
    componentCode === "peak.premium.epad" ||
    componentCode === "peak.modern.sys" ||
    componentCode === "peak.modern.epad"
  ) {
    return row.canonical_peak_mw;
  }
  return row.canonical_base_mw;
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
  const qFactorSet = portfolioComponent
    ? database.qFactorSets.get(portfolioComponent.qfactor_set_id)
    : [...database.qFactorSets.values()].find((candidate) => candidate.component === component.component);
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
  return `CAL${String(database.calloffs.size).padStart(2, "0")}`;
}

function nextTransactionId(database: PrototypeDatabase, calloffId: string, _month: string, _component: string): string {
  const calloffTransactionCount = [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloffId).length;
  return `${calloffId}-${String(calloffTransactionCount).padStart(3, "0")}`;
}

function currentIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function roundMwh(value: number): number {
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
