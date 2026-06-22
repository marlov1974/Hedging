import { calculateSwedishTradingHours, listSeedMonths } from "../database/pocSeedData.ts";
import { getStaticMonthlyReferencePrice } from "../price-api/staticDerivativePrices.ts";
import type { PriceArea } from "../price-api/types.ts";

export type StaticSpotActualPrice = {
  month: string;
  price_area: PriceArea;
  monthly_average_price: number;
  peak_price: number;
  offpeak_price: number;
  currency: "EUR";
  price_unit: "EUR/MWh";
  source_name: string;
  source_method: string;
};

const STATIC_SPOT_SOURCE_NAME = "synthetic-static-spot-actuals-poc";
const STATIC_SPOT_SOURCE_METHOD = "synthetic deterministic spot actuals from static base.sys derivative reference";

export function createStaticSpotActualPrices(): StaticSpotActualPrice[] {
  return listSeedMonths().map((month, index) => {
    const referencePrice = getStaticMonthlyReferencePrice(month, "base.sys", "STO");
    const hours = calculateSwedishTradingHours(month);
    const peakPrice = roundPrice(referencePrice * peakFactorFor(index));
    const offpeakPrice = roundPrice(referencePrice * offpeakFactorFor(index));
    const monthlyAveragePrice = roundPrice((peakPrice * hours.peak_h + offpeakPrice * hours.offpeak_h) / hours.total_h);

    return {
      month,
      price_area: "STO",
      monthly_average_price: monthlyAveragePrice,
      peak_price: peakPrice,
      offpeak_price: offpeakPrice,
      currency: "EUR",
      price_unit: "EUR/MWh",
      source_name: STATIC_SPOT_SOURCE_NAME,
      source_method: STATIC_SPOT_SOURCE_METHOD,
    };
  });
}

function peakFactorFor(index: number): number {
  const cycle = index % 12;
  return 0.92 + cycle * 0.026;
}

function offpeakFactorFor(index: number): number {
  const cycle = index % 12;
  return 0.78 + cycle * 0.021;
}

function roundPrice(price: number): number {
  return Math.round(price * 1_000_000) / 1_000_000;
}
