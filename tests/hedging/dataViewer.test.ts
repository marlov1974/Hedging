import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { insertCalloff, insertTransaction } from "../../src/database/repository.ts";
import {
  getDataViewerRows,
  getDataViewerTables,
  getDataViewerYears,
  getBaseloadsProjectedTransactionsForPortfolioYear,
  getClassicProjectedCalloffsForPortfolioYear,
  getModernProjectedCalloffsForPortfolioYear,
  getModernProjectedTransactionsForPortfolioYear,
  getRawCalloffsForPortfolioYear,
  getRawTransactionsForPortfolioYear,
} from "../../src/hedging/dataViewer.ts";
import { getApplicationFeaturesForPortfolio } from "../../src/hedging/applicationConfig.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("Data Viewer", () => {
  it("appears in shared application feature lists", () => {
    const baseloads = getApplicationFeaturesForPortfolio(createDataViewerDatabase(), "CUS00-0").features;
    const peaksModern = getApplicationFeaturesForPortfolio(createDataViewerDatabase(), "CUS02-0").features;

    assert.equal(baseloads.some((feature) => feature.feature_id === "data-viewer" && feature.available), true);
    assert.equal(peaksModern.some((feature) => feature.feature_id === "data-viewer" && feature.available), true);
  });

  it("renders table selector", () => {
    const html = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
    });

    assert.match(html, /name="selected_table"/);
    assert.match(html, /Canonical Raw Calloffs/);
    assert.match(html, /Canonical Raw Transactions/);
    assert.match(html, /Baseloads Projected Transactions/);
    assert.match(html, /Classic Projected Calloffs/);
    assert.match(html, /Modern Projected Calloffs/);
    assert.match(html, /Modern Projected Transactions/);
  });

  it("renders year selector", () => {
    const html = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
    });

    assert.match(html, /name="selected_year"/);
    assert.match(html, /2027/);
    assert.match(html, /2028/);
    assert.match(html, /2029/);
  });

  it("returns supported tables", () => {
    assert.deepEqual(
      getDataViewerTables().map((table) => table.table_id),
      [
        "calloffs",
        "transactions",
        "baseloads-projected-transactions",
        "classic-projected-calloffs",
        "modern-projected-calloffs",
        "modern-projected-transactions",
      ],
    );
  });

  it("Calloffs table shows only calloffs for selected portfolio", () => {
    const rows = getRawCalloffsForPortfolioYear(createDataViewerDatabase(), "CUS00-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.calloff_id),
      ["CAL10"],
    );
    assert.equal(rows.every((row) => row.portfolio_id === "CUS00-0"), true);
  });

  it("Calloffs table filters by delivery start year", () => {
    const rows2028 = getRawCalloffsForPortfolioYear(createDataViewerDatabase(), "CUS00-0", "2028");

    assert.deepEqual(
      rows2028.map((row) => row.calloff_id),
      ["CAL11"],
    );
  });

  it("Transactions table shows only transactions linked to selected portfolio calloffs", () => {
    const rows = getRawTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS00-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.transaction_id),
      ["CAL10-000", "CAL10-001"],
    );
    assert.equal(rows.every((row) => row.calloff_id === "CAL10"), true);
  });

  it("Transactions table filters by transaction month year", () => {
    const rows = getRawTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS00-0", "2028");

    assert.deepEqual(
      rows.map((row) => row.transaction_id),
      ["CAL11-000"],
    );
  });

  it("Transactions table includes raw transaction columns", () => {
    const row = getRawTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS00-0", "2027").find(
      (candidate) => candidate.transaction_id === "CAL10-001",
    );

    assert.equal(row?.transaction_id, "CAL10-001");
    assert.equal(row?.calloff_id, "CAL10");
    assert.equal(row?.month, "2027-01");
    assert.equal(row?.productcomponent_id, "PRO00:base.sys");
    assert.equal(row?.mw, 10);
    assert.equal(row?.q_factor, 1);
  });

  it("Modern Projected Calloffs aggregates projected modern transactions", () => {
    const rows = getModernProjectedCalloffsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.calloff_id),
      ["CAL30"],
    );
    assert.equal(rows[0].date, "2027-01-20");
    assert.equal(rows[0].period_start, "2027-01");
    assert.equal(rows[0].period_end, "2027-01");
    assert.equal(rows[0].base_mwh, 87.735849);
    assert.equal(rows[0].peak_mwh, 12.264151);
    assert.equal(rows[0].base_price, 85);
    assert.equal(rows[0].peak_price, 97.537634);
    assert.equal(rows[0].total_value, 8653.763441);
  });

  it("Baseloads Projected Transactions shows derived base rows without becoming raw canonical data", () => {
    const rows = getBaseloadsProjectedTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS00-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.component),
      ["baseloads.base.epad", "baseloads.base.sys"],
    );
    assert.deepEqual(
      rows.map((row) => row.source_component).sort(),
      ["base.epad", "base.sys"],
    );
    assert.equal(rows[0].calloff_id, "CAL10");
  });

  it("Classic Projected Calloffs shows Peak and Offpeak projection for the same canonical calloff", () => {
    const rows = getClassicProjectedCalloffsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027");

    assert.equal(rows[0].calloff_id, "CAL30");
    assert.equal(rows[0].offpeak_mwh, 50);
    assert.equal(rows[0].peak_mwh, 50);
    assert.equal(rows[0].projected_total_value, rows[0].canonical_total_value);
  });

  it("Modern Projected Transactions uses explicit modern component rows", () => {
    const rows = getModernProjectedTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.component),
      ["modern.base.sys", "modern.base.epad", "modern.peak.sys", "modern.peak.epad"],
    );
    assert.equal(rows.every((row) => row.calloff_id === "CAL30"), true);
    assert.equal(rows.every((row) => row.month === "2027-01"), true);
    assert.equal(rows.some((row) => row.component === "base.sys" as never), false);
    assert.equal(rows.some((row) => row.component === "peak.sys" as never), false);
    assert.equal(rows.some((row) => row.component === "allocation.peak.sys" as never), false);
  });

  it("Modern Projected Transactions calculates MW and prices per dimension", () => {
    const rows = getModernProjectedTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027");
    const baseSys = rows.find((row) => row.component === "modern.base.sys");
    const baseEpad = rows.find((row) => row.component === "modern.base.epad");
    const peakSys = rows.find((row) => row.component === "modern.peak.sys");
    const peakEpad = rows.find((row) => row.component === "modern.peak.epad");

    assert.equal(baseSys?.mw, 0.117925);
    assert.equal(baseEpad?.mw, 0.117925);
    assert.equal(peakSys?.mw, 0.038325);
    assert.equal(peakEpad?.mw, 0.038325);
    assert.notEqual(baseSys?.mw, round(100 / 744));
    assert.notEqual(peakSys?.mw, round(0.15625 - 100 / 744));
    assert.equal(baseSys?.price, 70);
    assert.equal(baseEpad?.price, 15);
    assert.equal(peakSys?.price, 81.397849);
    assert.equal(peakEpad?.price, 16.139785);
    assert.equal(round((baseSys?.value ?? 0) + (peakSys?.value ?? 0)), 7139.784946);
    assert.equal(round((baseEpad?.value ?? 0) + (peakEpad?.value ?? 0)), 1513.978495);
  });

  it("Modern Projected Transactions allows negative modern peak MW", () => {
    const database = createDataViewerDatabase({ allocationPeakMw: 0.109375, peakMw: -0.0250336022 });
    const peakSys = getModernProjectedTransactionsForPortfolioYear(database, "CUS01-0", "2027").find(
      (row) => row.component === "modern.peak.sys",
    );

    assert.ok(peakSys);
    assert.ok((peakSys.mw ?? 0) < 0);
    assert.ok(peakSys.price !== null);
  });

  it("Modern Projected Transactions warns instead of dividing by zero", () => {
    const database = createDataViewerDatabase();
    const calendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
    assert.ok(calendar);
    calendar.peak_h = calendar.total_h;

    const rows = getModernProjectedTransactionsForPortfolioYear(database, "CUS01-0", "2027");

    assert.equal(rows.every((row) => row.mw === null), true);
    assert.match(rows[0].warnings.join("; "), /zero peak or offpeak hours/);
  });

  it("renders Modern projection tables", () => {
    const calloffsHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS01-0",
      feature_id: "data-viewer",
      selected_table: "modern-projected-calloffs",
      selected_year: "2027",
    });
    const transactionsHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS01-0",
      feature_id: "data-viewer",
      selected_table: "modern-projected-transactions",
      selected_year: "2027",
    });

    assert.match(calloffsHtml, /base_mwh/);
    assert.match(calloffsHtml, /total_value/);
    assert.match(transactionsHtml, /calloff_id[\s\S]*month[\s\S]*component[\s\S]*mw[\s\S]*price/);
    assert.match(transactionsHtml, /modern\.base\.sys/);
    assert.doesNotMatch(transactionsHtml, /<td>allocation\.peak\.sys<\/td>/);
  });

  it("renders Baseloads and Classic projection tables", () => {
    const baseloadsHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_table: "baseloads-projected-transactions",
      selected_year: "2027",
    });
    const classicHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS01-0",
      feature_id: "data-viewer",
      selected_table: "classic-projected-calloffs",
      selected_year: "2027",
    });

    assert.match(baseloadsHtml, /baseloads\.base\.sys/);
    assert.match(classicHtml, /offpeak_mwh[\s\S]*peak_mwh/);
    assert.match(classicHtml, /CAL30/);
  });

  it("Calloffs table includes raw calloff columns", () => {
    const row = getRawCalloffsForPortfolioYear(createDataViewerDatabase(), "CUS00-0", "2027")[0];

    assert.equal(row.calloff_id, "CAL10");
    assert.equal(row.product_id, "PRO00");
    assert.equal(row.portfolio_id, "CUS00-0");
    assert.equal(row.date, "2027-01-15");
    assert.equal(row.delivery_start_month, "2027-01");
    assert.equal(row.delivery_end_month, "2027-01");
  });

  it("empty state renders when no rows exist", () => {
    const html = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS02-0",
      feature_id: "data-viewer",
      selected_table: "calloffs",
      selected_year: "2029",
    });

    assert.match(html, /No rows for selected portfolio and year/);
  });

  it("switching selected portfolio changes visible rows", () => {
    const database = createDataViewerDatabase();
    const baseloadsHtml = renderHedgingTool(database, {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_table: "calloffs",
      selected_year: "2027",
    });
    const peaksHtml = renderHedgingTool(database, {
      portfolio_id: "CUS02-0",
      feature_id: "data-viewer",
      selected_table: "calloffs",
      selected_year: "2027",
    });

    assert.match(baseloadsHtml, /CAL10/);
    assert.doesNotMatch(baseloadsHtml, /CAL20/);
    assert.match(peaksHtml, /CAL20/);
    assert.doesNotMatch(peaksHtml, /CAL10/);
  });

  it("no rows from other portfolios leak into the table", () => {
    const result = getDataViewerRows(createDataViewerDatabase(), "CUS02-0", "transactions", "2027");
    const transactionRows = result.rows;

    assert.equal(transactionRows.some((row) => "calloff_id" in row && row.calloff_id === "CAL10"), false);
  });

  it("returns data-derived years plus seed years", () => {
    assert.deepEqual(getDataViewerYears(createDataViewerDatabase(), "CUS00-0", "calloffs"), ["2027", "2028", "2029"]);
    assert.deepEqual(getDataViewerYears(createDataViewerDatabase(), "CUS01-0", "modern-projected-transactions"), ["2027", "2028", "2029"]);
  });
});

function createDataViewerDatabase(
  overrides: Partial<{
    allocationPeakMw: number;
    peakMw: number;
  }> = {},
) {
  const database = createPocSeedData();
  const januaryCalendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
  assert.ok(januaryCalendar);
  januaryCalendar.total_h = 744;
  januaryCalendar.peak_h = 320;
  setPeaksClassicPrices(database);

  insertCalloff(database, {
    calloff_id: "CAL10",
    product_id: "PRO00",
    portfolio_id: "CUS00-0",
    date: "2027-01-15",
    delivery_start_month: "2027-01",
    delivery_end_month: "2027-01",
  });
  insertCalloff(database, {
    calloff_id: "CAL30",
    product_id: "PRO01",
    portfolio_id: "CUS01-0",
    date: "2027-01-20",
    delivery_start_month: "2027-01",
    delivery_end_month: "2027-01",
  });
  insertCalloff(database, {
    calloff_id: "CAL11",
    product_id: "PRO00",
    portfolio_id: "CUS00-0",
    date: "2027-01-15",
    delivery_start_month: "2028-01",
    delivery_end_month: "2028-01",
  });
  insertCalloff(database, {
    calloff_id: "CAL20",
    product_id: "PRO02",
    portfolio_id: "CUS02-0",
    date: "2027-02-15",
    delivery_start_month: "2027-02",
    delivery_end_month: "2027-02",
  });

  insertTransaction(database, {
    transaction_id: "CAL10-001",
    calloff_id: "CAL10",
    month: "2027-01",
    productcomponent_id: "PRO00:base.sys",
    mw: 10,
    q_factor: 1,
  });
  insertTransaction(database, {
    transaction_id: "CAL10-000",
    calloff_id: "CAL10",
    month: "2027-01",
    productcomponent_id: "PRO00:base.epad",
    mw: 10,
    q_factor: 1,
  });
  insertTransaction(database, {
    transaction_id: "CAL11-000",
    calloff_id: "CAL11",
    month: "2028-01",
    productcomponent_id: "PRO00:base.sys",
    mw: 11,
    q_factor: 1,
  });
  insertTransaction(database, {
    transaction_id: "CAL20-000",
    calloff_id: "CAL20",
    month: "2027-02",
    productcomponent_id: "PRO02:base.sys",
    mw: 12,
    q_factor: 1,
  });
  for (const [index, component, mw, qFactor] of [
    [0, "allocation.peak.sys", overrides.allocationPeakMw ?? 0.15625, 0],
    [1, "allocation.peak.epad", overrides.allocationPeakMw ?? 0.15625, 0],
    [2, "base.sys", 100 / 744, 1],
    [3, "base.epad", 100 / 744, 1],
    [4, "peak.sys", overrides.peakMw ?? 0.15625 - 100 / 744, 1],
    [5, "peak.epad", overrides.peakMw ?? 0.15625 - 100 / 744, 1],
  ] as const) {
    insertTransaction(database, {
      transaction_id: `CAL30-${String(index).padStart(3, "0")}`,
      calloff_id: "CAL30",
      month: "2027-01",
      productcomponent_id: `PRO01:${component}`,
      mw,
      q_factor: qFactor,
    });
  }

  return database;
}

function setPeaksClassicPrices(database: ReturnType<typeof createPocSeedData>): void {
  const prices = new Map([
    ["base.sys", 70],
    ["base.epad", 15],
    ["peak.sys", 20],
    ["peak.epad", 2],
  ]);

  for (const component of database.productConfigurationComponents.values()) {
    if (component.product_id !== "PRO01") {
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

function round(value: number): number {
  return Number(value.toFixed(6));
}
