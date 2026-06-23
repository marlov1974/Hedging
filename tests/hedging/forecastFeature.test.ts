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

  it("renders Month, Base MWh and Peak MWh columns", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "forecast",
    });

    assert.match(html, /<th>Month<\/th>/);
    assert.match(html, /<th>Base MWh<\/th>/);
    assert.match(html, /<th>Peak MWh<\/th>/);
    assert.doesNotMatch(html, /name="mwh_2027-01"/);
    assert.doesNotMatch(html, /name="peak_percent_2027-01"/);
  });

  it("uses compact forecast table columns without wrapping month cells", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "forecast",
    });

    assert.match(html, /class="forecast-table"/);
    assert.match(html, /<col class="base">/);
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

  it("displays forecast in modern base and peak MWh", () => {
    const row = getForecastRowsForYear(createPocSeedData(), "CUS02-0", "2027")[0];

    assert.equal(row.mwh, 1230);
    assert.equal(row.peak_pct, 0.5);
    assert.equal(row.modern_base_mwh, 1121.470588);
    assert.equal(row.modern_peak_mwh, 108.529412);
  });

  it("editing Modern Base MWh and Modern Peak MWh updates stored forecast data", () => {
    const database = createPocSeedData();
    const calendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
    assert.ok(calendar);
    calendar.total_h = 744;
    calendar.peak_h = 320;

    updateForecastRow(database, {
      portfolio_id: "CUS02-0",
      month: "2027-01",
      modern_base_mwh: "87.735849",
      modern_peak_mwh: "12.264151",
    });

    const row = getForecastRowsForYear(database, "CUS02-0", "2027")[0];
    assert.equal(row.mwh, 100);
    assert.equal(row.peak_pct, 0.5);
    assert.equal(row.modern_base_mwh, 87.735849);
    assert.equal(row.modern_peak_mwh, 12.264151);
  });

  it("editing negative Modern Peak MWh is allowed when total and peak level stay valid", () => {
    const database = createPocSeedData();

    updateForecastRow(database, {
      portfolio_id: "CUS02-0",
      month: "2027-01",
      modern_base_mwh: "110",
      modern_peak_mwh: "-10",
    });

    const row = getForecastRowsForYear(database, "CUS02-0", "2027")[0];
    assert.equal(row.mwh, 100);
    assert.ok(Math.abs(row.modern_peak_mwh - -10) < 0.001);
  });

  it("renders Peak % values as whole numbers", () => {
    const row = getForecastRowsForYear(createPocSeedData(), "CUS02-0", "2027")[0];

    assert.equal(Number.isInteger(row.peak_percent), true);
    assert.equal(row.peak_percent, 50);
  });

  it("rejects invalid Modern Base MWh", () => {
    const database = createPocSeedData();
    assert.throws(
      () =>
        validateForecastUpdate(database, {
          portfolio_id: "CUS02-0",
          month: "2027-01",
          modern_base_mwh: "-1",
          modern_peak_mwh: "0",
        }),
      (error) => error instanceof ForecastFeatureError && /Modern Base MWh/.test(error.message),
    );
  });

  it("rejects invalid Modern Peak MWh that makes total invalid", () => {
    const database = createPocSeedData();
    assert.throws(
      () =>
        validateForecastUpdate(database, {
          portfolio_id: "CUS02-0",
          month: "2027-01",
          modern_base_mwh: "10",
          modern_peak_mwh: "-20",
        }),
      (error) => error instanceof ForecastFeatureError && /total MWh/.test(error.message),
    );
  });

  it("rejects non-Peaks.Modern portfolio updates", () => {
    assert.throws(
      () =>
        updateForecastRow(createPocSeedData(), {
          portfolio_id: "CUS00-0",
          month: "2027-01",
          modern_base_mwh: "10",
          modern_peak_mwh: "0",
        }),
      /Forecast is only available for Peaks\.Modern portfolios/,
    );
  });
});
