import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerForecast } from "../database/types.ts";
import { isPeaksModernPortfolio } from "./applicationConfig.ts";
import { convertModernForecastToStored, deriveModernFromForecast, ModernProjectionError } from "./modernProjection.ts";

export class ForecastFeatureError extends Error {
  readonly code: "invalid_input" | "not_found";

  constructor(code: "invalid_input" | "not_found", message: string) {
    super(message);
    this.code = code;
    this.name = "ForecastFeatureError";
  }
}

export type ForecastDisplayRow = {
  forecast_id: string;
  month: string;
  mwh: number;
  peak_pct: number;
  peak_percent: number;
  modern_base_mwh: number;
  modern_peak_mwh: number;
  peak_level_mwh: number;
};

export type ForecastUpdateInput = {
  portfolio_id: string;
  month: string;
  modern_base_mwh: string | number | undefined;
  modern_peak_mwh: string | number | undefined;
};

export type ForecastRowsUpdateInput = {
  portfolio_id: string;
  rows: ForecastUpdateInput[];
};

export type NormalizedForecastUpdate = {
  portfolio_id: string;
  month: string;
  mwh: number;
  peak_pct: number;
  modern_base_mwh: number;
  modern_peak_mwh: number;
};

export function getForecastYears(database: PrototypeDatabase, portfolioId: string): string[] {
  return [...new Set(getPortfolioForecasts(database, portfolioId).map((forecast) => forecast.month.slice(0, 4)))].sort();
}

export function getForecastRowsForYear(database: PrototypeDatabase, portfolioId: string, year: string): ForecastDisplayRow[] {
  return getPortfolioForecasts(database, portfolioId)
    .filter((forecast) => forecast.month.startsWith(`${year}-`))
    .sort((left, right) => left.month.localeCompare(right.month))
    .map((forecast) => {
      const calendar = getCalendar(database, forecast.month);
      const modern = deriveModernFromForecast({
        total_mwh: forecast.mwh,
        peak_pct: forecast.peak_pct,
        total_h: calendar.total_h,
        peak_h: calendar.peak_h,
      });
      return {
        forecast_id: forecast.forecast_id,
        month: forecast.month,
        mwh: forecast.mwh,
        peak_pct: forecast.peak_pct,
        peak_percent: roundPercent(forecast.peak_pct * 100),
        modern_base_mwh: modern.modern_base_mwh,
        modern_peak_mwh: modern.modern_peak_mwh,
        peak_level_mwh: modern.peak_level_mwh,
      };
    });
}

export function updateForecastRows(database: PrototypeDatabase, input: ForecastRowsUpdateInput): CustomerForecast[] {
  return input.rows.map((row) => updateForecastRow(database, row));
}

export function updateForecastRow(database: PrototypeDatabase, input: ForecastUpdateInput): CustomerForecast {
  const update = validateForecastUpdate(database, input);
  if (!isPeaksModernPortfolio(database, update.portfolio_id)) {
    throw new ForecastFeatureError("invalid_input", "Forecast is only available for Peaks.Modern portfolios");
  }

  const forecast = getPortfolioForecasts(database, update.portfolio_id).find((candidate) => candidate.month === update.month);
  if (!forecast) {
    throw new ForecastFeatureError("not_found", `Forecast row does not exist for ${update.portfolio_id} ${update.month}`);
  }

  forecast.mwh = update.mwh;
  forecast.peak_pct = update.peak_pct;
  return forecast;
}

export function validateForecastUpdate(database: PrototypeDatabase, input: ForecastUpdateInput): NormalizedForecastUpdate {
  const portfolioId = String(input.portfolio_id ?? "").trim();
  if (!portfolioId) {
    throw new ForecastFeatureError("invalid_input", "portfolio_id is required");
  }

  const month = String(input.month ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new ForecastFeatureError("invalid_input", "month must use YYYY-MM format");
  }

  const modernBaseMwh = parseRequiredNumber(input.modern_base_mwh, "Modern Base MWh");
  const modernPeakMwh = parseRequiredNumber(input.modern_peak_mwh, "Modern Peak MWh");
  const calendar = getCalendar(database, month);
  let stored;
  try {
    stored = convertModernForecastToStored({
      modern_base_mwh: modernBaseMwh,
      modern_peak_mwh: modernPeakMwh,
      total_h: calendar.total_h,
      peak_h: calendar.peak_h,
    });
  } catch (error) {
    if (error instanceof ModernProjectionError) {
      throw new ForecastFeatureError("invalid_input", error.message);
    }
    throw error;
  }

  return {
    portfolio_id: portfolioId,
    month,
    mwh: stored.mwh,
    peak_pct: stored.peak_pct,
    modern_base_mwh: roundMwh(modernBaseMwh),
    modern_peak_mwh: roundMwh(modernPeakMwh),
  };
}

function getPortfolioForecasts(database: PrototypeDatabase, portfolioId: string): CustomerForecast[] {
  return [...database.forecasts.values()].filter((forecast) => forecast.portfolio_id === portfolioId);
}

function getCalendar(database: PrototypeDatabase, month: string) {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    throw new ForecastFeatureError("not_found", `missing calendar row for ${month}`);
  }
  return calendar;
}

function parseRequiredNumber(value: string | number | undefined, label: string): number {
  if (value === undefined || value === "") {
    throw new ForecastFeatureError("invalid_input", `${label} is required`);
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ForecastFeatureError("invalid_input", `${label} must be numeric`);
  }
  return parsed;
}

function roundPercent(value: number): number {
  return Math.round(Number(value.toFixed(6)));
}

function roundMwh(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
