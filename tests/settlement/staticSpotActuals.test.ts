import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateSwedishTradingHours } from "../../src/database/pocSeedData.ts";
import { getStaticMonthlyReferencePrice } from "../../src/price-api/staticDerivativePrices.ts";
import { createStaticSpotActualPrices } from "../../src/settlement/staticSpotActualPrices.ts";
import {
  getMonthlySpotActual,
  getSpotActualsForYear,
  listStaticSpotActuals,
  validateSpotActualConsistency,
} from "../../src/settlement/spotActuals.ts";

describe("static spot actual prices", () => {
  it("covers every month from 2027-01 through 2029-12", () => {
    const actuals = createStaticSpotActualPrices();

    assert.equal(actuals.length, 36);
    assert.equal(actuals[0].month, "2027-01");
    assert.equal(actuals[35].month, "2029-12");
  });

  it("has monthly average, peak and offpeak prices on every row", () => {
    for (const actual of listStaticSpotActuals()) {
      assert.equal(Number.isFinite(actual.monthly_average_price), true);
      assert.equal(Number.isFinite(actual.peak_price), true);
      assert.equal(Number.isFinite(actual.offpeak_price), true);
    }
  });

  it("calculates monthly average from peak and offpeak prices using calendar hours", () => {
    for (const actual of listStaticSpotActuals()) {
      const hours = calculateSwedishTradingHours(actual.month);
      const expectedAverage = roundPrice((actual.peak_price * hours.peak_h + actual.offpeak_price * hours.offpeak_h) / hours.total_h);

      assert.equal(actual.monthly_average_price, expectedAverage);
      assert.equal(validateSpotActualConsistency(actual), true);
    }
  });

  it("keeps deterministic spot variation within plus or minus 30 percent of the derivative reference", () => {
    for (const actual of listStaticSpotActuals()) {
      const reference = getStaticMonthlyReferencePrice(actual.month, "base.sys", "STO");

      assert.ok(actual.peak_price >= reference * 0.7);
      assert.ok(actual.peak_price <= reference * 1.3);
      assert.ok(actual.offpeak_price >= reference * 0.7);
      assert.ok(actual.offpeak_price <= reference * 1.3);
      assert.ok(actual.monthly_average_price >= reference * 0.7);
      assert.ok(actual.monthly_average_price <= reference * 1.3);
    }
  });

  it("returns values for a selected month", () => {
    const actual = getMonthlySpotActual("2028-05", "STO");

    assert.equal(actual.month, "2028-05");
    assert.equal(actual.price_area, "STO");
  });

  it("returns values for a selected year", () => {
    const actuals = getSpotActualsForYear("2029", "STO");

    assert.equal(actuals.length, 12);
    assert.equal(actuals[0].month, "2029-01");
  });

  it("returns a clear error for a missing month", () => {
    assert.throws(() => getMonthlySpotActual("2031-01", "STO"), /Missing spot actual for STO 2031-01/);
  });
});

function roundPrice(price: number): number {
  return Math.round(price * 1_000_000) / 1_000_000;
}
