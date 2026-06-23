import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { getCalloffWithTransactions } from "../../src/database/repository.ts";
import { renderBaseloadsPurchaseForm } from "../../src/purchase/BaseloadsPurchaseView.ts";
import { PurchaseError, purchaseBaseloads } from "../../src/purchase/baseloadsPurchase.ts";
import { expandPeriodMonths, getBaseloadsPurchasePeriods } from "../../src/purchase/periodOptions.ts";

describe("Baseloads purchase flow", () => {
  it("period dropdown contains 4 years, 11 quarters and 6 months", () => {
    const periods = getBaseloadsPurchasePeriods();

    assert.equal(periods.filter((period) => period.period_type === "year").length, 4);
    assert.equal(periods.filter((period) => period.period_type === "quarter").length, 11);
    assert.equal(periods.filter((period) => period.period_type === "month").length, 6);
    assert.equal(periods[0].label, "Year 2027");
    assert.equal(periods.at(-1)?.label, "Jun 2027");
  });

  it("expands month, quarter and year periods to expected month counts", () => {
    const periods = getBaseloadsPurchasePeriods();

    assert.equal(expandPeriodMonths(requiredPeriod(periods, "month-2027-01")).length, 1);
    assert.equal(expandPeriodMonths(requiredPeriod(periods, "quarter-2027-q1")).length, 3);
    assert.equal(expandPeriodMonths(requiredPeriod(periods, "year-2027")).length, 12);
  });

  it("month purchase creates one calloff and two transactions", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 15,
      period_id: "month-2027-01",
      date: "2027-01-15",
    });

    assert.equal(result.calloff.calloff_id, "CAL00");
    assert.equal(database.calloffs.size, 1);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-01");
    assert.equal(result.transactions.length, 2);
    assert.deepEqual(
      result.transactions.map((transaction) => transaction.transaction_id),
      ["CAL00-000", "CAL00-001"],
    );
  });

  it("quarter purchase creates one calloff and six transactions", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 20,
      period_id: "quarter-2027-q1",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_QUARTER",
    });

    assert.equal(database.calloffs.size, 1);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-03");
    assert.equal(result.transactions.length, 6);
  });

  it("year purchase creates one calloff and twenty-four transactions", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 25,
      period_id: "year-2027",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_YEAR",
    });

    assert.equal(database.calloffs.size, 1);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-12");
    assert.equal(result.transactions.length, 24);
  });

  it("purchases both base.sys and base.epad together", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 15,
      period_id: "month-2027-01",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_COMPONENTS",
    });

    const components = result.transactions
      .map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component)
      .sort();

    assert.deepEqual(components, ["base.epad", "base.sys"]);
  });

  it("sets transaction MW equal to input MW", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 17.5,
      period_id: "quarter-2027-q1",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_MW",
    });

    assert.ok(result.transactions.every((transaction) => transaction.mw === 17.5));
  });

  it("reads q_factor from linked portfolio Q-factor values", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 15,
      period_id: "quarter-2027-q1",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_QFACTOR",
    });

    assert.ok(result.transactions.every((transaction) => transaction.q_factor === 1));
  });

  it("returns calloff with transactions through database repository", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 15,
      period_id: "month-2027-01",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_LOOKUP",
    });

    const result = getCalloffWithTransactions(database, "CALLOFF_TEST_LOOKUP");

    assert.equal(result?.transactions.length, 2);
  });

  it("missing q_factor gives a clear error", () => {
    const database = createPocSeedData();
    const baseSet = [...database.qFactorSets.values()].find((set) => set.component === "base.sys");
    assert.ok(baseSet);
    for (const [id, value] of database.qFactorValues.entries()) {
      if (value.qfactor_set_id === baseSet.qfactor_set_id && value.month === "2027-01") {
        database.qFactorValues.delete(id);
      }
    }

    assert.throws(
      () =>
        purchaseBaseloads(database, {
          portfolio_id: "CUS00-0",
          mw: 15,
          period_id: "month-2027-01",
          date: "2027-01-15",
          calloff_id: "CALLOFF_TEST_MISSING_Q",
        }),
      (error) => error instanceof PurchaseError && error.message.includes("missing Q-factor value"),
    );
  });

  it("rejects invalid MW", () => {
    const database = createPocSeedData();

    assert.throws(
      () =>
        purchaseBaseloads(database, {
          portfolio_id: "CUS00-0",
          mw: 0,
          period_id: "month-2027-01",
          date: "2027-01-15",
        }),
      (error) => error instanceof PurchaseError && error.code === "invalid_input",
    );
  });

  it("rejects portfolio outside the Baseloads flow", () => {
    const database = createPocSeedData();

    assert.throws(
      () =>
        purchaseBaseloads(database, {
          portfolio_id: "CUS01-0",
          mw: 15,
          period_id: "month-2027-01",
          date: "2027-01-15",
        }),
      (error) => error instanceof PurchaseError && error.message.includes("not linked"),
    );
  });

  it("renders a professional Baseloads purchase form", () => {
    const html = renderBaseloadsPurchaseForm(createPocSeedData());

    assert.match(html, /Baseloads Purchase/);
    assert.match(html, /MW quantity/);
    assert.match(html, /Confirm purchase/);
    assert.match(html, /Components: base\.sys \+ base\.epad/);
    assert.match(html, /class="panel summary"/);
  });

  it("successful purchase view shows calloff id and transaction count", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 20,
      period_id: "quarter-2027-q1",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_RESULT",
    });

    const html = renderBaseloadsPurchaseForm(database, { result });

    assert.match(html, /CALLOFF_TEST_RESULT/);
    assert.match(html, /6 transactions/);
  });
});

function requiredPeriod(periods: ReturnType<typeof getBaseloadsPurchasePeriods>, periodId: string) {
  const period = periods.find((candidate) => candidate.period_id === periodId);
  assert.ok(period, `missing period ${periodId}`);
  return period;
}
