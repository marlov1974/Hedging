import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { getBaseloadsCalloffListRows, calculateComponentMwh, calculateWeightedAveragePrice } from "../../src/hedging/calloffList.ts";
import { formatDerivativeName } from "../../src/hedging/derivativeNames.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import { purchaseBaseloads } from "../../src/purchase/baseloadsPurchase.ts";

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

  it("calculateComponentMwh works for one component transaction group", () => {
    const database = seedQuarterCalloff();
    const baseSysTransactions = [...database.transactions.values()].filter((transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
      return component?.component === "base.sys";
    });

    assert.equal(calculateComponentMwh(database, baseSysTransactions), 43200);
  });

  it("price is volume-weighted average from linked price components", () => {
    const database = seedQuarterCalloff();
    const rows = getBaseloadsCalloffListRows(database, "CUS00-0");

    assert.equal(rows.find((row) => row.component === "base.sys")?.price, 80);
    assert.equal(rows.find((row) => row.component === "base.epad")?.price, 5);
  });

  it("calculateWeightedAveragePrice works for one component transaction group", () => {
    const database = seedQuarterCalloff();
    const baseEpadTransactions = [...database.transactions.values()].filter((transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
      return component?.component === "base.epad";
    });

    assert.equal(calculateWeightedAveragePrice(database, baseEpadTransactions), 5);
  });

  it("derivative name helper returns monthly, quarterly and yearly names", () => {
    assert.equal(formatDerivativeName("base.sys", ["2027-01"], "SE3"), "SE3 base.sys Jan-27");
    assert.equal(formatDerivativeName("base.sys", ["2027-01", "2027-02", "2027-03"], "SE3"), "SE3 base.sys Q1-27");
    assert.equal(
      formatDerivativeName(
        "base.sys",
        ["2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06", "2027-07", "2027-08", "2027-09", "2027-10", "2027-11", "2027-12"],
        "SE3",
      ),
      "SE3 base.sys YR-27",
    );
  });

  it("UI shows Datum, Derivatnamn, MWh and Pris columns without visible Component column", () => {
    const html = renderHedgingTool(seedQuarterCalloff(), {
      portfolio_id: "CUS00-0",
      feature_id: "baseloads-calloff-list",
    });

    assert.match(html, /Datum/);
    assert.match(html, /Derivatnamn/);
    assert.match(html, /MWh/);
    assert.match(html, /Pris/);
    assert.match(html, /SE3 base\.sys Q1-27/);
    assert.doesNotMatch(html, /<th>Component<\/th>/);
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
