import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  acceptForecastHedgeProfile,
  buildForecastHedgeProfile,
  ForecastHedgeError,
  getForecastHedgeMonthRange,
  updateForecastHedgeProfileRow,
} from "../../src/hedging/forecastHedge.ts";
import { getApplicationFeaturesForPortfolio } from "../../src/hedging/applicationConfig.ts";
import { getModernProjectedTransactionsForPortfolioYear } from "../../src/hedging/dataViewer.ts";
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
      }),
    });

    const values = [...html.matchAll(/data-role="modern-(?:base|peak)-mwh(?:-input)?"[^>]*value="([^"]+)"/g)].map((match) => match[1]);

    assert.ok(values.length > 0);
    assert.equal(values.every((value) => decimalPlaces(value) <= 3), true);
    assert.match(html, /value="560\.735"/);
    assert.match(html, /value="54\.265"/);
    assert.doesNotMatch(html, /value="560\.735294"/);
    assert.doesNotMatch(html, /value="54\.264706"/);
  });

  it("generates profile for a 3-month range", () => {
    const profile = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-03",
      percentage: "50",
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
    }).rows[0];

    assert.equal(row.forecast_mwh, 1230);
    assert.equal(row.forecast_modern_base_mwh, 1121.470588);
    assert.equal(row.forecast_modern_peak_mwh, 108.529412);
    assert.equal(row.modern_base_mwh, 560.735294);
    assert.equal(row.modern_peak_mwh, 54.264706);
    assert.equal(row.total_mwh, 615);
    assert.equal(row.percentage, 0.5);
  });

  it("modern base and peak MW use calendar total and peak hours", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
    }).rows[0];

    assert.equal(row.calendar_total_h, 744);
    assert.equal(row.calendar_peak_h, 336);
    assert.equal(row.modern_base_mw, 0.753676);
    assert.equal(row.modern_peak_mw, 0.161502);
  });

  it("canonical allocation/base/peak MW are derived from modern profile values", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
    }).rows[0];

    assert.equal(row.forecast_peak_pct, 0.5);
    assert.equal(row.calendar_peak_h, 336);
    assert.equal(row.allocation_peak_mw, 0.915179);
    assert.equal(row.canonical_base_mw, 0.826613);
    assert.equal(row.canonical_peak_mw, 0.088566);
    assert.equal(row.peak_level_mwh, 307.5);
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
    }).rows.map(toAcceptRow);

    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
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
      ["CAL00-000", "CAL00-001", "CAL00-002", "CAL00-003", "CAL00-004", "CAL00-005"],
    );
  });

  it("accept creates six transactions per month for allocation, base and peak components", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-03",
      percentage: "50",
    }).rows.map(toAcceptRow);
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-03",
      percentage: "50",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST",
      rows,
    });

    assert.equal(result.transactions.length, 18);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-03");
    assert.deepEqual(
      [...new Set(result.transactions.map((transaction) => transaction.month))],
      ["2027-01", "2027-02", "2027-03"],
    );
    assert.deepEqual(
      result.transactions.slice(0, 5).map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component),
      ["allocation.peak.sys", "allocation.peak.epad", "base.sys", "base.epad", "peak.sys"],
    );
    assert.equal(database.productConfigurationComponents.get(result.transactions[5].productcomponent_id)?.component, "peak.epad");
  });

  it("base and peak transactions use separate MW formulas and q-factor values", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
    }).rows.map(toAcceptRow);
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
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

    assert.equal(rowsByComponent.get("base.sys")?.mw, 0.826613);
    assert.equal(rowsByComponent.get("base.epad")?.mw, 0.826613);
    assert.equal(rowsByComponent.get("allocation.peak.sys")?.mw, 0.915179);
    assert.equal(rowsByComponent.get("allocation.peak.epad")?.mw, 0.915179);
    assert.equal(rowsByComponent.get("peak.sys")?.mw, 0.088566);
    assert.equal(rowsByComponent.get("peak.epad")?.mw, 0.088566);
    assert.equal(rowsByComponent.get("allocation.peak.sys")?.q_factor, 0);
    assert.equal(rowsByComponent.get("allocation.peak.epad")?.q_factor, 0);
    assert.equal(rowsByComponent.get("base.sys")?.q_factor, 1);
    assert.equal(rowsByComponent.get("base.epad")?.q_factor, 1);
    assert.equal(rowsByComponent.get("peak.sys")?.q_factor, 1.2);
    assert.equal(rowsByComponent.get("peak.epad")?.q_factor, 1.2);
    assert.equal([...rowsByComponent.keys()].some((component) => String(component).startsWith("modern.")), false);
  });

  it("Modern Projected Transactions show modern rows after canonical accept", () => {
    const database = createPocSeedData();
    const rows = buildForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
    }).rows.map(toAcceptRow);

    acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST",
      rows,
    });

    const projected = getModernProjectedTransactionsForPortfolioYear(database, "CUS02-0", "2027");
    assert.deepEqual(
      projected.map((row) => row.component),
      ["modern.base.sys", "modern.base.epad", "modern.peak.sys", "modern.peak.epad"],
    );
    assert.equal(projected.find((row) => row.component === "modern.base.sys")?.mwh, 560.735163);
    assert.equal(projected.find((row) => row.component === "modern.peak.sys")?.mwh, 54.264909);
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
    }).rows.map(toAcceptRow);
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
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
    assert.equal(projectionRows.find((row) => row.component === "base.sys")?.market_mw, 0.826613);
    assert.equal(projectionRows.find((row) => row.component === "peak.sys")?.market_mw, 0.106279);
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
          date: "2027-01-15",
          calloff_id: "CALLOFF_TEST",
          rows: buildForecastHedgeProfile(database, {
            portfolio_id: "CUS02-0",
            start_month: "2027-01",
            end_month: "2027-01",
            percentage: "50",
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
          date: "2027-01-15",
          calloff_id: "CALLOFF_TEST",
          rows: buildForecastHedgeProfile(database, {
            portfolio_id: "CUS02-0",
            start_month: "2027-01",
            end_month: "2027-01",
            percentage: "50",
          }).rows.map(toAcceptRow),
        }),
      (error) => error instanceof ForecastHedgeError && /missing Q-factor value/.test(error.message),
    );
  });

  it("missing forecast row is rejected", () => {
    const database = createPocSeedData();
    database.forecasts.delete("FOR02-00");

    assert.throws(
      () =>
        buildForecastHedgeProfile(database, {
          portfolio_id: "CUS02-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "50",
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
    });
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS00-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      date: "2027-01-15",
      calloff_id: "CALLOFF_SHARED",
      rows: profile.rows.map(toAcceptRow),
    });

    assert.equal(result.calloff.portfolio_id, "CUS00-0");
    assert.equal(result.calloff.product_id, "PRO02");
    assert.equal(result.transactions.length, 6);
    assert.deepEqual(
      getModernProjectedTransactionsForPortfolioYear(database, "CUS00-0", "2027").map((row) => row.component),
      ["modern.base.sys", "modern.base.epad", "modern.peak.sys", "modern.peak.epad"],
    );
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

function decimalPlaces(value: string): number {
  return value.includes(".") ? value.split(".")[1].length : 0;
}
