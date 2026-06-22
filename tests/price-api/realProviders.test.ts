import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPriceApiFromProviderMode } from "../../src/price-api/providerMode.ts";
import { ConfiguredHttpFuturesPriceProvider, RealCurrencyProvider, type HttpFetch } from "../../src/price-api/realProviders.ts";
import { PriceApiError } from "../../src/price-api/types.ts";

describe("real provider adapters", () => {
  it("parses annual system future into normalized base.sys block", () => {
    const provider = ConfiguredHttpFuturesPriceProvider.fromText(JSON.stringify({ blocks: [annualBlock("base.sys", 51.5)] }), "test-source");

    const blocks = provider.getNormalizedBlocks();
    assert.equal(blocks[0].component, "base.sys");
    assert.equal(blocks[0].block_type, "year");
    assert.equal(blocks[0].price, 51.5);
  });

  it("parses annual EPAD future into normalized base.epad block", () => {
    const csv = [
      "component,price_area,block_type,block_id,start_month,end_month,price,currency,price_unit,retrieved_at,source_name,source_instrument",
      "base.epad,STO,year,epad-2027,2027-01,2027-12,4.75,EUR,EUR/MWh,2026-01-01T00:00:00.000Z,test-source,EPAD-2027",
    ].join("\n");

    const provider = ConfiguredHttpFuturesPriceProvider.fromText(csv, "test-source");
    assert.equal(provider.getNormalizedBlocks()[0].component, "base.epad");
    assert.equal(provider.getAnnualPrice("2027", "STO"), undefined);
  });

  it("parses SEK currency response into currency.sek", () => {
    const provider = RealCurrencyProvider.fromResponse({ amount: 1, base: "EUR", rates: { SEK: 11.2 } }, "frankfurter-test");

    assert.deepEqual(provider.getAnnualRate("2027", "currency.sek"), {
      year: "2027",
      component_code: "currency.sek",
      value: 11.2,
    });
  });

  it("returns a clear configuration error when real mode is missing futures source config", async () => {
    await assert.rejects(
      () => createPriceApiFromProviderMode({ env: { PRICE_PROVIDER_MODE: "real" } }),
      (error) => error instanceof PriceApiError && error.code === "configuration_error",
    );
  });

  it("returns a clear provider error on HTTP source failure", async () => {
    const fetchImpl: HttpFetch = async () => ({
      ok: false,
      status: 503,
      async text() {
        return "unavailable";
      },
    });

    await assert.rejects(
      () =>
        ConfiguredHttpFuturesPriceProvider.fromConfig({
          sourceUrl: "https://example.invalid/futures.csv",
          fetchImpl,
        }),
      (error) => error instanceof PriceApiError && error.code === "provider_error",
    );
  });

  it("keeps fixture mode working", async () => {
    const api = await createPriceApiFromProviderMode({ env: { PRICE_PROVIDER_MODE: "fixture" } });
    const response = api.getMonthlyPrices({ start_month: "2027-01", end_month: "2027-01" });

    assert.equal(response.rows[0]["base.sys"], 51.25);
    assert.equal(response.rows[0]["currency.sek"], 11.2);
  });

  it("does not require credentials for test execution", async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: HttpFetch = async (url) => {
      requestedUrls.push(url);
      if (url.includes("currency")) {
        return jsonResponse({ rates: { SEK: 11.2 } });
      }
      return textResponse(JSON.stringify({ blocks: [annualBlock("base.sys", 51.5), annualBlock("base.epad", 4.75)] }));
    };

    const api = await createPriceApiFromProviderMode({
      env: {
        PRICE_PROVIDER_MODE: "real",
        PRICE_API_FUTURES_SOURCE_URL: "https://example.invalid/public-futures.json",
        PRICE_API_CURRENCY_SOURCE_URL: "https://example.invalid/public-currency.json",
      },
      fetchImpl,
    });

    const response = api.getMonthlyPrices({ start_month: "2027-01", end_month: "2027-01" });
    assert.equal(response.rows[0]["base.sys"], 51.5);
    assert.deepEqual(requestedUrls, [
      "https://example.invalid/public-futures.json",
      "https://example.invalid/public-currency.json",
    ]);
  });
});

function annualBlock(component: "base.sys" | "base.epad", price: number) {
  return {
    component,
    price_area: "STO",
    block_type: "year",
    block_id: `${component}-2027`,
    start_month: "2027-01",
    end_month: "2027-12",
    price,
    currency: "EUR",
    price_unit: "EUR/MWh",
    retrieved_at: "2026-01-01T00:00:00.000Z",
    source_name: "test-source",
    source_instrument: `${component}-annual-2027`,
  };
}

function textResponse(body: string): ReturnType<HttpFetch> extends Promise<infer T> ? T : never {
  return {
    ok: true,
    status: 200,
    async text() {
      return body;
    },
  };
}

function jsonResponse(body: unknown): ReturnType<HttpFetch> extends Promise<infer T> ? T : never {
  return {
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify(body);
    },
    async json() {
      return body;
    },
  };
}
