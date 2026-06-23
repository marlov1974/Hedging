import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  ForecastFeatureError,
  getForecastRowsForYear,
  getForecastYears,
  updateForecastRow,
  validateForecastUpdate,
} from "../../src/hedging/forecastFeature.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("Forecast feature", () => {
  it("renders year dropdown", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "forecast",
    });

    assert.match(html, /name="selected_year"/);
    assert.match(html, /2027/);
  });

  it("renders Month, MWh and Peak % columns", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "forecast",
    });

    assert.match(html, /<th>Month<\/th>/);
    assert.match(html, /<th>MWh<\/th>/);
    assert.match(html, /<th>Peak %<\/th>/);
  });

  it("uses compact forecast table columns without wrapping month cells", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "forecast",
    });

    assert.match(html, /class="forecast-table"/);
    assert.match(html, /<col class="mwh">/);
    assert.match(html, /class="month-cell"/);
  });

  it("shows 12 rows for a populated year", () => {
    const rows = getForecastRowsForYear(createPocSeedData(), "CUS02-0", "2028");

    assert.equal(rows.length, 12);
    assert.equal(rows[0].month, "2028-01");
  });

  it("returns forecast years", () => {
    assert.deepEqual(getForecastYears(createPocSeedData(), "CUS02-0"), ["2027", "2028", "2029"]);
  });

  it("editing MWh updates forecast data", () => {
    const database = createPocSeedData();

    updateForecastRow(database, {
      portfolio_id: "CUS02-0",
      month: "2027-01",
      mwh: "1234.5",
      peak_percent: "55",
    });

    const row = getForecastRowsForYear(database, "CUS02-0", "2027")[0];
    assert.equal(row.mwh, 1234.5);
  });

  it("editing Peak % updates stored decimal peak_pct", () => {
    const database = createPocSeedData();

    updateForecastRow(database, {
      portfolio_id: "CUS02-0",
      month: "2027-01",
      mwh: "1234.5",
      peak_percent: "57.5",
    });

    const row = getForecastRowsForYear(database, "CUS02-0", "2027")[0];
    assert.equal(row.peak_pct, 0.575);
    assert.equal(row.peak_percent, 58);
  });

  it("renders Peak % values as whole numbers", () => {
    const row = getForecastRowsForYear(createPocSeedData(), "CUS02-0", "2027")[0];

    assert.equal(Number.isInteger(row.peak_percent), true);
    assert.equal(row.peak_percent, 50);
  });

  it("rejects invalid MWh", () => {
    assert.throws(
      () =>
        validateForecastUpdate({
          portfolio_id: "CUS02-0",
          month: "2027-01",
          mwh: "-1",
          peak_percent: "50",
        }),
      (error) => error instanceof ForecastFeatureError && /MWh/.test(error.message),
    );
  });

  it("rejects invalid Peak %", () => {
    assert.throws(
      () =>
        validateForecastUpdate({
          portfolio_id: "CUS02-0",
          month: "2027-01",
          mwh: "10",
          peak_percent: "101",
        }),
      (error) => error instanceof ForecastFeatureError && /Peak %/.test(error.message),
    );
  });

  it("rejects non-Peaks.Modern portfolio updates", () => {
    assert.throws(
      () =>
        updateForecastRow(createPocSeedData(), {
          portfolio_id: "CUS00-0",
          month: "2027-01",
          mwh: "10",
          peak_percent: "50",
        }),
      /Forecast is only available for Peaks\.Modern portfolios/,
    );
  });
});
