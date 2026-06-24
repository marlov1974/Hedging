import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { insertCalloff, insertTransaction } from "../../src/database/repository.ts";
import {
  buildBaseloadsPositionReportRowsFromTransactions,
  buildModernPositionReportRowsFromProjectedModelRows,
  calculateMonthlyComponentPosition,
  getClassicPositionReportRows,
  getModernPositionReportRows,
  getMonthlyComponentPositionRows,
  getPositionReportRows,
  getPositionReportYears,
} from "../../src/hedging/positionReport.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
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

  it("Baseloads Position Report returns one row per month", () => {
    const rows = getPositionReportRows(seedQuarterCalloff(), "CUS00-0", "2027", "baseloads");

    assert.equal(rows.length, 3);
    assert.deepEqual(
      rows.map((row) => row.month),
      ["2027-01", "2027-02", "2027-03"],
    );
  });

  it("Baseloads Position Report exposes compressed effective hedge rows", () => {
    const row = getPositionReportRows(seedQuarterCalloff(), "CUS00-0", "2027", "baseloads")[0];

    assert.deepEqual(row, {
      month: "2027-01",
      reportable_base_mwh: 14880,
      hedge_value: 647726.4,
      effective_month_hedge_price: 43.53,
      transaction_count: 2,
    });
  });

  it("Baseloads Position Report counts peak value but not peak volume in effective hedge price", () => {
    const database = createPocSeedData();
    const januaryCalendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
    assert.ok(januaryCalendar);
    januaryCalendar.total_h = 1;
    januaryCalendar.peak_h = 1;
    insertCalloff(database, {
      calloff_id: "CAL_EFFECTIVE",
      product_id: "PRO02",
      portfolio_id: "CUS00-0",
      date: "2027-01-20",
      delivery_start_month: "2027-01",
      delivery_end_month: "2027-01",
    });
    const transactions = [
      insertPricedTransaction(database, "CAL_EFFECTIVE-000", "CAL_EFFECTIVE", "PRO02:base.sys", 100, 100),
      insertPricedTransaction(database, "CAL_EFFECTIVE-001", "CAL_EFFECTIVE", "PRO02:peak.sys", 50, 110),
      insertPricedTransaction(database, "CAL_EFFECTIVE-002", "CAL_EFFECTIVE", "PRO02:peak.sys", -50, 55),
    ];

    assert.deepEqual(buildBaseloadsPositionReportRowsFromTransactions(database, transactions), [
      {
        month: "2027-01",
        reportable_base_mwh: 100,
        hedge_value: 12750,
        effective_month_hedge_price: 127.5,
        transaction_count: 3,
      },
    ]);
  });

  it("Classic Position Report returns one row per month with offpeak and peak EPAD fields", () => {
    const row = getClassicPositionReportRows(seedPeaksCalloff("CUS01-0", "PRO01"), "CUS01-0", "2027")[0];

    assert.deepEqual(row, {
      month: "2027-01",
      offpeak_mwh: 50,
      peak_epad_mwh: 50,
      offpeak_price: 85,
      peak_price: 96.88172,
      power_value_eur: 9094.086022,
      currency_covered_eur: null,
      currency_value_sek: null,
      display_currency: "EUR",
      display_value: 9094.086022,
      coverage_pct: 0,
      warnings: ["missing_currency_row"],
    });
  });

  it("Modern Position Report returns one row per month with base and peak EPAD fields", () => {
    const row = getModernPositionReportRows(seedPeaksCalloff("CUS02-0", "PRO02"), "CUS02-0", "2027")[0];

    assert.deepEqual(row, {
      month: "2027-01",
      base_mwh: 87.735849,
      peak_epad_mwh: 12.264151,
      base_price: 85,
      peak_price: 133.44086,
      power_value_eur: 9094.086022,
      currency_covered_eur: null,
      currency_value_sek: null,
      display_currency: "EUR",
      display_value: 9094.086022,
      coverage_pct: 0,
      warnings: ["missing_currency_row"],
    });
  });

  it("Modern Position Report can be built directly from projected model rows", () => {
    const rows = buildModernPositionReportRowsFromProjectedModelRows([
      projectedRow("2027-01", "modern.base.sys", 10, 100, 70, 7000),
      projectedRow("2027-01", "modern.base.epad", 10, 100, 15, 1500),
      projectedRow("2027-01", "modern.peak.sys", 2, 20, 110, 2200),
      projectedRow("2027-01", "modern.peak.epad", 2, 20, 24, 480),
      {
        ...projectedRow("2027-01", "currency.eursek", null, null, 11.25, 0),
        quantity: 11180,
        quantity_type: "EUR",
        price_type: "SEK_PER_EUR",
        value_eur: null,
        value_sek: 125775,
        value: 125775,
        source_components: "currency.eursek",
      },
    ]);

    assert.deepEqual(rows, [
      {
        month: "2027-01",
        base_mwh: 100,
        peak_epad_mwh: 20,
        base_price: 956.25,
        peak_price: 1507.5,
        power_value_eur: 11180,
        currency_covered_eur: 11180,
        currency_value_sek: 125775,
        display_currency: "SEK",
        display_value: 125775,
        coverage_pct: 1,
        warnings: [],
      },
    ]);
  });

  it("Classic and Modern Position Report use SEK display values when currency coverage exists", () => {
    const modernDatabase = seedPeaksCalloff("CUS02-0", "PRO02");
    addCurrencyTransaction(modernDatabase, "PRO02", "CAL30", 9094.086022, 11.25);
    const classicDatabase = seedPeaksCalloff("CUS01-0", "PRO01");
    addCurrencyTransaction(classicDatabase, "PRO01", "CAL30", 9094.086022, 11.25);

    const modern = getModernPositionReportRows(modernDatabase, "CUS02-0", "2027")[0];
    const classic = getClassicPositionReportRows(classicDatabase, "CUS01-0", "2027")[0];

    assert.equal(modern.display_currency, "SEK");
    assert.equal(classic.display_currency, "SEK");
    assert.equal(modern.coverage_pct, 1);
    assert.equal(classic.coverage_pct, 1);
    assert.equal(modern.base_price, 956.25);
    assert.equal(classic.offpeak_price, 956.25);
    assertApprox(modern.currency_value_sek ?? 0, 102308.467748);
  });

  it("normal Position Report output does not include raw component rows", () => {
    const database = seedPeaksCalloff("CUS02-0", "PRO02");
    database.calloffs.get("CAL30")!.portfolio_id = "CUS00-0";
    const html = renderHedgingTool(database, {
      portfolio_id: "CUS00-0",
      feature_id: "position-report",
      perspective_id: "modern",
      selected_year: "2027",
    });

    assert.match(html, /Peak EPAD MWh/);
    assert.doesNotMatch(html, /allocation\.peak\.sys/);
    assert.doesNotMatch(html, /base\.sys/);
    assert.doesNotMatch(html, /<th>Component<\/th>/);
  });

  it("monthly component helper remains available for raw internal calculations", () => {
    const rows = getMonthlyComponentPositionRows(seedQuarterCalloff(), "CUS00-0", "2027");

    assert.equal(rows.length, 6);
    assert.deepEqual(
      rows.map((row) => `${row.month}|${row.component}`).sort(),
      ["2027-01|base.epad", "2027-01|base.sys", "2027-02|base.epad", "2027-02|base.sys", "2027-03|base.epad", "2027-03|base.sys"],
    );
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
      price: 45.73,
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

function seedPeaksCalloff(portfolioId: string, productId: string) {
  const database = createPocSeedData();
  const januaryCalendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
  assert.ok(januaryCalendar);
  januaryCalendar.total_h = 744;
  januaryCalendar.peak_h = 320;
  setPeaksPrices(database, productId);

  insertCalloff(database, {
    calloff_id: "CAL30",
    product_id: productId,
    portfolio_id: portfolioId,
    date: "2027-01-20",
    delivery_start_month: "2027-01",
    delivery_end_month: "2027-01",
  });

  for (const [index, component, mw, qFactor] of [
    [0, "allocation.peak.sys", 0.15625, 0],
    [1, "allocation.peak.epad", 0.15625, 0],
    [2, "base.sys", 100 / 744, 1],
    [3, "base.epad", 100 / 744, 1],
    [4, "peak.sys", 0.15625 - 100 / 744, 1],
    [5, "peak.epad", 0.15625 - 100 / 744, 1],
  ] as const) {
    insertTransaction(database, {
      transaction_id: `CAL30-${String(index).padStart(3, "0")}`,
      calloff_id: "CAL30",
      month: "2027-01",
      productcomponent_id: `${productId}:${component}`,
      mw,
      q_factor: qFactor,
    });
  }

  return database;
}

function setPeaksPrices(database: ReturnType<typeof createPocSeedData>, productId: string): void {
  const prices = new Map([
    ["base.sys", 70],
    ["base.epad", 15],
    ["peak.sys", 20],
    ["peak.epad", 2],
  ]);

  for (const component of database.productConfigurationComponents.values()) {
    if (component.product_id !== productId) {
      continue;
    }
    const price = prices.get(component.component);
    if (price === undefined) {
      continue;
    }
    const priceComponent = [...database.priceComponents.values()].find(
      (candidate) => candidate.productcomponent_id === component.productcomponent_id,
    );
    assert.ok(priceComponent);
    priceComponent.price = price;
  }
}

function addCurrencyTransaction(
  database: ReturnType<typeof createPocSeedData>,
  productId: string,
  calloffId: string,
  eurAmount: number,
  fxRate: number,
): void {
  insertTransaction(database, {
    transaction_id: `${calloffId}-006`,
    calloff_id: calloffId,
    month: "2027-01",
    productcomponent_id: `${productId}:currency.eursek`,
    mw: 0,
    q_factor: 0,
    quantity: eurAmount,
    quantity_type: "EUR",
    price: fxRate,
    price_type: "SEK_PER_EUR",
    factor: null,
    factor_type: null,
  });
}

function insertPricedTransaction(
  database: ReturnType<typeof createPocSeedData>,
  transactionId: string,
  calloffId: string,
  productComponentId: string,
  mw: number,
  price: number,
) {
  return insertTransaction(database, {
    transaction_id: transactionId,
    calloff_id: calloffId,
    month: "2027-01",
    productcomponent_id: productComponentId,
    mw,
    q_factor: 1,
    quantity: mw,
    quantity_type: "MW",
    price,
    price_type: "EUR_PER_MWH",
    factor: 1,
    factor_type: "Q_FACTOR",
  });
}

function projectedRow(
  month: string,
  component: string,
  mw: number | null,
  mwh: number | null,
  price: number | null,
  valueEur: number | null,
) {
  return {
    calloff_id: "CALX",
    month,
    component,
    component_concept: component === "currency.eursek" ? "reserved" : "projected",
    quantity: mw,
    quantity_type: mw === null ? null : "MW",
    mw,
    mwh,
    price,
    price_type: price === null ? null : "EUR_PER_MWH",
    factor: null,
    factor_type: null,
    value_eur: valueEur,
    value_sek: null,
    value: valueEur ?? 0,
    source_components: component,
    warnings: [],
  } as const;
}

function assertApprox(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} !== ${expected}`);
}
