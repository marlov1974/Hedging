import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { insertCalloff, insertTransaction } from "../../src/database/repository.ts";
import {
  getDataViewerRows,
  getDataViewerTables,
  getDataViewerYears,
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
      ["calloffs", "transactions"],
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

  return database;
}
