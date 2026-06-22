import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { directBlock, FixtureBlockPriceProvider } from "../../src/price-api/blockProviders.ts";
import { createPriceApi, createDefaultPriceApi } from "../../src/price-api/priceApi.ts";
import { FixtureCurrencyProvider, FixtureFuturesPriceProvider } from "../../src/price-api/providers.ts";
import { PriceApiError, type PriceApiTraceEntry } from "../../src/price-api/types.ts";

describe("Price API v2 profile stacking", () => {
  it("returns annual prices for a flat annual profile", () => {
    const response = createDefaultPriceApi().getProfilePrices({
      price_area: "STO",
      profile: fullYearProfile(10),
    });

    assert.equal(response.rows[0]["base.sys"], 50);
    assert.equal(response.rows[0]["base.epad"], 5);
    assert.equal(response.rows[0]["currency.sek"], 11.2);
  });

  it("returns 12 rows for a full-year profile", () => {
    const response = createDefaultPriceApi().getProfilePrices({
      price_area: "STO",
      profile: fullYearProfile(10),
    });

    assert.equal(response.rows.length, 12);
    assert.equal(response.rows[0].month, "2027-01");
    assert.equal(response.rows[11].month, "2027-12");
  });

  it("uses annual plus quarterly layers", () => {
    const response = createDefaultPriceApi().getProfilePrices({
      price_area: "STO",
      profile: shapedProfile({ "2027-01": 15, "2027-02": 15, "2027-03": 15 }),
    });

    assert.equal(round(response.rows[0]["base.sys"]), 53.333333);
    assert.equal(round(response.rows[0]["base.epad"]), 5.666667);
  });

  it("uses annual plus quarterly plus monthly layers", () => {
    const response = createDefaultPriceApi().getProfilePrices({
      price_area: "STO",
      profile: shapedProfile({ "2027-01": 20, "2027-02": 15, "2027-03": 15 }),
    });

    assert.equal(response.rows[0]["month"], "2027-01");
    assert.equal(round(response.rows[0]["base.sys"]), 62.5);
    assert.equal(round(response.rows[0]["base.epad"]), 6.5);
  });

  it("creates missing quarter blocks virtually from year blocks", () => {
    const api = createApiWithBlocks([
      directBlock("base.sys", "year", "2027", 50),
      directBlock("base.epad", "year", "2027", 5),
    ]);
    const result = api.getProfilePricesWithTrace({
      price_area: "STO",
      profile: shapedProfile({ "2027-01": 15, "2027-02": 15, "2027-03": 15 }),
    });

    assert.equal(round(result.response.rows[0]["base.sys"]), 55.833333);
    assert.equal(hasVirtualTrace(result.trace, "base.sys", "quarter"), true);
  });

  it("creates missing month blocks virtually from quarter blocks", () => {
    const api = createApiWithBlocks([
      directBlock("base.sys", "year", "2027", 50),
      directBlock("base.sys", "quarter", "2027-Q1", 60),
      directBlock("base.epad", "year", "2027", 5),
      directBlock("base.epad", "quarter", "2027-Q1", 7),
    ]);
    const result = api.getProfilePricesWithTrace({
      price_area: "STO",
      profile: shapedProfile({ "2027-01": 20, "2027-02": 15, "2027-03": 15 }),
    });

    assert.equal(round(result.response.rows[0]["base.sys"]), 45.7);
    assert.equal(hasVirtualTrace(result.trace, "base.sys", "month"), true);
  });

  it("uses weighted averages when multiple blocks apply to one month", () => {
    const result = createDefaultPriceApi().getProfilePricesWithTrace({
      price_area: "STO",
      profile: shapedProfile({ "2027-01": 20, "2027-02": 15, "2027-03": 15 }),
    });

    const janBaseSysTrace = result.trace.filter((entry) => entry.month === "2027-01" && entry.component === "base.sys");
    assert.equal(janBaseSysTrace.length, 3);
    assert.equal(round(result.response.rows[0]["base.sys"]), 62.5);
  });

  it("rejects unsupported price areas", () => {
    assert.throws(
      () => createDefaultPriceApi().getProfilePrices({ price_area: "ALT", profile: [{ month: "2027-01", mw: 10 }] }),
      (error) => error instanceof PriceApiError && error.code === "invalid_request",
    );
  });

  it("rejects duplicate profile months", () => {
    assert.throws(
      () =>
        createDefaultPriceApi().getProfilePrices({
          price_area: "STO",
          profile: [
            { month: "2027-01", mw: 10 },
            { month: "2027-01", mw: 11 },
          ],
        }),
      (error) => error instanceof PriceApiError && error.code === "invalid_request",
    );
  });

  it("rejects non-contiguous profiles", () => {
    assert.throws(
      () =>
        createDefaultPriceApi().getProfilePrices({
          price_area: "STO",
          profile: [
            { month: "2027-01", mw: 10 },
            { month: "2027-03", mw: 11 },
          ],
        }),
      (error) => error instanceof PriceApiError && error.code === "invalid_request",
    );
  });

  it("rejects negative MW", () => {
    assert.throws(
      () => createDefaultPriceApi().getProfilePrices({ price_area: "STO", profile: [{ month: "2027-01", mw: -1 }] }),
      (error) => error instanceof PriceApiError && error.code === "invalid_request",
    );
  });

  it("keeps currency.sek separate from base.sys and base.epad", () => {
    const row = createDefaultPriceApi().getProfilePrices({
      price_area: "STO",
      profile: [{ month: "2027-01", mw: 10 }],
    }).rows[0];

    assert.equal(row["base.sys"], 50);
    assert.equal(row["base.epad"], 5);
    assert.equal(row["currency.sek"], 11.2);
  });

  it("marks virtual blocks as virtual in trace", () => {
    const api = createApiWithBlocks([
      directBlock("base.sys", "year", "2027", 50),
      directBlock("base.epad", "year", "2027", 5),
    ]);
    const result = api.getProfilePricesWithTrace({
      price_area: "STO",
      profile: shapedProfile({ "2027-01": 15, "2027-02": 15, "2027-03": 15 }),
    });

    const virtualEntry = result.trace.find((entry) => entry.component === "base.sys" && entry.virtual);
    assert.equal(Boolean(virtualEntry), true);
    assert.equal(virtualEntry?.virtual_rule_id, "quarter_from_year:Q1");
  });

  it("rejects missing fixture data that cannot be virtualized", () => {
    const api = createApiWithBlocks([]);

    assert.throws(
      () => api.getProfilePrices({ price_area: "STO", profile: [{ month: "2027-01", mw: 10 }] }),
      (error) => error instanceof PriceApiError && error.code === "missing_data",
    );
  });
});

function createApiWithBlocks(blocks: ConstructorParameters<typeof FixtureBlockPriceProvider>[0]) {
  return createPriceApi({
    futuresPriceProvider: new FixtureFuturesPriceProvider(),
    currencyProvider: new FixtureCurrencyProvider(),
    blockPriceProvider: new FixtureBlockPriceProvider(blocks),
  });
}

function fullYearProfile(mw: number) {
  return Array.from({ length: 12 }, (_, index) => ({
    month: `2027-${String(index + 1).padStart(2, "0")}`,
    mw,
  }));
}

function shapedProfile(overrides: Record<string, number>) {
  return fullYearProfile(10).map((row) => ({
    month: row.month,
    mw: overrides[row.month] ?? row.mw,
  }));
}

function hasVirtualTrace(trace: PriceApiTraceEntry[], component: string, blockType: string): boolean {
  return trace.some((entry) => entry.component === component && entry.source_block_type === blockType && entry.virtual);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
