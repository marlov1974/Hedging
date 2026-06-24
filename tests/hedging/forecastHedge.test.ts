import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  acceptForecastHedgeProfile,
  buildForecastHedgeProfile,
  createExplicitClassicHedgePurchase,
  createExplicitModernHedgePurchase,
  ForecastHedgeError,
  getForecastHedgeMonthRange,
  updateForecastHedgeProfileRow,
} from "../../src/hedging/forecastHedge.ts";
import { getApplicationFeaturesForPortfolio } from "../../src/hedging/applicationConfig.ts";
import { getModernProjectedTransactionsForPortfolioYear, getRawTransactionsForPortfolioYear } from "../../src/hedging/dataViewer.ts";
import { getEventDetails } from "../../src/database/eventForecasts.ts";
import { getPeaksClassicCalloffTransactionRows } from "../../src/hedging/peaksCalloffTransactionList.ts";
import { getMarketProjectionRows } from "../../src/hedging/marketProjection.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("Forecast hedge feature", () => {
  it("Peaks.Modern feature list includes Hedge Forecast", () => {
    const features = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS02-0").features;

    assert.equal(features.some((feature) => feature.feature_id === "forecast-hedge" && feature.available), true);
  });

  it("single demo feature list includes Hedge Forecast for all perspectives", () => {
    const features = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS00-0").features;

    assert.equal(features.some((feature) => feature.feature_id === "forecast-hedge" && feature.available), true);
  });

  it("Hedge Forecast feature exposes Classic and Modern tabs only", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS00-0",
      feature_id: "forecast-hedge",
    });

    assert.match(html, /Feature perspective/);
    assert.match(html, /Classic/);
    assert.match(html, /Modern/);
    assert.doesNotMatch(html, /perspective_id=baseloads/);
  });

  it("renders start/end/percentage form", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "forecast-hedge",
    });

    assert.match(html, /name="start_month"/);
    assert.match(html, /name="end_month"/);
    assert.match(html, /name="percentage"/);
    assert.match(html, /name="price_area"/);
  });

  it("renders modern base and peak profile columns", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "forecast-hedge",
      forecast_hedge_profile: buildForecastHedgeProfile(createPocSeedData(), {
        portfolio_id: "CUS02-0",
        start_month: "2027-01",
        end_month: "2027-01",
        percentage: "50",
        price_area: "STO",
      }),
    });

    assert.match(html, /Forecast Base MWh/);
    assert.match(html, /Forecast Peak MWh/);
    assert.match(html, /Base MWh/);
    assert.match(html, /Base MW/);
    assert.match(html, /Peak MWh/);
    assert.match(html, /Peak MW/);
    assert.doesNotMatch(html, /Allocation Peak MW/);
  });

  it("renders editable hedge forecast input values with at most three decimals", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "forecast-hedge",
      forecast_hedge_profile: buildForecastHedgeProfile(createPocSeedData(), {
        portfolio_id: "CUS02-0",
        start_month: "2027-01",
        end_month: "2027-01",
        percentage: "50",
        price_area: "STO",
      }),
    });

    const values = [...html.matchAll(/data-role="modern-(?:base|peak)-mwh(?:-input)?"[^>]*value="([^"]+)"/g)].map((match) => match[1]);

    assert.ok(values.length > 0);
    assert.equal(values.every((value) => decimalPlaces(value) <= 3), true);
    assert.match(html, /value="224\.294"/);
    assert.match(html, /value="21\.706"/);
    assert.doesNotMatch(html, /value="560\.735294"/);
    assert.doesNotMatch(html, /value="54\.264706"/);
  });

  it("requires price area for percent-of-forecast profile generation", () => {
    assert.throws(
      () =>
        buildForecastHedgeProfile(createPocSeedData(), {
          portfolio_id: "CUS02-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "50",
        }),
      (error) => error instanceof ForecastHedgeError && /price_area/.test(error.message),
    );
  });

  it("Classic Hedge Forecast proposal uses Offpeak and Peak MWh fields", () => {
    const profile = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      perspective_id: "classic",
    });
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS00-0",
      feature_id: "forecast-hedge",
      perspective_id: "classic",
      forecast_hedge_profile: profile,
    });

    assert.match(html, /Forecast Offpeak MWh/);
    assert.match(html, /Forecast Peak MWh/);
    assert.match(html, /name="classic_offpeak_mwh_2027-01"/);
    assert.match(html, /name="classic_peak_mwh_2027-01"/);
    assert.doesNotMatch(html, /name="modern_base_mwh_2027-01"/);
  });

  it("Classic Hedge Forecast percentage scales Offpeak MWh and Peak MWh", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      perspective_id: "classic",
    }).rows[0];

    assert.equal(row.forecast_classic_offpeak_mwh, 246);
    assert.equal(row.forecast_classic_peak_mwh, 246);
    assert.equal(row.classic_offpeak_mwh, 123);
    assert.equal(row.classic_peak_mwh, 123);
    assert.equal(row.total_mwh, 246);
    assert.equal(row.percentage, 0.5);
  });

  it("generates profile for a 3-month range", () => {
    const profile = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-03",
      percentage: "50",
      price_area: "STO",
    });

    assert.deepEqual(
      profile.rows.map((row) => row.month),
      ["2027-01", "2027-02", "2027-03"],
    );
  });

  it("generated proposal scales modern base and peak MWh by percentage", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows[0];

    assert.equal(row.forecast_mwh, 492);
    assert.equal(row.forecast_modern_base_mwh, 448.588235);
    assert.equal(row.forecast_modern_peak_mwh, 43.411765);
    assert.equal(row.modern_base_mwh, 224.294118);
    assert.equal(row.modern_peak_mwh, 21.705883);
    assert.equal(row.total_mwh, 246);
    assert.equal(row.percentage, 0.5);
  });

  it("modern base and peak MW use calendar total and peak hours", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows[0];

    assert.equal(row.calendar_total_h, 744);
    assert.equal(row.calendar_peak_h, 336);
    assert.equal(row.modern_base_mw, 0.301471);
    assert.equal(row.modern_peak_mw, 0.064601);
  });

  it("canonical allocation/base/peak MW are derived from modern profile values", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows[0];

    assert.equal(row.forecast_peak_pct, 0.5);
    assert.equal(row.calendar_peak_h, 336);
    assert.equal(row.allocation_peak_mw, 0.366071);
    assert.equal(row.canonical_base_mw, 0.330645);
    assert.equal(row.canonical_peak_mw, 0.035426);
    assert.equal(row.peak_level_mwh, 123);
  });

  it("matches the P0033 modern to canonical worked example", () => {
    const row = updateForecastHedgeProfileRow({
      month: "2027-01",
      forecast_mwh: 100,
      forecast_peak_pct: 0.5,
      forecast_modern_base_mwh: 87.735849,
      forecast_modern_peak_mwh: 12.264151,
      calendar_total_h: 744,
      calendar_peak_h: 320,
      modern_base_mwh: "87.7358491",
      modern_peak_mwh: "12.264151",
    });

    assert.equal(row.modern_base_mwh, 87.735849);
    assert.equal(row.modern_peak_mwh, 12.264151);
    assert.equal(row.modern_base_mw, 0.117925);
    assert.equal(row.modern_peak_mw, 0.038325);
    assert.equal(row.allocation_peak_mw, 0.15625);
    assert.equal(row.canonical_base_mw, 0.134409);
    assert.equal(row.canonical_peak_mw, 0.021841);
  });

  it("allows negative modern peak MWh and MW", () => {
    const row = updateForecastHedgeProfileRow({
      month: "2027-01",
      forecast_mwh: 100,
      forecast_peak_pct: 0.35,
      forecast_modern_base_mwh: 110,
      forecast_modern_peak_mwh: -10,
      calendar_total_h: 744,
      calendar_peak_h: 320,
      modern_base_mwh: "110",
      modern_peak_mwh: "-10",
    });

    assert.equal(row.total_mwh, 100);
    assert.equal(row.modern_peak_mwh, -10);
    assert.equal(row.modern_peak_mw, -0.03125);
    assert.ok(row.canonical_peak_mw < 0);
  });

  it("flat profile gives zero modern peak MWh", () => {
    const row = updateForecastHedgeProfileRow({
      month: "2027-01",
      forecast_mwh: 100,
      forecast_peak_pct: 320 / 744,
      forecast_modern_base_mwh: 100,
      forecast_modern_peak_mwh: 0,
      calendar_total_h: 744,
      calendar_peak_h: 320,
      modern_base_mwh: "100",
      modern_peak_mwh: "0",
    });

    assert.equal(row.modern_peak_mwh, 0);
    assert.equal(row.modern_peak_mw, 0);
  });

  it("editing modern Base MWh and Peak MWh recalculates MW and Hedge %", () => {
    const row = updateForecastHedgeProfileRow({
      month: "2027-01",
      forecast_mwh: 1000,
      forecast_peak_pct: 0.5,
      forecast_modern_base_mwh: 500,
      forecast_modern_peak_mwh: 500,
      calendar_total_h: 500,
      calendar_peak_h: 250,
      modern_base_mwh: "200",
      modern_peak_mwh: "50",
    });

    assert.equal(row.modern_base_mwh, 200);
    assert.equal(row.modern_peak_mwh, 50);
    assert.equal(row.modern_base_mw, 0.4);
    assert.equal(row.modern_peak_mw, 0.2);
    assert.equal(row.total_mwh, 250);
    assert.equal(row.percentage, 0.25);
  });

  it("accept creates exactly one Calloff", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows.map(toAcceptRow);

    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      date: "2027-01-15",
      rows,
    });

    assert.equal(result.calloff.calloff_id, "CAL00");
    assert.equal(database.calloffs.size, 1);
    assert.equal(result.calloff.product_id, "PRO02");
    assert.equal(result.calloff.portfolio_id, "CUS02-0");
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-01");
    assert.deepEqual(
      result.transactions.map((transaction) => transaction.transaction_id),
      ["CAL00-000", "CAL00-001", "CAL00-002", "CAL00-003", "CAL00-004", "CAL00-005", "CAL00-006"],
    );
  });

  it("accept creates six power transactions and one currency transaction per month", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-03",
      percentage: "50",
      price_area: "STO",
    }).rows.map(toAcceptRow);
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-03",
      percentage: "50",
      price_area: "STO",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST",
      rows,
    });

    assert.equal(result.transactions.length, 21);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-03");
    assert.deepEqual(
      [...new Set(result.transactions.map((transaction) => transaction.month))],
      ["2027-01", "2027-02", "2027-03"],
    );
    const powerTransactions = result.transactions.filter((transaction) => transaction.quantity_type === "MW");
    const currencyTransactions = result.transactions.filter((transaction) => transaction.quantity_type === "EUR");
    assert.equal(powerTransactions.every((transaction) => transaction.price_area === "STO"), true);
    assert.equal(currencyTransactions.every((transaction) => transaction.price_area === undefined), true);
    assert.deepEqual(
      powerTransactions.slice(0, 5).map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component),
      ["allocation.peak.sys", "allocation.peak.epad", "base.sys", "base.epad", "peak.sys"],
    );
    assert.equal(database.productConfigurationComponents.get(powerTransactions[5].productcomponent_id)?.component, "peak.epad");
    assert.deepEqual(
      currencyTransactions.map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component),
      ["currency.eursek", "currency.eursek", "currency.eursek"],
    );
  });

  it("accept mirrors a PURCHASE event with SYS details per price area and area component details", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows.map(toAcceptRow);

    acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      date: "2027-01-15",
      calloff_id: "CAL_EVENT",
      rows,
    });

    const event = database.events.get("EVT:PURCHASE:CAL_EVENT");
    assert.ok(event);
    assert.equal(event.event_type, "PURCHASE");

    const details = getEventDetails(database, event.event_id);
    const baseSys = details.filter((detail) => detail.component_code === "base.sys");
    const peakSys = details.filter((detail) => detail.component_code === "peak.sys");
    const areaBase = details.filter((detail) => /^base\.(sto|mal|lul|sun)$/.test(detail.component_code));
    const areaPeak = details.filter((detail) => /^peak\.(sto|mal|lul|sun)$/.test(detail.component_code));
    const currency = details.find((detail) => detail.component_code === "currency.eursek");

    assert.deepEqual(baseSys.map((detail) => detail.price_area), ["STO"]);
    assert.deepEqual(peakSys.map((detail) => detail.price_area), ["STO"]);
    assert.deepEqual(areaBase.map((detail) => detail.component_code), ["base.sto"]);
    assert.deepEqual(areaPeak.map((detail) => detail.component_code), ["peak.sto"]);
    assert.ok(currency);
    assert.equal(currency.price_area, null);
    assert.equal(currency.quantity_type, "EUR");
  });

  it("base and peak transactions use separate MW formulas and q-factor values", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows.map(toAcceptRow);
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST",
      rows,
    });

    const rowsByComponent = new Map(
      result.transactions.map((transaction) => [
        database.productConfigurationComponents.get(transaction.productcomponent_id)?.component,
        transaction,
      ]),
    );

    assert.equal(rowsByComponent.get("base.sys")?.mw, 0.330645);
    assert.equal(rowsByComponent.get("base.epad")?.mw, 0.330645);
    assert.equal(rowsByComponent.get("allocation.peak.sys")?.mw, 0.366071);
    assert.equal(rowsByComponent.get("allocation.peak.epad")?.mw, 0.366071);
    assert.equal(rowsByComponent.get("peak.sys")?.mw, 0.035426);
    assert.equal(rowsByComponent.get("peak.epad")?.mw, 0.035426);
    assert.equal(rowsByComponent.get("allocation.peak.sys")?.q_factor, 0);
    assert.equal(rowsByComponent.get("allocation.peak.epad")?.q_factor, 0);
    assert.equal(rowsByComponent.get("base.sys")?.q_factor, 1);
    assert.equal(rowsByComponent.get("base.epad")?.q_factor, 1);
    assert.equal(rowsByComponent.get("peak.sys")?.q_factor, 1.2);
    assert.equal(rowsByComponent.get("peak.epad")?.q_factor, 1.2);
    assert.equal(rowsByComponent.get("peak.sys")?.price, 54.876);
    assert.equal(rowsByComponent.get("peak.epad")?.price, -2.64);
    assert.equal([...rowsByComponent.keys()].some((component) => String(component).startsWith("modern.")), false);
  });

  it("Modern Projected Transactions show modern rows after canonical accept", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows.map(toAcceptRow);

    acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST",
      rows,
    });

    const projected = getModernProjectedTransactionsForPortfolioYear(database, "CUS02-0", "2027");
    assert.deepEqual(
      projected.map((row) => row.component),
      ["modern.base.sys", "modern.base.epad", "modern.peak.sys", "modern.peak.epad", "currency.eursek"],
    );
    assert.equal(projected.find((row) => row.component === "modern.base.sys")?.mwh, 224.294161);
    assert.equal(projected.find((row) => row.component === "modern.peak.sys")?.mwh, 21.705719);
  });

  it("rejects negative modern base MWh", () => {
    assert.throws(
      () =>
        updateForecastHedgeProfileRow({
          month: "2027-01",
          forecast_mwh: 100,
          forecast_peak_pct: 0.5,
          forecast_modern_base_mwh: 80,
          forecast_modern_peak_mwh: 20,
          calendar_total_h: 744,
          calendar_peak_h: 320,
          modern_base_mwh: "-1",
          modern_peak_mwh: "20",
        }),
      (error) => error instanceof ForecastHedgeError && /Modern Base MWh/.test(error.message),
    );
  });

  it("rejects zero offpeak hours", () => {
    assert.throws(
      () =>
        updateForecastHedgeProfileRow({
          month: "2027-01",
          forecast_mwh: 100,
          forecast_peak_pct: 0.5,
          forecast_modern_base_mwh: 80,
          forecast_modern_peak_mwh: 20,
          calendar_total_h: 320,
          calendar_peak_h: 320,
          modern_base_mwh: "80",
          modern_peak_mwh: "20",
        }),
      (error) => error instanceof ForecastHedgeError && /offpeak_h/.test(error.message),
    );
  });

  it("market projection excludes allocation and includes base and peak with q-factor", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows.map(toAcceptRow);
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST",
      rows,
    });

    const projectionRows = getMarketProjectionRows(database, result.transactions);
    assert.deepEqual(
      projectionRows.map((row) => row.component),
      ["base.sys", "base.epad", "peak.sys", "peak.epad"],
    );
    assert.equal(projectionRows.some((row) => row.component === "allocation.peak.sys"), false);
    assert.equal(projectionRows.some((row) => row.component === "allocation.peak.epad"), false);
    assert.equal(projectionRows.find((row) => row.component === "base.sys")?.market_mw, 0.330645);
    assert.equal(projectionRows.find((row) => row.component === "peak.sys")?.market_mw, 0.042511);
  });

  it("market projection excludes currency rows from explicit Modern purchases", () => {
    const database = createPocSeedData();
    const result = createExplicitModernHedgePurchase(database, {
      portfolio_id: "CUS02-0",
      month: "2027-01",
      base_mwh: 100,
      peak_mwh: 10,
      base_price_eur_per_mwh: 45,
      peak_price_eur_per_mwh: 12,
      fx_rate: 11.25,
      date: "2027-01-15",
      calloff_id: "CALFX",
    });

    const projectionRows = getMarketProjectionRows(database, result.transactions);

    assert.equal(result.transactions.some((transaction) => transaction.quantity_type === "EUR"), true);
    assert.equal(projectionRows.some((row) => row.component === "currency.eursek"), false);
  });

  it("standard Forecast Hedge accept creates a EUR/SEK currency leg visible in raw Data Viewer rows", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    }).rows.map(toAcceptRow);
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      date: "2027-01-15",
      calloff_id: "CALFX",
      rows,
    });
    const currency = result.transactions.find(
      (transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component === "currency.eursek",
    );
    const rawRows = getRawTransactionsForPortfolioYear(database, "CUS02-0", "2027");

    assert.equal(result.transactions.length, 7);
    assert.equal(currency?.transaction_id, "CALFX-006");
    assert.equal(currency?.month, "2027-01");
    assert.equal(currency?.quantity_type, "EUR");
    assert.equal(currency?.price_type, "SEK_PER_EUR");
    assert.equal(currency?.price, 11.25);
    assert.equal(currency?.mw, 0);
    assert.equal(currency?.q_factor, 0);
    assert.ok((currency?.quantity ?? 0) > 0);
    assert.equal(rawRows.some((row) => row.component === "currency.eursek"), true);
  });

  it("explicit Modern purchase creates power rows and a EUR/SEK currency leg for SEK portfolios", () => {
    const database = createPocSeedData();
    const result = createExplicitModernHedgePurchase(database, {
      portfolio_id: "CUS02-0",
      month: "2027-01",
      base_mwh: 100,
      peak_mwh: 10,
      base_price_eur_per_mwh: 45,
      peak_price_eur_per_mwh: 12,
      fx_rate: 11.25,
      date: "2027-01-15",
      calloff_id: "CALFX",
    });
    const currency = result.transactions.find(
      (transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component === "currency.eursek",
    );
    const base = result.transactions.find(
      (transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component === "base.sys",
    );

    assert.equal(result.transactions.length, 7);
    assert.equal(base?.quantity_type, "MW");
    assert.equal(base?.price_type, "EUR_PER_MWH");
    assert.equal(base?.factor_type, "Q_FACTOR");
    assert.equal(currency?.quantity_type, "EUR");
    assert.equal(currency?.price_type, "SEK_PER_EUR");
    assert.equal(currency?.quantity, 4620);
    assert.equal(currency?.price, 11.25);
    assert.equal(currency?.mw, 0);
    assert.equal(currency?.q_factor, 0);
  });

  it("explicit Classic purchase allows partial currency coverage", () => {
    const database = createPocSeedData();
    const result = createExplicitClassicHedgePurchase(database, {
      portfolio_id: "CUS01-0",
      month: "2027-01",
      offpeak_mwh: 80,
      peak_mwh: 20,
      offpeak_price_eur_per_mwh: 40,
      peak_price_eur_per_mwh: 15,
      fx_rate: 11.2,
      currency_quantity_eur: 1000,
      date: "2027-01-15",
      calloff_id: "CALFX",
    });
    const currency = result.transactions.find(
      (transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component === "currency.eursek",
    );

    assert.equal(result.transactions.length, 7);
    assert.equal(currency?.quantity, 1000);
    assert.equal(currency?.price, 11.2);
  });

  it("missing q-factor value is rejected", () => {
    const database = createPocSeedData();
    database.qFactorValues.delete("Q20-00");

    assert.throws(
      () =>
        acceptForecastHedgeProfile(database, {
          portfolio_id: "CUS02-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "50",
          price_area: "STO",
          date: "2027-01-15",
          calloff_id: "CALLOFF_TEST",
          rows: buildForecastHedgeProfile(database, {
            portfolio_id: "CUS02-0",
            start_month: "2027-01",
            end_month: "2027-01",
            percentage: "50",
            price_area: "STO",
          }).rows.map(toAcceptRow),
        }),
      (error) => error instanceof ForecastHedgeError && /missing Q-factor value/.test(error.message),
    );
  });

  it("missing peak q-factor value is rejected", () => {
    const database = createPocSeedData();
    database.qFactorValues.delete("Q24-00");

    assert.throws(
      () =>
        acceptForecastHedgeProfile(database, {
          portfolio_id: "CUS02-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "50",
          price_area: "STO",
          date: "2027-01-15",
          calloff_id: "CALLOFF_TEST",
          rows: buildForecastHedgeProfile(database, {
            portfolio_id: "CUS02-0",
            start_month: "2027-01",
            end_month: "2027-01",
            percentage: "50",
            price_area: "STO",
          }).rows.map(toAcceptRow),
        }),
      (error) => error instanceof ForecastHedgeError && /missing Q-factor value/.test(error.message),
    );
  });

  it("missing forecast row is rejected", () => {
    const database = createPocSeedData();
    database.forecasts.delete("FOR02-00");
    database.events.delete("EVT:FORECAST:CUS02-0:2027-01");
    for (const detail of [...database.eventDetails.values()]) {
      if (detail.event_id === "EVT:FORECAST:CUS02-0:2027-01") {
        database.eventDetails.delete(detail.event_detail_id);
      }
    }

    assert.throws(
      () =>
        buildForecastHedgeProfile(database, {
          portfolio_id: "CUS02-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "50",
          price_area: "STO",
        }),
      (error) => error instanceof ForecastHedgeError && /missing forecast row/.test(error.message),
    );
  });

  it("missing calendar row is rejected", () => {
    const database = createPocSeedData();
    database.calendars.delete("CAL_SE_TRADING:2027-01");

    assert.throws(
      () =>
        buildForecastHedgeProfile(database, {
          portfolio_id: "CUS02-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "50",
          price_area: "STO",
        }),
      (error) => error instanceof ForecastHedgeError && /missing calendar row/.test(error.message),
    );
  });

  it("invalid percentage is rejected", () => {
    assert.throws(
      () =>
        buildForecastHedgeProfile(createPocSeedData(), {
          portfolio_id: "CUS02-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "101",
          price_area: "STO",
        }),
      (error) => error instanceof ForecastHedgeError && /percentage/.test(error.message),
    );
  });

  it("same portfolio can generate and accept a forecast hedge through the Modern perspective", () => {
    const database = createPocSeedData();
    const profile = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
    });
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      date: "2027-01-15",
      calloff_id: "CALLOFF_SHARED",
      rows: profile.rows.map(toAcceptRow),
    });

    assert.equal(result.calloff.portfolio_id, "CUS00-0");
    assert.equal(result.calloff.product_id, "PRO02");
    assert.equal(result.transactions.length, 7);
    assert.deepEqual(
      getModernProjectedTransactionsForPortfolioYear(database, "CUS00-0", "2027").map((row) => row.component),
      ["modern.base.sys", "modern.base.epad", "modern.peak.sys", "modern.peak.epad", "currency.eursek"],
    );
  });

  it("accepting Classic Hedge Forecast writes Peaks.Classic canonical rows only", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      perspective_id: "classic",
    }).rows.map(toClassicAcceptRow);

    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      perspective_id: "classic",
      date: "2027-01-15",
      calloff_id: "CALLOFF_CLASSIC",
      rows,
    });
    const rowsByComponent = new Map(
      result.transactions.map((transaction) => [
        database.productConfigurationComponents.get(transaction.productcomponent_id)?.component,
        transaction,
      ]),
    );

    assert.equal(result.calloff.product_id, "PRO01");
    assert.equal(rowsByComponent.get("allocation.peak.sys")?.mw, 0.366071);
    assert.equal(rowsByComponent.get("allocation.peak.epad")?.mw, 0.366071);
    assert.equal(rowsByComponent.get("base.sys")?.mw, 0.330645);
    assert.equal(rowsByComponent.get("base.epad")?.mw, 0.330645);
    assert.equal(rowsByComponent.get("peak.sys")?.mw, 0.035426);
    assert.equal(rowsByComponent.get("peak.epad")?.mw, 0.035426);
    assert.equal([...rowsByComponent.keys()].some((component) => String(component).startsWith("classic.")), false);
    assert.equal(rowsByComponent.get("allocation.peak.sys")?.q_factor, 0);
  });

  it("Classic Hedge Forecast allows negative canonical peak from non-negative customer values", () => {
    const database = createPocSeedData();
    const rows = [
      {
        month: "2027-01",
        classic_offpeak_mwh: "65",
        classic_peak_mwh: "35",
      },
    ];
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "100",
      price_area: "STO",
      perspective_id: "classic",
      date: "2027-01-15",
      calloff_id: "CALLOFF_NEGATIVE_CLASSIC",
      rows,
    });
    const peakSys = result.transactions.find(
      (transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component === "peak.sys",
    );

    assert.ok(peakSys);
    assert.ok(peakSys.mw < 0);
  });

  it("Classic Calloff List displays MWh values after Classic Hedge Forecast accept", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      perspective_id: "classic",
    }).rows.map(toClassicAcceptRow);

    acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      price_area: "STO",
      perspective_id: "classic",
      date: "2027-01-15",
      calloff_id: "CALLOFF_CLASSIC",
      rows,
    });

    const classicRows = getPeaksClassicCalloffTransactionRows(database, "CUS00-0");
    assertApprox(classicRows[0].offpeak_mwh, 123.000024);
    assertApprox(classicRows[0].peak_mwh, 122.999976);
    assert.equal(classicRows[0].projected_total_value, classicRows[0].canonical_total_value);
  });

  it("rejects end month before start month", () => {
    assert.throws(() => getForecastHedgeMonthRange("2027-03", "2027-01"), /end_month/);
  });
});

function toAcceptRow(row: {
  month: string;
  modern_base_mwh: number;
  modern_peak_mwh: number;
}): { month: string; modern_base_mwh: string; modern_peak_mwh: string } {
  return {
    month: row.month,
    modern_base_mwh: String(row.modern_base_mwh),
    modern_peak_mwh: String(row.modern_peak_mwh),
  };
}

function toClassicAcceptRow(row: {
  month: string;
  classic_offpeak_mwh: number;
  classic_peak_mwh: number;
}): { month: string; classic_offpeak_mwh: string; classic_peak_mwh: string } {
  return {
    month: row.month,
    classic_offpeak_mwh: String(row.classic_offpeak_mwh),
    classic_peak_mwh: String(row.classic_peak_mwh),
  };
}

function decimalPlaces(value: string): number {
  return value.includes(".") ? value.split(".")[1].length : 0;
}

function assertApprox(actual: number | undefined, expected: number, tolerance = 0.001): void {
  assert.ok(actual !== undefined);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} !== ${expected}`);
}
