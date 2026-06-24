import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { insertCalloff, insertTransaction } from "../../src/database/repository.ts";
import {
  getDataViewerRows,
  getDataViewerTables,
  getDataViewerYears,
  getClassicProjectedForecastForPortfolioYear,
  getBaseloadsProjectedTransactionsForPortfolioYear,
  getModernProjectedForecastForPortfolioYear,
  getRawForecastEventDetailsForPortfolioYear,
  getClassicProjectedCalloffsForPortfolioYear,
  getMarketProjectionRowsForPortfolioYear,
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

  it("renders Canonical table selector by default", () => {
    const html = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
    });

    assert.match(html, /Data Viewer perspective/);
    assert.match(html, /name="selected_table"/);
    assert.match(html, /Canonical Raw Calloffs/);
    assert.match(html, /Canonical Raw Transactions/);
    assert.match(html, /Market Projection/);
    assert.match(html, /raw canonical rows and derived projected views/);
    assert.doesNotMatch(html, /Baseloads Projected Transactions/);
    assert.doesNotMatch(html, /Classic Projected Calloffs/);
    assert.doesNotMatch(html, /Modern Projected Calloffs/);
  });

  it("renders projected table selector options for selected perspective views", () => {
    const baseloadsHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_view: "baseloads",
    });
    const classicHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_view: "classic",
    });
    const modernHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_view: "modern",
    });

    assert.match(baseloadsHtml, /Baseloads Projected Transactions/);
    assert.match(classicHtml, /Classic Projected Calloffs/);
    assert.match(modernHtml, /Modern Projected Calloffs/);
    assert.match(modernHtml, /Modern Projected Transactions/);
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
        "forecast-event-details",
        "classic-projected-forecast",
        "modern-projected-forecast",
        "baseloads-projected-transactions",
        "classic-projected-calloffs",
        "classic-projected-transactions",
        "modern-projected-calloffs",
        "modern-projected-transactions",
        "market-projection",
      ],
    );
  });

  it("returns distinguishable Data Viewer view groups", () => {
    assert.deepEqual(
      [...new Set(getDataViewerTables().map((table) => table.view_group_id))].sort(),
      ["market-internal", "projected-customer", "raw-canonical"],
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
    assert.equal(row?.component, "base.sys");
    assert.equal(row?.component_code, "base.sys");
    assert.equal(row?.component_category, "base");
    assert.equal(row?.component_concept, "canonical");
    assert.equal(row?.period, "2027-01");
    assert.equal(row?.mw, 10);
    assert.equal(row?.q_factor, 1);
    assert.equal(row?.quantity, 10);
    assert.equal(row?.quantity_type, "MW");
    assert.equal(row?.price_type, "EUR_PER_MWH");
    assert.equal(row?.factor, 1);
    assert.equal(row?.factor_type, "Q_FACTOR");
    assert.equal(row?.hours, 744);
    assert.equal(row?.mwh, 7440);
  });

  it("Canonical forecast event details expose price-area source forecast rows", () => {
    const rows = getRawForecastEventDetailsForPortfolioYear(createPocSeedData(), "CUS02-0", "2027");

    assert.equal(rows.length, 96);
    assert.equal(rows[0].event_type, "FORECAST");
    assert.equal(rows.some((row) => row.component_code === "base.sto" && row.price_area === "STO"), true);
    assert.equal(rows.some((row) => row.component_code === "base.epad"), false);
  });

  it("Classic and Modern forecast Data Viewer projections use canonical forecast events", () => {
    const database = createPocSeedData();
    const classic = getClassicProjectedForecastForPortfolioYear(database, "CUS02-0", "2027")[0];
    const modern = getModernProjectedForecastForPortfolioYear(database, "CUS02-0", "2027")[0];

    assert.equal(classic.source_event_id, "EVT:FORECAST:CUS02-0:2027-01");
    assert.equal(classic.offpeak_mwh, 615);
    assert.equal(classic.peak_mwh, 615);
    assert.equal(modern.source_event_id, "EVT:FORECAST:CUS02-0:2027-01");
    assert.equal(modern.base_mwh, 1121.470588);
    assert.equal(modern.peak_mwh, 108.529412);
  });

  it("Raw Transactions show currency rows with currency units instead of power units", () => {
    const database = createDataViewerDatabase();
    addCurrencyTransaction(database, "PRO01", "CAL30", 9094.086022, 11.25);
    const row = getRawTransactionsForPortfolioYear(database, "CUS01-0", "2027").find(
      (candidate) => candidate.component_code === "currency.eursek",
    );

    assert.equal(row?.quantity_type, "EUR");
    assert.equal(row?.price_type, "SEK_PER_EUR");
    assert.equal(row?.mwh, null);
    assert.equal(row?.hours, null);
    assert.equal(row?.value_sek, 102308.467747);
    assert.equal(row?.coverage_pct, 1);
  });

  it("Raw Transactions do not emit projected-only component names as source rows", () => {
    const rows = getRawTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027");

    assert.equal(rows.some((row) => row.component.startsWith("modern.") || row.component.startsWith("classic.")), false);
    assert.equal(rows.some((row) => row.component === "allocation.peak.sys"), true);
    assert.equal(rows.every((row) => row.component_concept === "canonical"), true);
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
    assert.equal(rows[0].peak_price, 133.44086);
    assert.equal(rows[0].total_value, 9094.086022);
  });

  it("Baseloads Projected Transactions shows derived base rows without becoming raw canonical data", () => {
    const rows = getBaseloadsProjectedTransactionsForPortfolioYear(createDataViewerDatabase(), "CUS00-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.component),
      ["baseloads.base.epad", "baseloads.base.sys"],
    );
    assert.equal(rows.every((row) => row.component_concept === "projected"), true);
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
    assert.equal(rows.every((row) => row.component_concept === "projected"), true);
    assert.equal(rows.some((row) => row.component === "base.sys" as never), false);
    assert.equal(rows.some((row) => row.component === "peak.sys" as never), false);
    assert.equal(rows.some((row) => row.component === "allocation.peak.sys" as never), false);
  });

  it("Classic and Modern Projected Transactions include currency rows without renaming them", () => {
    const database = createDataViewerDatabase();
    addCurrencyTransaction(database, "PRO01", "CAL30", 9094.086022, 11.25);

    const classicRows = getDataViewerRows(database, "CUS01-0", "classic-projected-transactions", "2027").rows;
    const modernRows = getModernProjectedTransactionsForPortfolioYear(database, "CUS01-0", "2027");

    assert.equal(classicRows.some((row) => "component" in row && row.component === "currency.eursek"), true);
    assert.equal(modernRows.some((row) => row.component === "currency.eursek"), true);
    assert.equal(modernRows.find((row) => row.component === "currency.eursek")?.quantity_type, "EUR");
    assert.equal(modernRows.find((row) => row.component === "currency.eursek")?.price_type, "SEK_PER_EUR");
    assert.equal(modernRows.some((row) => row.component === "modern.currency.eursek"), false);
  });

  it("Classic Projected Transactions use month-level EUR projection values", () => {
    const database = createDataViewerDatabase();
    addSecondClassicMonth(database);

    const rows = getDataViewerRows(database, "CUS01-0", "classic-projected-transactions", "2027").rows;
    const januaryOffpeak = rows.find(
      (row) => "component" in row && row.month === "2027-01" && row.component === "classic.offpeak.sys",
    );
    const februaryOffpeak = rows.find(
      (row) => "component" in row && row.month === "2027-02" && row.component === "classic.offpeak.sys",
    );

    assert.equal(januaryOffpeak && "mwh" in januaryOffpeak ? januaryOffpeak.mwh : undefined, 50);
    assert.equal(januaryOffpeak && "price" in januaryOffpeak ? januaryOffpeak.price : undefined, 85);
    assert.equal(januaryOffpeak && "value_eur" in januaryOffpeak ? januaryOffpeak.value_eur : undefined, 4250);
    assert.equal(februaryOffpeak && "mwh" in februaryOffpeak ? februaryOffpeak.mwh : undefined, 100);
    assert.equal(februaryOffpeak && "value_eur" in februaryOffpeak ? februaryOffpeak.value_eur : undefined, 8500);
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
    assert.equal(peakSys?.price, 109.892473);
    assert.equal(peakEpad?.price, 23.548387);
    assert.equal(round((baseSys?.value ?? 0) + (peakSys?.value ?? 0)), 7489.247312);
    assert.equal(round((baseEpad?.value ?? 0) + (peakEpad?.value ?? 0)), 1604.83871);
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

  it("Market Projection excludes allocation and marks sys/epad as non-additive price dimensions", () => {
    const rows = getMarketProjectionRowsForPortfolioYear(createDataViewerDatabase(), "CUS01-0", "2027");

    assert.deepEqual(
      rows.map((row) => row.component),
      ["base.sys", "base.epad", "peak.sys", "peak.epad"],
    );
    assert.equal(rows.some((row) => row.component.startsWith("allocation.")), false);
    assert.equal(rows.every((row) => row.component_concept === "canonical"), true);
    assert.equal(rows.every((row) => row.dimension_note.includes("not additive physical volume")), true);
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
    const database = createDataViewerDatabase();
    database.calloffs.get("CAL30")!.portfolio_id = "CUS00-0";
    const calloffsHtml = renderHedgingTool(database, {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_view: "modern",
      selected_table: "modern-projected-calloffs",
      selected_year: "2027",
    });
    const transactionsHtml = renderHedgingTool(database, {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_view: "modern",
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
    const database = createDataViewerDatabase();
    database.calloffs.get("CAL30")!.portfolio_id = "CUS00-0";
    const baseloadsHtml = renderHedgingTool(createDataViewerDatabase(), {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_view: "baseloads",
      selected_table: "baseloads-projected-transactions",
      selected_year: "2027",
    });
    const classicHtml = renderHedgingTool(database, {
      portfolio_id: "CUS00-0",
      feature_id: "data-viewer",
      selected_view: "classic",
      selected_table: "classic-projected-calloffs",
      selected_year: "2027",
    });

    assert.match(baseloadsHtml, /baseloads\.base\.sys/);
    assert.match(classicHtml, /offpeak_mwh[\s\S]*peak_mwh/);
    assert.match(classicHtml, /CAL30/);
    assert.match(classicHtml, /Classic Projected Transactions/);
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

  it("requested portfolio does not switch the visible Data Viewer dataset", () => {
    const database = createDataViewerDatabase();
    const html = renderHedgingTool(database, {
      portfolio_id: "CUS02-0",
      feature_id: "data-viewer",
      selected_table: "calloffs",
      selected_year: "2027",
    });

    assert.match(html, /CAL10/);
    assert.doesNotMatch(html, /CAL20/);
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

function addSecondClassicMonth(database: ReturnType<typeof createPocSeedData>): void {
  const februaryCalendar = [...database.calendars.values()].find((row) => row.month === "2027-02");
  assert.ok(februaryCalendar);
  februaryCalendar.total_h = 744;
  februaryCalendar.peak_h = 320;
  const calloff = database.calloffs.get("CAL30");
  assert.ok(calloff);
  calloff.delivery_end_month = "2027-02";

  for (const [index, component, mw, qFactor] of [
    [10, "allocation.peak.sys", 100 / 320, 0],
    [11, "allocation.peak.epad", 100 / 320, 0],
    [12, "base.sys", 200 / 744, 1],
    [13, "base.epad", 200 / 744, 1],
    [14, "peak.sys", 100 / 320 - 200 / 744, 1],
    [15, "peak.epad", 100 / 320 - 200 / 744, 1],
  ] as const) {
    insertTransaction(database, {
      transaction_id: `CAL30-${String(index).padStart(3, "0")}`,
      calloff_id: "CAL30",
      month: "2027-02",
      productcomponent_id: `PRO01:${component}`,
      mw,
      q_factor: qFactor,
    });
  }
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
