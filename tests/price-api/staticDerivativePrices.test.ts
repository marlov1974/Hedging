import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPriceApiFromProviderMode } from "../../src/price-api/providerMode.ts";
import {
  ANNUAL_TO_MONTH_FACTORS,
  createStaticDerivativePriceBlocks,
  StaticDerivativePriceProvider,
} from "../../src/price-api/staticDerivativePrices.ts";

describe("static derivative price list", () => {
  it("contains year, quarter and month blocks", () => {
    const blocks = createStaticDerivativePriceBlocks();
    const yearPeriods = new Set(blocks.filter((block) => block.block_type === "year").map((block) => block.start_month.slice(0, 4)));
    const quarterBlocks = blocks.filter((block) => block.block_type === "quarter" && block.component === "base.sys");
    const monthBlocks = blocks.filter((block) => block.block_type === "month" && block.component === "base.sys");

    assert.deepEqual([...yearPeriods].sort(), ["2027", "2028", "2029", "2030"]);
    assert.equal(quarterBlocks.length, 11);
    assert.equal(monthBlocks.length, 36);
  });

  it("contains base.sys and base.epad blocks", () => {
    const components = new Set(createStaticDerivativePriceBlocks().map((block) => block.component));

    assert.equal(components.has("base.sys"), true);
    assert.equal(components.has("base.epad"), true);
  });

  it("uses 12 annual-to-month distribution keys with annual average 100 percent", () => {
    const factors = Object.values(ANNUAL_TO_MONTH_FACTORS);
    const annualAverage = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    const q3Average = (ANNUAL_TO_MONTH_FACTORS["07"] + ANNUAL_TO_MONTH_FACTORS["08"] + ANNUAL_TO_MONTH_FACTORS["09"]) / 3;

    assert.equal(factors.length, 12);
    assert.equal(round(annualAverage), 1);
    assert.equal(round(q3Average), 1.043333);
  });

  it("exposes annual and block prices through the static provider", () => {
    const provider = new StaticDerivativePriceProvider();

    assert.equal(provider.getAnnualPrice("2029", "STO")?.["base.sys"], 42.9);
    assert.equal(provider.getBlock("base.epad", "STO", "quarter", "2028-Q2")?.price, -0.32);
    assert.equal(provider.getBlock("base.sys", "STO", "month", "2029-12")?.price, 39.9);
  });

  it("lets the Price API use static provider mode", async () => {
    const api = await createPriceApiFromProviderMode({ env: { PRICE_PROVIDER_MODE: "static" } });
    const response = api.getMonthlyPrices({ start_month: "2029-01", end_month: "2029-01" });

    assert.deepEqual(response.rows[0], {
      month: "2029-01",
      "base.sys": 48.05,
      "base.epad": -0.67,
      "currency.sek": 11.5,
    });
  });

  it("lets the Price API return seasonal monthly prices from annual static prices", async () => {
    const api = await createPriceApiFromProviderMode({ env: { PRICE_PROVIDER_MODE: "static" } });
    const response = api.getMonthlyPrices({ start_month: "2027-07", end_month: "2027-09" });

    assert.deepEqual(response.rows.map((row) => row["base.sys"]), [41.61, 49.39, 52.13]);
  });
});

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
