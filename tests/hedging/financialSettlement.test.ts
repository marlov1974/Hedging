import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  calculateFinancialSettlementForMonth,
  combineSysAndEpadHedgePrice,
  getFinancialSettlementMonths,
  getMonthlySpotActualForSettlement,
} from "../../src/hedging/financialSettlement.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import { purchaseBaseloads } from "../../src/purchase/baseloadsPurchase.ts";

describe("Financial Settlement", () => {
  it("feature menu does not include legacy Financial Settlement", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0" });

    assert.doesNotMatch(html, /Financial Settlement/);
  });

  it("renders month dropdown", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS00-0",
      feature_id: "financial-settlement",
    });

    assert.match(html, /name="selected_month"/);
    assert.match(html, /2027-01/);
  });

  it("returns settlement months from seeded static range", () => {
    const months = getFinancialSettlementMonths(createPocSeedData(), "CUS00-0");

    assert.equal(months[0], "2027-01");
    assert.equal(months[35], "2029-12");
  });

  it("uses monthly_average_price from static spot actuals", () => {
    const database = createDatabaseWithJanuaryHedge();
    const settlement = calculateFinancialSettlementForMonth(database, "CUS00-0", "2027-01");
    const spotActual = getMonthlySpotActualForSettlement("2027-01");

    assert.equal(settlement.monthly_spot_price, spotActual.monthly_average_price);
    assert.equal(settlement.rows[0].monthly_spot_price, spotActual.monthly_average_price);
  });

  it("combines sys and epad into one hedge price", () => {
    const database = createDatabaseWithJanuaryHedge();
    const januaryTransactions = [...database.transactions.values()].filter((transaction) => transaction.month === "2027-01");
    const combined = combineSysAndEpadHedgePrice(database, januaryTransactions);

    assert.deepEqual(combined.components, ["base.epad", "base.sys"]);
    assert.equal(combined.hedge_price, 43.53);
    assert.equal(combined.component_group, "base.sys + base.epad");
  });

  it("does not double-count hedge volume for paired sys and epad rows", () => {
    const database = createDatabaseWithJanuaryHedge();
    const settlement = calculateFinancialSettlementForMonth(database, "CUS00-0", "2027-01");

    assert.equal(settlement.rows[0].hedge_volume_mwh, 7440);
  });

  it("applies financial settlement sign convention formula", () => {
    const database = createDatabaseWithJanuaryHedge();
    const row = calculateFinancialSettlementForMonth(database, "CUS00-0", "2027-01").rows[0];

    assert.equal(row.financial_settlement, row.hedge_volume_mwh * (row.monthly_spot_price - row.hedge_price));
  });

  it("renders sign convention text", () => {
    const html = renderHedgingTool(createDatabaseWithJanuaryHedge(), {
      portfolio_id: "CUS00-0",
      feature_id: "financial-settlement",
      selected_month: "2027-01",
    });

    assert.match(html, /Positive value means spot price is above hedge price/);
  });

  it("missing spot actual gives a clear error", () => {
    assert.throws(
      () => calculateFinancialSettlementForMonth(createDatabaseWithJanuaryHedge(), "CUS00-0", "2031-01"),
      /Missing spot actual for STO 2031-01/,
    );
  });

  it("missing hedge transactions gives clear empty state", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS00-0",
      feature_id: "financial-settlement",
      selected_month: "2027-01",
    });

    assert.match(html, /No hedge transactions for 2027-01/);
  });
});

function createDatabaseWithJanuaryHedge() {
  const database = createPocSeedData();
  purchaseBaseloads(database, {
    portfolio_id: "CUS00-0",
    period_id: "month-2027-01",
    mw: 10,
    date: "2027-01-15",
  });
  return database;
}
