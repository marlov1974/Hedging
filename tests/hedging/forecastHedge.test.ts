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
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("Forecast hedge feature", () => {
  it("PeaksModern feature list includes Hedge Forecast", () => {
    const features = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS02-0").features;

    assert.equal(features.some((feature) => feature.feature_id === "forecast-hedge" && feature.available), true);
  });

  it("Baseloads feature list does not include Hedge Forecast", () => {
    const features = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS00-0").features;

    assert.equal(features.some((feature) => feature.feature_id === "forecast-hedge"), false);
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

  it("hedge_mwh equals forecast_mwh times percentage", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
    }).rows[0];

    assert.equal(row.forecast_mwh, 1230);
    assert.equal(row.hedge_mwh, 615);
    assert.equal(row.percentage, 0.5);
  });

  it("hedge_mw equals hedge_mwh divided by calendar total_h", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
    }).rows[0];

    assert.equal(row.calendar_total_h, 744);
    assert.equal(row.hedge_mw, 0.826613);
  });

  it("peak hedge volume uses forecast peak percentage and peak hours", () => {
    const row = buildForecastHedgeProfile(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
    }).rows[0];

    assert.equal(row.forecast_peak_pct, 0.5);
    assert.equal(row.calendar_peak_h, 336);
    assert.equal(row.peak_hedge_mwh, 307.5);
    assert.equal(row.peak_hedge_mw, 0.915179);
  });

  it("editing Hedge MWh recalculates Hedge MW and Hedge %", () => {
    const row = updateForecastHedgeProfileRow({
      month: "2027-01",
      forecast_mwh: 1000,
      forecast_peak_pct: 0.5,
      calendar_total_h: 500,
      calendar_peak_h: 250,
      hedge_mwh: "250",
    });

    assert.equal(row.hedge_mwh, 250);
    assert.equal(row.hedge_mw, 0.5);
    assert.equal(row.peak_hedge_mwh, 125);
    assert.equal(row.peak_hedge_mw, 0.5);
    assert.equal(row.percentage, 0.25);
  });

  it("accept creates exactly one Calloff", () => {
    const database = createPocSeedData();

    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      date: "2027-01-15",
      rows: [{ month: "2027-01", hedge_mwh: "615" }],
    });

    assert.equal(result.calloff.calloff_id, "CAL00");
    assert.equal(database.calloffs.size, 1);
    assert.equal(result.calloff.product_id, "PRO02");
    assert.equal(result.calloff.portfolio_id, "CUS02-0");
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-01");
    assert.deepEqual(
      result.transactions.map((transaction) => transaction.transaction_id),
      ["CAL00-000", "CAL00-001", "CAL00-002", "CAL00-003"],
    );
  });

  it("accept creates four transactions per month for base and peak components", () => {
    const database = createPocSeedData();
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-03",
      percentage: "50",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST",
      rows: [
        { month: "2027-01", hedge_mwh: "615" },
        { month: "2027-02", hedge_mwh: "605" },
        { month: "2027-03", hedge_mwh: "555" },
      ],
    });

    assert.equal(result.transactions.length, 12);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-03");
    assert.deepEqual(
      [...new Set(result.transactions.map((transaction) => transaction.month))],
      ["2027-01", "2027-02", "2027-03"],
    );
    assert.deepEqual(
      result.transactions.slice(0, 4).map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component),
      ["base.sys", "base.epad", "peak.modern.sys", "peak.modern.epad"],
    );
  });

  it("base and peak transactions use separate MW formulas and q-factor values", () => {
    const database = createPocSeedData();
    const result = acceptForecastHedgeProfile(database, {
      portfolio_id: "CUS02-0",
      start_month: "2027-01",
      end_month: "2027-01",
      percentage: "50",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST",
      rows: [{ month: "2027-01", hedge_mwh: "615" }],
    });

    const rowsByComponent = new Map(
      result.transactions.map((transaction) => [
        database.productConfigurationComponents.get(transaction.productcomponent_id)?.component,
        transaction,
      ]),
    );

    assert.equal(rowsByComponent.get("base.sys")?.mw, 0.826613);
    assert.equal(rowsByComponent.get("base.epad")?.mw, 0.826613);
    assert.equal(rowsByComponent.get("peak.modern.sys")?.mw, 0.915179);
    assert.equal(rowsByComponent.get("peak.modern.epad")?.mw, 0.915179);
    assert.equal(rowsByComponent.get("base.sys")?.q_factor, 1);
    assert.equal(rowsByComponent.get("base.epad")?.q_factor, 1);
    assert.equal(rowsByComponent.get("peak.modern.sys")?.q_factor, 1.2);
    assert.equal(rowsByComponent.get("peak.modern.epad")?.q_factor, 1.2);
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
          rows: [{ month: "2027-01", hedge_mwh: "615" }],
        }),
      (error) => error instanceof ForecastHedgeError && /missing Q-factor value/.test(error.message),
    );
  });

  it("missing peak q-factor value is rejected", () => {
    const database = createPocSeedData();
    database.qFactorValues.delete("Q22-00");

    assert.throws(
      () =>
        acceptForecastHedgeProfile(database, {
          portfolio_id: "CUS02-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "50",
          date: "2027-01-15",
          calloff_id: "CALLOFF_TEST",
          rows: [{ month: "2027-01", hedge_mwh: "615" }],
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

  it("non-PeaksModern portfolio is rejected", () => {
    assert.throws(
      () =>
        buildForecastHedgeProfile(createPocSeedData(), {
          portfolio_id: "CUS00-0",
          start_month: "2027-01",
          end_month: "2027-01",
          percentage: "50",
        }),
      (error) => error instanceof ForecastHedgeError && /PeaksModern/.test(error.message),
    );
  });

  it("rejects end month before start month", () => {
    assert.throws(() => getForecastHedgeMonthRange("2027-03", "2027-01"), /end_month/);
  });
});
