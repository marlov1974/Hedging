import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { getBaseloadsCalloffListRows, calculateComponentMwh, calculateComponentMw, calculateWeightedAveragePrice } from "../../src/hedging/calloffList.ts";
import { formatDerivativeName } from "../../src/hedging/derivativeNames.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import { purchaseBaseloads, rebalanceBaseloadsToForecast } from "../../src/purchase/baseloadsPurchase.ts";

describe("Baseloads calloff list", () => {
  it("empty calloff list renders an empty state", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS00-0",
      feature_id: "baseloads-calloff-list",
    });

    assert.match(html, /No Baseloads calloffs/);
  });

  it("quarter calloff renders one row per component", () => {
    const database = seedQuarterCalloff();
    const rows = getBaseloadsCalloffListRows(database, "CUS00-0");

    assert.equal(rows.length, 2);
    assert.deepEqual(
      rows.map((row) => row.component).sort(),
      ["base.epad", "base.sys"],
    );
  });

  it("quarter calloff rows aggregate three monthly transactions per component", () => {
    const database = seedQuarterCalloff();
    const rows = getBaseloadsCalloffListRows(database, "CUS00-0");

    assert.ok(rows.every((row) => row.transaction_count === 3));
  });

  it("MWh uses transaction MW times calendar total hours", () => {
    const database = seedQuarterCalloff();
    const rows = getBaseloadsCalloffListRows(database, "CUS00-0");

    assert.ok(rows.every((row) => row.mwh === 43200));
  });

  it("MW is derived from MWh divided by period hours", () => {
    const database = seedQuarterCalloff();
    const rows = getBaseloadsCalloffListRows(database, "CUS00-0");

    assert.ok(rows.every((row) => row.mw === 20));
  });

  it("calculateComponentMwh works for one component transaction group", () => {
    const database = seedQuarterCalloff();
    const baseSysTransactions = [...database.transactions.values()].filter((transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
      return component?.component === "base.sys";
    });

    assert.equal(calculateComponentMwh(database, baseSysTransactions), 43200);
    assert.equal(calculateComponentMw(database, baseSysTransactions), 20);
  });

  it("price is volume-weighted average from linked price components", () => {
    const database = seedQuarterCalloff();
    const rows = getBaseloadsCalloffListRows(database, "CUS00-0");

    assert.equal(rows.find((row) => row.component === "base.sys")?.price, 45.73);
    assert.equal(rows.find((row) => row.component === "base.epad")?.price, -2.2);
  });

  it("calculateWeightedAveragePrice works for one component transaction group", () => {
    const database = seedQuarterCalloff();
    const baseEpadTransactions = [...database.transactions.values()].filter((transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
      return component?.component === "base.epad";
    });

    assert.equal(calculateWeightedAveragePrice(database, baseEpadTransactions), -2.2);
  });

  it("derivative name helper returns monthly, quarterly and yearly names", () => {
    assert.equal(formatDerivativeName("base.sys", ["2027-01"], "SE3"), "Nordic Electricity Base Load Future Month 2027-01");
    assert.equal(formatDerivativeName("base.epad", ["2027-01"], "SE3"), "Nordic Electricity EPAD SE3 Month 2027-01");
    assert.equal(
      formatDerivativeName("base.sys", ["2027-01", "2027-02", "2027-03"], "SE3"),
      "Nordic Electricity Base Load Future Quarter 2027-Q1",
    );
    assert.equal(
      formatDerivativeName(
        "base.sys",
        ["2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06", "2027-07", "2027-08", "2027-09", "2027-10", "2027-11", "2027-12"],
        "SE3",
      ),
      "Nordic Electricity Base Load Future Year 2027",
    );
  });

  it("UI shows Date, Synthetic Derivative, MWh, MW and Price columns without visible Component column", () => {
    const html = renderHedgingTool(seedQuarterCalloff(), {
      portfolio_id: "CUS00-0",
      feature_id: "baseloads-calloff-list",
    });

    assert.match(html, /Datum/);
    assert.match(html, /Synthetic Derivative/);
    assert.match(html, /MWh/);
    assert.match(html, /MW/);
    assert.match(html, /Pris/);
    assert.match(html, /Nordic Electricity Base Load Future Quarter 2027-Q1/);
    assert.match(html, /Nordic Electricity EPAD SE3 Quarter 2027-Q1/);
    assert.doesNotMatch(html, /<th>Component<\/th>/);
  });

  it("rows expose synthetic derivative names", () => {
    const rows = getBaseloadsCalloffListRows(seedQuarterCalloff(), "CUS00-0");

    assert.deepEqual(
      rows.map((row) => row.synthetic_derivative_name).sort(),
      ["Nordic Electricity Base Load Future Quarter 2027-Q1", "Nordic Electricity EPAD SE3 Quarter 2027-Q1"],
    );
  });

  it("rebalance calloff rows use derivative names assigned at calloff time", () => {
    const database = createPocSeedData();
    rebalanceBaseloadsToForecast(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-15",
      calloff_id: "CAL_REBALANCE_NAME",
    });

    const rows = getBaseloadsCalloffListRows(database, "CUS00-0");

    assert.equal(rows.length, 2);
    assert.equal(rows.every((row) => row.synthetic_derivative_name === "Baseloads Rebalance Month 2027-01 STO"), true);
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
