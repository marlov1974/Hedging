import { calculateSwedishTradingHours } from "../database/pocSeedData.ts";
import type { PriceArea } from "../price-api/types.ts";
import { createStaticSpotActualPrices, type StaticSpotActualPrice } from "./staticSpotActualPrices.ts";

const STATIC_SPOT_ACTUALS = createStaticSpotActualPrices();

export function getMonthlySpotActual(month: string, priceArea: PriceArea): StaticSpotActualPrice {
  const row = STATIC_SPOT_ACTUALS.find((actual) => actual.month === month && actual.price_area === priceArea);
  if (!row) {
    throw new Error(`Missing spot actual for ${priceArea} ${month}`);
  }
  return row;
}

export function getSpotActualsForYear(year: string, priceArea: PriceArea): StaticSpotActualPrice[] {
  const rows = STATIC_SPOT_ACTUALS.filter((actual) => actual.month.startsWith(`${year}-`) && actual.price_area === priceArea);
  if (rows.length === 0) {
    throw new Error(`Missing spot actuals for ${priceArea} ${year}`);
  }
  return rows;
}

export function validateSpotActualConsistency(row: StaticSpotActualPrice): boolean {
  const hours = calculateSwedishTradingHours(row.month);
  const expectedAverage = roundPrice((row.peak_price * hours.peak_h + row.offpeak_price * hours.offpeak_h) / hours.total_h);
  return Math.abs(row.monthly_average_price - expectedAverage) <= 0.000001;
}

export function listStaticSpotActuals(): StaticSpotActualPrice[] {
  return [...STATIC_SPOT_ACTUALS];
}

function roundPrice(price: number): number {
  return Math.round(price * 1_000_000) / 1_000_000;
}
