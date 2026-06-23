import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import {
  calculateMonthlyComponentPosition,
  getPositionReportRows,
  getPositionReportYears,
} from "../../src/hedging/positionReport.ts";
import { purchaseBaseloads } from "../../src/purchase/baseloadsPurchase.ts";

describe("Position Report", () => {
  it("renders year dropdown", () => {
    const html = renderHedgingTool(seedQuarterCalloff(), {
      portfolio_id: "CUS00-0",
      feature_id: "position-report",
    });

    assert.match(html, /<select name="selected_year">/);
    assert.match(html, />2027<\/option>/);
    assert.match(html, />2028<\/option>/);
    assert.match(html, />2029<\/option>/);
  });

  it("returns seeded report years", () => {
    assert.deepEqual(getPositionReportYears(createPocSeedData(), "CUS00-0"), ["2027", "2028", "2029"]);
  });

  it("aggregates by month and component", () => {
    const rows = getPositionReportRows(seedQuarterCalloff(), "CUS00-0", "2027");

    assert.equal(rows.length, 6);
    assert.deepEqual(
      rows.map((row) => `${row.month}|${row.component}`).sort(),
      ["2027-01|base.epad", "2027-01|base.sys", "2027-02|base.epad", "2027-02|base.sys", "2027-03|base.epad", "2027-03|base.sys"],
    );
  });

  it("position report volume is summed MWh", () => {
    const rows = getPositionReportRows(seedQuarterCalloff(), "CUS00-0", "2027");

    assert.equal(rows.find((row) => row.month === "2027-01" && row.component === "base.sys")?.volume_mwh, 14880);
    assert.equal(rows.find((row) => row.month === "2027-02" && row.component === "base.sys")?.volume_mwh, 13440);
    assert.equal(rows.find((row) => row.month === "2027-03" && row.component === "base.sys")?.volume_mwh, 14880);
  });

  it("position report price is volume-weighted average", () => {
    const rows = getPositionReportRows(seedQuarterCalloff(), "CUS00-0", "2027");

    assert.equal(rows.find((row) => row.component === "base.sys")?.price, 80);
    assert.equal(rows.find((row) => row.component === "base.epad")?.price, 5);
  });

  it("calculateMonthlyComponentPosition returns one monthly component row", () => {
    const database = seedQuarterCalloff();
    const januaryBaseSys = [...database.transactions.values()].filter((transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
      return transaction.month === "2027-01" && component?.component === "base.sys";
    });

    assert.deepEqual(calculateMonthlyComponentPosition(database, "2027-01|base.sys", januaryBaseSys), {
      month: "2027-01",
      component: "base.sys",
      volume_mwh: 14880,
      price: 80,
      transaction_count: 1,
    });
  });

  it("position report shows empty state for year without positions", () => {
    const html = renderHedgingTool(seedQuarterCalloff(), {
      portfolio_id: "CUS00-0",
      feature_id: "position-report",
      selected_year: "2028",
    });

    assert.match(html, /No positions for 2028/);
  });
});

function seedQuarterCalloff() {
  const database = createPocSeedData();
  purchaseBaseloads(database, {
    portfolio_id: "CUS00-0",
    mw: 20,
    period_id: "quarter-2027-q1",
    date: "2027-01-15",
    calloff_id: "CALLOFF_Q1_2027",
  });
  return database;
}
