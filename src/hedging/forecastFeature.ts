import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerForecast } from "../database/types.ts";
import { isPeaksModernPortfolio } from "./applicationConfig.ts";

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
};

export type ForecastUpdateInput = {
  portfolio_id: string;
  month: string;
  mwh: string | number | undefined;
  peak_percent: string | number | undefined;
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
};

export function getForecastYears(database: PrototypeDatabase, portfolioId: string): string[] {
  return [...new Set(getPortfolioForecasts(database, portfolioId).map((forecast) => forecast.month.slice(0, 4)))].sort();
}

export function getForecastRowsForYear(database: PrototypeDatabase, portfolioId: string, year: string): ForecastDisplayRow[] {
  return getPortfolioForecasts(database, portfolioId)
    .filter((forecast) => forecast.month.startsWith(`${year}-`))
    .sort((left, right) => left.month.localeCompare(right.month))
    .map((forecast) => ({
      forecast_id: forecast.forecast_id,
      month: forecast.month,
      mwh: forecast.mwh,
      peak_pct: forecast.peak_pct,
      peak_percent: roundPercent(forecast.peak_pct * 100),
    }));
}

export function updateForecastRows(database: PrototypeDatabase, input: ForecastRowsUpdateInput): CustomerForecast[] {
  return input.rows.map((row) => updateForecastRow(database, row));
}

export function updateForecastRow(database: PrototypeDatabase, input: ForecastUpdateInput): CustomerForecast {
  const update = validateForecastUpdate(input);
  if (!isPeaksModernPortfolio(database, update.portfolio_id)) {
    throw new ForecastFeatureError("invalid_input", "Forecast is only available for PeaksModern portfolios");
  }

  const forecast = getPortfolioForecasts(database, update.portfolio_id).find((candidate) => candidate.month === update.month);
  if (!forecast) {
    throw new ForecastFeatureError("not_found", `Forecast row does not exist for ${update.portfolio_id} ${update.month}`);
  }

  forecast.mwh = update.mwh;
  forecast.peak_pct = update.peak_pct;
  return forecast;
}

export function validateForecastUpdate(input: ForecastUpdateInput): NormalizedForecastUpdate {
  const portfolioId = String(input.portfolio_id ?? "").trim();
  if (!portfolioId) {
    throw new ForecastFeatureError("invalid_input", "portfolio_id is required");
  }

  const month = String(input.month ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new ForecastFeatureError("invalid_input", "month must use YYYY-MM format");
  }

  const mwh = parseRequiredNumber(input.mwh, "MWh");
  if (mwh < 0) {
    throw new ForecastFeatureError("invalid_input", "MWh must be greater than or equal to 0");
  }

  const peakPercent = parseRequiredNumber(input.peak_percent, "Peak %");
  if (peakPercent < 0 || peakPercent > 100) {
    throw new ForecastFeatureError("invalid_input", "Peak % must be between 0 and 100");
  }

  return {
    portfolio_id: portfolioId,
    month,
    mwh,
    peak_pct: roundDecimal(peakPercent / 100),
  };
}

function getPortfolioForecasts(database: PrototypeDatabase, portfolioId: string): CustomerForecast[] {
  return [...database.forecasts.values()].filter((forecast) => forecast.portfolio_id === portfolioId);
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
  return Math.round(value * 1000) / 1000;
}

function roundDecimal(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
