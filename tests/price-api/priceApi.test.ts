import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expandMonthRange } from "../../src/price-api/monthRange.ts";
import { FixtureCurrencyProvider, FixtureFuturesPriceProvider } from "../../src/price-api/providers.ts";
import { createPriceApi, createDefaultPriceApi } from "../../src/price-api/priceApi.ts";
import { PriceApiError } from "../../src/price-api/types.ts";

describe("Price API prototype", () => {
  it("returns one row for a one-month request", () => {
    const api = createDefaultPriceApi();
    const response = api.getMonthlyPrices({ start_month: "2027-01", end_month: "2027-01" });

    assert.equal(response.rows.length, 1);
    assert.deepEqual(response.rows[0], {
      month: "2027-01",
      "base.sys": 51.25,
      "base.epad": 4.75,
      "currency.sek": 11.2,
    });
  });

  it("returns 12 rows for a full-year request", () => {
    const api = createDefaultPriceApi();
    const response = api.getMonthlyPrices({ start_month: "2027-01", end_month: "2027-12" });

    assert.equal(response.rows.length, 12);
    assert.equal(response.rows[0].month, "2027-01");
    assert.equal(response.rows[11].month, "2027-12");
  });

  it("uses each year's annual fixture values for a cross-year request", () => {
    const api = createDefaultPriceApi();
    const response = api.getMonthlyPrices({ start_month: "2027-12", end_month: "2028-01" });

    assert.deepEqual(response.rows, [
      {
        month: "2027-12",
        "base.sys": 51.25,
        "base.epad": 4.75,
        "currency.sek": 11.2,
      },
      {
        month: "2028-01",
        "base.sys": 52.5,
        "base.epad": 5.25,
        "currency.sek": 11.4,
      },
    ]);
  });

  it("rejects invalid month format", () => {
    const api = createDefaultPriceApi();

    assert.throws(
      () => api.getMonthlyPrices({ start_month: "2027-1", end_month: "2027-12" }),
      (error) => error instanceof PriceApiError && error.code === "invalid_request",
    );
  });

  it("rejects end month before start month", () => {
    assert.throws(
      () => expandMonthRange("2027-12", "2027-01"),
      (error) => error instanceof PriceApiError && error.code === "invalid_request",
    );
  });

  it("rejects missing annual fixture data", () => {
    const api = createPriceApi({
      futuresPriceProvider: new FixtureFuturesPriceProvider({}),
      currencyProvider: new FixtureCurrencyProvider(),
    });

    assert.throws(
      () => api.getMonthlyPrices({ start_month: "2027-01", end_month: "2027-01" }),
      (error) => error instanceof PriceApiError && error.code === "missing_data",
    );
  });

  it("keeps currency.sek present and separate", () => {
    const api = createDefaultPriceApi();
    const row = api.getMonthlyPrices({ start_month: "2027-01", end_month: "2027-01" }).rows[0];

    assert.equal(Object.hasOwn(row, "currency.sek"), true);
    assert.equal(Object.hasOwn(row, "base.sys"), true);
    assert.equal(Object.hasOwn(row, "base.epad"), true);
  });

  it("does not change component prices by the currency component", () => {
    const api = createPriceApi({
      futuresPriceProvider: new FixtureFuturesPriceProvider({
        "2027": {
          year: "2027",
          area_code: "STO",
          "base.sys": 61,
          "base.epad": 6,
        },
      }),
      currencyProvider: new FixtureCurrencyProvider({
        "2027": {
          year: "2027",
          component_code: "currency.sek",
          value: 99,
        },
      }),
    });

    const row = api.getMonthlyPrices({ start_month: "2027-01", end_month: "2027-01" }).rows[0];

    assert.equal(row["base.sys"], 61);
    assert.equal(row["base.epad"], 6);
    assert.equal(row["currency.sek"], 99);
  });
});
