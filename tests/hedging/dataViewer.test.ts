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
    const baseloads = getApplicationFeaturesForPortfolio(createDataViewerDatabase(), "PORT_BASELOADS").features;
    const peaksModern = getApplicationFeaturesForPortfolio(createDataViewerDatabase(), "PORT_PEAKS_MODERN").features;

    assert.equal(baseloads.some((feature) => feature.feature_id === "data-viewer" && feature.available), true);
    assert.equal(peaksModern.some((feature) => feature.feature_id === "data-viewer" && feature.available), true);
  });

  it("renders table selector", () => {
    const html = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "PORT_BASELOADS",
      feature_id: "data-viewer",
    });

    assert.match(html, /name="selected_table"/);
    assert.match(html, /Calloffs/);
    assert.match(html, /Transactions/);
  });

  it("renders year selector", () => {
    const html = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "PORT_BASELOADS",
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
    const rows = getRawCalloffsForPortfolioYear(createDataViewerDatabase(), "PORT_BASELOADS", "2027");

    assert.deepEqual(
      rows.map((row) => row.calloff_id),
      ["CALLOFF_BASELOADS_2027"],
    );
    assert.equal(rows.every((row) => row.portfolio_id === "PORT_BASELOADS"), true);
  });

  it("Calloffs table filters by calloff date year", () => {
    const rows2028 = getRawCalloffsForPortfolioYear(createDataViewerDatabase(), "PORT_BASELOADS", "2028");

    assert.deepEqual(
      rows2028.map((row) => row.calloff_id),
      ["CALLOFF_BASELOADS_2028"],
    );
  });

  it("Transactions table shows only transactions linked to selected portfolio calloffs", () => {
    const rows = getRawTransactionsForPortfolioYear(createDataViewerDatabase(), "PORT_BASELOADS", "2027");

    assert.deepEqual(
      rows.map((row) => row.transaction_id),
      ["TX_BASELOADS_2027_EPAD", "TX_BASELOADS_2027_SYS"],
    );
    assert.equal(rows.every((row) => row.calloff_id === "CALLOFF_BASELOADS_2027"), true);
  });

  it("Transactions table filters by transaction month year", () => {
    const rows = getRawTransactionsForPortfolioYear(createDataViewerDatabase(), "PORT_BASELOADS", "2028");

    assert.deepEqual(
      rows.map((row) => row.transaction_id),
      ["TX_BASELOADS_2028_SYS"],
    );
  });

  it("Transactions table includes raw transaction columns", () => {
    const row = getRawTransactionsForPortfolioYear(createDataViewerDatabase(), "PORT_BASELOADS", "2027").find(
      (candidate) => candidate.transaction_id === "TX_BASELOADS_2027_SYS",
    );

    assert.equal(row?.transaction_id, "TX_BASELOADS_2027_SYS");
    assert.equal(row?.calloff_id, "CALLOFF_BASELOADS_2027");
    assert.equal(row?.month, "2027-01");
    assert.equal(row?.productcomponent_id, "PRODUCT_BASELOADS:base_sys");
    assert.equal(row?.mw, 10);
    assert.equal(row?.q_factor, 1);
  });

  it("Calloffs table includes raw calloff columns", () => {
    const row = getRawCalloffsForPortfolioYear(createDataViewerDatabase(), "PORT_BASELOADS", "2027")[0];

    assert.equal(row.calloff_id, "CALLOFF_BASELOADS_2027");
    assert.equal(row.product_id, "PRODUCT_BASELOADS");
    assert.equal(row.portfolio_id, "PORT_BASELOADS");
    assert.equal(row.date, "2027-01-15");
  });

  it("empty state renders when no rows exist", () => {
    const html = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "PORT_PEAKS_MODERN",
      feature_id: "data-viewer",
      selected_table: "calloffs",
      selected_year: "2029",
    });

    assert.match(html, /No rows for selected portfolio and year/);
  });

  it("switching selected portfolio changes visible rows", () => {
    const database = createDataViewerDatabase();
    const baseloadsHtml = renderHedgingTool(database, {
      portfolio_id: "PORT_BASELOADS",
      feature_id: "data-viewer",
      selected_table: "calloffs",
      selected_year: "2027",
    });
    const peaksHtml = renderHedgingTool(database, {
      portfolio_id: "PORT_PEAKS_MODERN",
      feature_id: "data-viewer",
      selected_table: "calloffs",
      selected_year: "2027",
    });

    assert.match(baseloadsHtml, /CALLOFF_BASELOADS_2027/);
    assert.doesNotMatch(baseloadsHtml, /CALLOFF_PEAKS_2027/);
    assert.match(peaksHtml, /CALLOFF_PEAKS_2027/);
    assert.doesNotMatch(peaksHtml, /CALLOFF_BASELOADS_2027/);
  });

  it("no rows from other portfolios leak into the table", () => {
    const result = getDataViewerRows(createDataViewerDatabase(), "PORT_PEAKS_MODERN", "transactions", "2027");
    const transactionRows = result.rows;

    assert.equal(transactionRows.some((row) => "calloff_id" in row && row.calloff_id === "CALLOFF_BASELOADS_2027"), false);
  });

  it("returns data-derived years plus seed years", () => {
    assert.deepEqual(getDataViewerYears(createDataViewerDatabase(), "PORT_BASELOADS", "calloffs"), ["2027", "2028", "2029"]);
  });
});

function createDataViewerDatabase() {
  const database = createPocSeedData();

  insertCalloff(database, {
    calloff_id: "CALLOFF_BASELOADS_2027",
    product_id: "PRODUCT_BASELOADS",
    portfolio_id: "PORT_BASELOADS",
    date: "2027-01-15",
  });
  insertCalloff(database, {
    calloff_id: "CALLOFF_BASELOADS_2028",
    product_id: "PRODUCT_BASELOADS",
    portfolio_id: "PORT_BASELOADS",
    date: "2028-01-15",
  });
  insertCalloff(database, {
    calloff_id: "CALLOFF_PEAKS_2027",
    product_id: "PRODUCT_PEAKS_MODERN",
    portfolio_id: "PORT_PEAKS_MODERN",
    date: "2027-02-15",
  });

  insertTransaction(database, {
    transaction_id: "TX_BASELOADS_2027_SYS",
    calloff_id: "CALLOFF_BASELOADS_2027",
    month: "2027-01",
    productcomponent_id: "PRODUCT_BASELOADS:base_sys",
    mw: 10,
    q_factor: 1,
  });
  insertTransaction(database, {
    transaction_id: "TX_BASELOADS_2027_EPAD",
    calloff_id: "CALLOFF_BASELOADS_2027",
    month: "2027-01",
    productcomponent_id: "PRODUCT_BASELOADS:base_epad",
    mw: 10,
    q_factor: 1,
  });
  insertTransaction(database, {
    transaction_id: "TX_BASELOADS_2028_SYS",
    calloff_id: "CALLOFF_BASELOADS_2028",
    month: "2028-01",
    productcomponent_id: "PRODUCT_BASELOADS:base_sys",
    mw: 11,
    q_factor: 1,
  });
  insertTransaction(database, {
    transaction_id: "TX_PEAKS_2027_SYS",
    calloff_id: "CALLOFF_PEAKS_2027",
    month: "2027-02",
    productcomponent_id: "PRODUCT_PEAKS_MODERN:base_sys",
    mw: 12,
    q_factor: 1,
  });

  return database;
}
