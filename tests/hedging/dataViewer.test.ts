import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { insertCalloff, insertTransaction } from "../../src/database/repository.ts";
import {
  getDataViewerRows,
  getDataViewerTables,
  getDataViewerYears,
  getModernCalloffsForPortfolioYear,
  getModernTransactionsForPortfolioYear,
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
    assert.match(html, /Calloffs/);
    assert.match(html, /Transactions/);
    assert.match(html, /Modern Calloffs/);
    assert.match(html, /Modern Transactions/);
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
      ["calloffs", "transactions", "modern-calloffs", "modern-transactions"],
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

  it("Modern Calloffs projects Peaks.Classic calloffs as Peaks.Modern compatible rows", () => {
    const rows = getModernCalloffsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.calloff_id),
      ["CAL30"],
    );
    assert.equal(rows[0].source_product_id, "PRO01");
    assert.equal(rows[0].projected_product_package, "Peaks.Modern");
    assert.equal(rows[0].canonical_total_value, rows[0].projected_total_value);
  });

  it("Modern Transactions projects canonical rows into Base and Peak rows", () => {
    const rows = getModernTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.component),
      ["base", "peak"],
    );
    assert.deepEqual(
      rows.map((row) => row.projected_transaction_id),
      ["CAL30:modern.base", "CAL30:modern.peak"],
    );
    assert.equal(rows.every((row) => row.calloff_id === "CAL30"), true);
    assert.equal(rows.some((row) => row.component === "allocation.peak.sys" as never), false);
    assert.equal(rows.reduce((sum, row) => sum + row.value, 0), getModernCalloffsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027")[0].canonical_total_value);
  });

  it("renders Modern projection tables", () => {
    const calloffsHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS01-0",
      feature_id: "data-viewer",
      selected_table: "modern-calloffs",
      selected_year: "2027",
    });
    const transactionsHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS01-0",
      feature_id: "data-viewer",
      selected_table: "modern-transactions",
      selected_year: "2027",
    });

    assert.match(calloffsHtml, /projected_product_package/);
    assert.match(calloffsHtml, /Peaks.Modern/);
    assert.match(transactionsHtml, /projected_transaction_id/);
    assert.match(transactionsHtml, /CAL30:modern.base/);
    assert.doesNotMatch(transactionsHtml, /allocation\.peak\.sys/);
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
    assert.deepEqual(getDataViewerYears(createDataViewerDatabase(), "CUS01-0", "modern-transactions"), ["2027", "2028", "2029"]);
  });
});

function createDataViewerDatabase() {
  const database = createPocSeedData();

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
      productcomponent_id: `PRO01:${component}`,
      mw,
      q_factor: qFactor,
    });
  }

  return database;
}
