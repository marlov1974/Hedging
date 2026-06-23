import type { PrototypeDatabase } from "../database/schema.ts";
import type { BaseloadsPurchaseResult } from "../purchase/baseloadsPurchase.ts";
import { getBaseloadsPurchasePeriods } from "../purchase/periodOptions.ts";
import {
  getDataViewerPerspectiveOptions,
  getApplicationFeaturesForPortfolio,
  getPerspectiveOptions,
  resolveActiveFeature,
  type DataViewerPerspectiveId,
  type PerspectiveId,
} from "./applicationConfig.ts";
import { getBaseloadsCalloffListRows } from "./calloffList.ts";
import {
  DataViewerError,
  getDataViewerRows,
  getDataViewerTables,
  getDataViewerYears,
  parseDataViewerTableId,
  type BaseloadsProjectedTransactionRow,
  type DataViewerTableId,
  type ModernProjectedCalloffRow,
  type ModernProjectedTransactionRow,
  type RawCalloffRow,
  type RawTransactionRow,
} from "./dataViewer.ts";
import { calculateFinancialSettlementForMonth, getFinancialSettlementMonths } from "./financialSettlement.ts";
import type { ForecastHedgeAcceptResult, ForecastHedgeProfile } from "./forecastHedge.ts";
import { getForecastRowsForYear, getForecastYears, type ForecastDisplayRow } from "./forecastFeature.ts";
import {
  getPeaksClassicCalloffTransactionRows,
  getPeaksModernCalloffTransactionRows,
  type PeaksClassicCalloffTransactionRow,
} from "./peaksCalloffTransactionList.ts";
import { getPortfolioDetails } from "./portfolioDetails.ts";
import { getPositionReportRows, getPositionReportYears } from "./positionReport.ts";
import { getPortfolioOptions, type HedgingFeatureId, type PortfolioOption } from "./features.ts";

export type HedgingToolState = {
  portfolio_id?: string;
  perspective_id?: PerspectiveId;
  selected_view?: string;
  feature_id?: HedgingFeatureId;
  mw?: string;
  selected_period_id?: string;
  selected_year?: string;
  selected_month?: string;
  selected_table?: string;
  forecast_message?: string;
  forecast_hedge_input?: {
    start_month?: string;
    end_month?: string;
    percentage?: string;
  };
  forecast_hedge_profile?: ForecastHedgeProfile;
  forecast_hedge_result?: ForecastHedgeAcceptResult;
  error?: string;
  purchase_result?: BaseloadsPurchaseResult;
};

const DEMO_PORTFOLIO_ID = "CUS00-0";

export function renderHedgingTool(database: PrototypeDatabase, state: HedgingToolState = {}): string {
  const portfolios = getPortfolioOptions(database);
  const selectedPortfolio = portfolios.find((portfolio) => portfolio.portfolio_id === getDemoPortfolioId(database));
  const applicationConfig = getApplicationFeaturesForPortfolio(database, selectedPortfolio?.portfolio_id);
  const features = applicationConfig.features;
  const requestedFeature = normalizeFeatureId(state.feature_id);
  const activeFeature =
    requestedFeature === "financial-settlement"
      ? "financial-settlement"
      : resolveActiveFeature(database, selectedPortfolio?.portfolio_id, requestedFeature);
  const featurePerspective = state.perspective_id ?? perspectiveForFeatureAlias(state.feature_id);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hedging Tool</title>
  <style>
    :root {
      color-scheme: light;
      --background: #f5f6f8;
      --surface: #ffffff;
      --text: #17202a;
      --muted: #5e6a78;
      --line: #d8dee7;
      --accent: #1457b8;
      --accent-soft: #eef4ff;
      --variant-line: #d8dee7;
      --danger: #b42318;
      --success: #0f7b4f;
    }
    body.variant-peaks-modern {
      --accent: #08705f;
      --accent-soft: #edf8f5;
      --variant-line: #9ed5c9;
    }
    body.variant-peaks-classic {
      --accent: #6d4b0f;
      --accent-soft: #fff7e8;
      --variant-line: #e3c783;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background: var(--background);
      font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(1180px, calc(100% - 24px));
      margin: 0 auto;
      padding: 14px 0 24px;
    }
    h2, h3 { margin: 0; letter-spacing: 0; }
    h2 { font-size: 18px; }
    h3 { font-size: 15px; }
    p { margin: 0; color: var(--muted); }
    .layout {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
    }
    .stack { display: grid; gap: 14px; }
    label { display: grid; gap: 6px; font-weight: 650; }
    select, input {
      width: 100%;
      min-height: 40px;
      border: 1px solid #bec8d5;
      border-radius: 6px;
      padding: 9px 10px;
      font: inherit;
      background: #fff;
      color: var(--text);
    }
    button, .nav-link {
      min-height: 38px;
      border-radius: 6px;
      border: 1px solid var(--line);
      padding: 8px 12px;
      font: inherit;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      background: #fff;
      cursor: pointer;
    }
    button.primary {
      border-color: var(--accent);
      color: #fff;
      background: var(--accent);
    }
    .nav {
      display: grid;
      gap: 8px;
    }
    .nav-link.active {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--accent);
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }
    .app-context {
      border-left: 3px solid var(--variant-line);
      padding-left: 12px;
      max-width: 520px;
    }
    .app-context strong { display: block; }
    .app-context span { color: var(--muted); }
    .compact-selector {
      display: grid;
      grid-template-columns: minmax(180px, 280px);
      gap: 10px;
      align-items: end;
    }
    .demo-summary {
      display: grid;
      gap: 4px;
      max-width: 760px;
    }
    .demo-summary strong { font-size: 15px; }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .tab {
      min-height: 34px;
      border-radius: 6px;
      border: 1px solid var(--line);
      padding: 7px 12px;
      text-decoration: none;
      font-weight: 700;
      color: var(--text);
      background: #fff;
    }
    .tab.active {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--accent);
    }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 18px;
    }
    .kv {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .kv strong { text-align: right; }
    .notice {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: #fbfcfe;
    }
    .error {
      border-color: #f1b8b1;
      background: #fff5f4;
      color: var(--danger);
    }
    .success {
      border-color: #b8dccb;
      background: #f2fbf6;
      color: var(--success);
    }
    .form-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      background: #fff;
    }
    th, td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
    }
    td.number { text-align: right; font-variant-numeric: tabular-nums; }
    .forecast-feature { gap: 8px; }
    .forecast-feature .compact-selector { margin-bottom: 0; }
    .forecast-feature p { font-size: 12px; }
    .forecast-table {
      table-layout: fixed;
      margin-top: 6px;
    }
    .forecast-table col.month { width: 78px; }
    .forecast-table col.base { width: 122px; }
    .forecast-table col.peak { width: 122px; }
    .forecast-table col.total { width: 92px; }
    .forecast-table th,
    .forecast-table td {
      padding: 4px 6px;
      vertical-align: middle;
    }
    .forecast-table th { font-size: 11px; }
    .forecast-table .month-cell {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .forecast-table input {
      min-height: 30px;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .hedge-table {
      table-layout: fixed;
    }
    .hedge-table input {
      min-height: 32px;
      padding: 5px 8px;
    }
    .hedge-table output {
      display: block;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    @media (max-width: 780px) {
      main { width: min(100% - 18px, 1180px); }
      .topbar { display: block; }
      .layout { grid-template-columns: 1fr; }
      .compact-selector { grid-template-columns: 1fr; margin-bottom: 10px; }
      .form-grid { grid-template-columns: 1fr; }
      .details-grid { grid-template-columns: 1fr; }
      table { display: block; overflow-x: auto; }
    }
  </style>
</head>
<body class="variant-${escapeHtml(applicationConfig.accent)}">
  <main>
    <section class="topbar">
      ${renderDemoSummary(selectedPortfolio, applicationConfig.context)}
    </section>
    <section class="layout">
      <aside class="panel stack">
        ${renderFeatureNav(features, selectedPortfolio, activeFeature)}
      </aside>
      <section class="panel stack">
        ${renderActiveFeature(database, selectedPortfolio, activeFeature, { ...state, perspective_id: featurePerspective })}
      </section>
    </section>
  </main>
</body>
</html>`;
}

export function getDemoPortfolioId(database: PrototypeDatabase): string {
  return database.portfolios.has(DEMO_PORTFOLIO_ID) ? DEMO_PORTFOLIO_ID : [...database.portfolios.keys()].sort()[0] ?? "";
}

function renderDemoSummary(selectedPortfolio: PortfolioOption | undefined, context: string): string {
  return `<div class="demo-summary">
    <strong>${escapeHtml(selectedPortfolio?.portfolio_name ?? "Demo portfolio")}</strong>
    <p>${escapeHtml(context)}</p>
  </div>`;
}

function renderFeatureNav(
  features: ReturnType<typeof getAvailableFeaturesForPortfolio>,
  selectedPortfolio: PortfolioOption | undefined,
  activeFeature: HedgingFeatureId,
): string {
  if (!selectedPortfolio) {
    return "";
  }

  return `<nav class="nav" aria-label="Feature navigation">
    ${features
      .map((feature) => {
        const href = `/hedging?portfolio_id=${encodeURIComponent(selectedPortfolio.portfolio_id)}&feature_id=${encodeURIComponent(feature.feature_id)}`;
        const state = feature.feature_id === activeFeature ? " active" : "";
        return `<a class="nav-link${state}" href="${href}">${escapeHtml(feature.label)}</a>`;
      })
      .join("")}
  </nav>`;
}

function renderActiveFeature(
  database: PrototypeDatabase,
  selectedPortfolio: PortfolioOption | undefined,
  activeFeature: HedgingFeatureId,
  state: HedgingToolState,
): string {
  if (!selectedPortfolio) {
    return `<div class="notice"><h2>Select a portfolio</h2><p>Select a portfolio first to open hedging features.</p></div>`;
  }

  const feature = getApplicationFeaturesForPortfolio(database, selectedPortfolio.portfolio_id).features.find(
    (candidate) => candidate.feature_id === activeFeature,
  );
  if (!feature?.available && activeFeature !== "financial-settlement") {
    return `<div class="notice"><h2>${escapeHtml(feature?.label ?? "Feature")}</h2><p>${escapeHtml(feature?.unavailable_reason ?? "Feature is not available.")}</p></div>`;
  }

  if (activeFeature === "calloff-list" || activeFeature === "baseloads-calloff-list") {
    return renderCalloffList(database, selectedPortfolio, state.perspective_id);
  }

  if (activeFeature === "legacy-calloff-list") {
    return renderClassicCalloffTransactionList(database, selectedPortfolio);
  }

  if (activeFeature === "modern-calloff-transaction-list") {
    return renderModernCalloffTransactionList(database, selectedPortfolio);
  }

  if (activeFeature === "portfolio-details") {
    return renderPortfolioDetails(database, selectedPortfolio);
  }

  if (activeFeature === "position-report") {
    return renderPositionReport(database, selectedPortfolio, state, state.perspective_id);
  }

  if (activeFeature === "position") {
    return renderPosition(database, selectedPortfolio, state, state.perspective_id);
  }

  if (activeFeature === "financial-settlement") {
    return renderFinancialSettlement(database, selectedPortfolio, state);
  }

  if (activeFeature === "forecast") {
    return renderForecastFeature(database, selectedPortfolio, state, state.perspective_id);
  }

  if (activeFeature === "forecast-hedge") {
    return renderForecastHedgeFeature(database, selectedPortfolio, state, state.perspective_id);
  }

  if (activeFeature === "data-viewer") {
    return renderDataViewer(database, selectedPortfolio, state);
  }

  return renderBuyBaseloads(selectedPortfolio, state);
}

function renderBuyBaseloads(selectedPortfolio: PortfolioOption, state: HedgingToolState): string {
  const periods = getBaseloadsPurchasePeriods();
  const selectedPeriodId = state.selected_period_id ?? periods[0]?.period_id ?? "";

  return `<div class="stack">
    <div>
      <h2>Buy Baseloads</h2>
      <p>Create a Baseloads call-off and monthly component transactions.</p>
    </div>
    ${state.error ? `<div class="notice error">${escapeHtml(state.error)}</div>` : ""}
    ${state.purchase_result ? `<div class="notice success">Calloff ${escapeHtml(state.purchase_result.calloff.calloff_id)} created with ${state.purchase_result.transactions.length} transactions.</div>` : ""}
    <form method="post" action="/hedging/buy-baseloads" class="stack">
      <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
      <div class="form-grid">
        <label>
          MW quantity
          <input name="mw" type="number" min="0.001" step="0.001" required value="${escapeHtml(state.mw ?? "10")}">
        </label>
        <label>
          Period
          <select name="period_id">
            ${periods.map((period) => `<option value="${escapeHtml(period.period_id)}"${period.period_id === selectedPeriodId ? " selected" : ""}>${escapeHtml(period.label)}</option>`).join("")}
          </select>
        </label>
      </div>
      <button class="primary" type="submit">Confirm purchase</button>
    </form>
  </div>`;
}

function renderCalloffList(
  database: PrototypeDatabase,
  selectedPortfolio: PortfolioOption,
  perspectiveId: PerspectiveId | undefined,
): string {
  const selectedPerspective = perspectiveId ?? "baseloads";
  if (selectedPerspective === "classic") {
    return `<div class="stack">
      ${renderFeaturePerspectiveTabs(selectedPortfolio, "calloff-list", selectedPerspective, getPerspectiveOptions())}
      ${renderClassicCalloffTransactionList(database, selectedPortfolio)}
    </div>`;
  }
  if (selectedPerspective === "modern") {
    return `<div class="stack">
      ${renderFeaturePerspectiveTabs(selectedPortfolio, "calloff-list", selectedPerspective, getPerspectiveOptions())}
      ${renderModernCalloffTransactionList(database, selectedPortfolio)}
    </div>`;
  }

  const rows = getBaseloadsCalloffListRows(database, selectedPortfolio.portfolio_id);
  if (rows.length === 0) {
    return `<div class="stack">
      ${renderFeaturePerspectiveTabs(selectedPortfolio, "calloff-list", selectedPerspective, getPerspectiveOptions())}
      <div class="notice"><h2>Calloff List</h2><p>No Baseloads calloffs for the selected portfolio.</p></div>
    </div>`;
  }

  return `<div class="stack">
    ${renderFeaturePerspectiveTabs(selectedPortfolio, "calloff-list", selectedPerspective, getPerspectiveOptions())}
    <div>
    <h2>Calloff List</h2>
    <table>
      <thead>
        <tr>
          <th>Datum</th>
          <th>Derivatnamn</th>
          <th>MWh</th>
          <th>Pris</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr>
              <td>${escapeHtml(row.date)}</td>
              <td>${escapeHtml(row.derivative_name)}</td>
              <td class="number">${formatNumber(row.mwh)}</td>
              <td class="number">${formatNumber(row.price)}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
    </div>
  </div>`;
}

function renderClassicCalloffTransactionList(database: PrototypeDatabase, selectedPortfolio: PortfolioOption): string {
  const rows = getPeaksClassicCalloffTransactionRows(database, selectedPortfolio.portfolio_id);
  if (rows.length === 0) {
    return `<div class="notice"><h2>Calloff List</h2><p>No Classic-compatible calloffs for the selected portfolio.</p></div>`;
  }

  return `<div>
    <h2>Calloff List</h2>
    <p>Projected Peak/Offpeak values from canonical component transactions.</p>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>OffpeakMWh</th>
          <th>PeakMWh</th>
          <th>OffpeakPrice</th>
          <th>PeakPrice</th>
          <th>Warnings</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr>
              <td>${escapeHtml(row.date)}</td>
              <td class="number">${formatNumber(row.offpeak_mwh)}</td>
              <td class="number">${formatNumber(row.peak_mwh)}</td>
              <td class="number">${formatOptionalNumber(row.offpeak_price)}</td>
              <td class="number">${formatOptionalNumber(row.peak_price)}</td>
              <td>${escapeHtml(row.warnings.join("; "))}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`;
}

function renderModernCalloffTransactionList(database: PrototypeDatabase, selectedPortfolio: PortfolioOption): string {
  const rows = getPeaksModernCalloffTransactionRows(database, selectedPortfolio.portfolio_id);
  if (rows.length === 0) {
    return `<div class="notice"><h2>Calloff List</h2><p>No Modern-compatible calloffs for the selected portfolio.</p></div>`;
  }

  return `<div>
    <h2>Calloff List</h2>
    <p>Projected Base/Peak values from canonical component transactions.</p>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>BaseMWh</th>
          <th>PeakMWh</th>
          <th>BasePrice</th>
          <th>PeakPrice</th>
          <th>Warnings</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr>
              <td>${escapeHtml(row.date)}</td>
              <td class="number">${formatNumber(row.base_mwh)}</td>
              <td class="number">${formatNumber(row.peak_mwh)}</td>
              <td class="number">${formatOptionalNumber(row.base_price)}</td>
              <td class="number">${formatOptionalNumber(row.peak_price)}</td>
              <td>${escapeHtml(row.warnings.join("; "))}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`;
}

function renderPortfolioDetails(database: PrototypeDatabase, selectedPortfolio: PortfolioOption): string {
  const details = getPortfolioDetails(database, selectedPortfolio.portfolio_id);
  if (!details) {
    return `<div class="notice"><h2>Portfolio Details</h2><p>Portfolio details are not available.</p></div>`;
  }

  return `<div class="stack forecast-feature">
    <h2>Portfolio Details</h2>
    <div class="details-grid">
      <div class="kv"><span>Portfolio</span><strong>${escapeHtml(details.portfolio_name)}</strong></div>
      <div class="kv"><span>Customer</span><strong>${escapeHtml(details.customer_name)}</strong></div>
      <div class="kv"><span>Customer no.</span><strong>${escapeHtml(details.customer_number)}</strong></div>
      <div class="kv"><span>Price area</span><strong>${escapeHtml(details.price_area)}</strong></div>
      <div class="kv"><span>Product</span><strong>${escapeHtml(details.product_configuration_name ?? "Unknown")}</strong></div>
      <div class="kv"><span>Calendar</span><strong>${escapeHtml(details.calendar_id)}</strong></div>
    </div>
  </div>`;
}

function renderPositionReport(
  database: PrototypeDatabase,
  selectedPortfolio: PortfolioOption,
  state: HedgingToolState,
  perspectiveId: PerspectiveId | undefined,
): string {
  const years = getPositionReportYears(database, selectedPortfolio.portfolio_id);
  const selectedYear = state.selected_year ?? years[0] ?? "";
  const rows = selectedYear ? getPositionReportRows(database, selectedPortfolio.portfolio_id, selectedYear) : [];
  const selectedPerspective = perspectiveId ?? "baseloads";
  const perspectiveLabel = labelForPerspective(selectedPerspective);

  return `<div class="stack">
    ${renderFeaturePerspectiveTabs(selectedPortfolio, "position-report", selectedPerspective, getPerspectiveOptions(), { selected_year: selectedYear })}
    <div>
      <h2>Position Report</h2>
      <p>Monthly aggregated canonical positions viewed through the selected perspective.</p>
    </div>
    <form method="get" action="/hedging" class="compact-selector">
      <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
      ${renderPerspectiveHidden(selectedPerspective)}
      <input type="hidden" name="feature_id" value="position-report">
      <label>
        Year
        <select name="selected_year">
          ${years.map((year) => `<option value="${escapeHtml(year)}"${year === selectedYear ? " selected" : ""}>${escapeHtml(year)}</option>`).join("")}
        </select>
      </label>
      <button type="submit">Show</button>
    </form>
    ${
      rows.length === 0
        ? `<div class="notice"><p>No positions for ${escapeHtml(selectedYear)}.</p></div>`
        : `<table>
            <thead>
              <tr>
                <th>Månad</th>
                <th>Volym</th>
                <th>Pris</th>
                <th>Component</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `<tr>
                    <td>${escapeHtml(row.month)}</td>
                    <td class="number">${formatNumber(row.volume_mwh)}</td>
                    <td class="number">${formatNumber(row.price)}</td>
                    <td>${escapeHtml(row.component)}</td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>`
    }
  </div>`;
}

function renderPosition(
  database: PrototypeDatabase,
  selectedPortfolio: PortfolioOption,
  state: HedgingToolState,
  perspectiveId: PerspectiveId | undefined,
): string {
  const selectedPerspective = perspectiveId ?? "baseloads";
  const years = getPositionReportYears(database, selectedPortfolio.portfolio_id);
  const selectedYear = state.selected_year ?? years[0] ?? "";
  const rows = selectedYear ? getPositionReportRows(database, selectedPortfolio.portfolio_id, selectedYear) : [];
  return `<div class="stack">
    ${renderFeaturePerspectiveTabs(selectedPortfolio, "position", selectedPerspective, getPerspectiveOptions(), { selected_year: state.selected_year })}
    <div>
      <h2>Position</h2>
      <p>${escapeHtml(labelForPerspective(selectedPerspective))} position view over the same canonical portfolio data.</p>
    </div>
    <form method="get" action="/hedging" class="compact-selector">
      <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
      ${renderPerspectiveHidden(selectedPerspective)}
      <input type="hidden" name="feature_id" value="position">
      <label>
        Year
        <select name="selected_year" onchange="this.form.submit()">
          ${years.map((year) => `<option value="${escapeHtml(year)}"${year === selectedYear ? " selected" : ""}>${escapeHtml(year)}</option>`).join("")}
        </select>
      </label>
    </form>
    ${
      rows.length === 0
        ? `<div class="notice"><p>No positions for ${escapeHtml(selectedYear)}.</p></div>`
        : `<table>
            <thead>
              <tr>
                <th>Månad</th>
                <th>Volym</th>
                <th>Pris</th>
                <th>Component</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `<tr>
                    <td>${escapeHtml(row.month)}</td>
                    <td class="number">${formatNumber(row.volume_mwh)}</td>
                    <td class="number">${formatNumber(row.price)}</td>
                    <td>${escapeHtml(row.component)}</td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>`
    }
  </div>`;
}

function renderFinancialSettlement(
  database: PrototypeDatabase,
  selectedPortfolio: PortfolioOption,
  state: HedgingToolState,
): string {
  const months = getFinancialSettlementMonths(database, selectedPortfolio.portfolio_id);
  const selectedMonth = state.selected_month ?? months[0] ?? "";

  let content = `<div class="notice"><p>No hedge transactions for ${escapeHtml(selectedMonth)}.</p></div>`;
  if (selectedMonth) {
    try {
      const settlement = calculateFinancialSettlementForMonth(database, selectedPortfolio.portfolio_id, selectedMonth);
      content =
        settlement.rows.length === 0
          ? `<div class="notice"><p>No hedge transactions for ${escapeHtml(selectedMonth)}.</p></div>`
          : `<table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Calloff id</th>
                  <th>Derivative name</th>
                  <th>Component group</th>
                  <th>Hedge volume MWh</th>
                  <th>Hedge price</th>
                  <th>Monthly spot price</th>
                  <th>Settlement</th>
                </tr>
              </thead>
              <tbody>
                ${settlement.rows
                  .map(
                    (row) => `<tr>
                      <td>${escapeHtml(row.month)}</td>
                      <td>${escapeHtml(row.calloff_id)}</td>
                      <td>${escapeHtml(row.derivative_name)}</td>
                      <td>${escapeHtml(row.component_group)}</td>
                      <td class="number">${formatNumber(row.hedge_volume_mwh)}</td>
                      <td class="number">${formatNumber(row.hedge_price)}</td>
                      <td class="number">${formatNumber(row.monthly_spot_price)}</td>
                      <td class="number">${formatNumber(row.financial_settlement)}</td>
                    </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Financial settlement calculation failed";
      content = `<div class="notice error">${escapeHtml(message)}</div>`;
    }
  }

  return `<div class="stack">
    <div>
      <h2>Financial Settlement</h2>
      <p>Settlement = hedge_volume_mwh * (monthly_spot_price - hedge_price). Positive value means spot price is above hedge price.</p>
    </div>
    <form method="get" action="/hedging" class="compact-selector">
      <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
      <input type="hidden" name="feature_id" value="financial-settlement">
      <label>
        Month
        <select name="selected_month" onchange="this.form.submit()">
          ${months.map((month) => `<option value="${escapeHtml(month)}"${month === selectedMonth ? " selected" : ""}>${escapeHtml(month)}</option>`).join("")}
        </select>
      </label>
    </form>
    ${content}
  </div>`;
}

function renderForecastFeature(
  database: PrototypeDatabase,
  selectedPortfolio: PortfolioOption,
  state: HedgingToolState,
  perspectiveId: PerspectiveId | undefined,
): string {
  const years = getForecastYears(database, selectedPortfolio.portfolio_id);
  const selectedYear = state.selected_year ?? years[0] ?? "";
  const rows = selectedYear ? getForecastRowsForYear(database, selectedPortfolio.portfolio_id, selectedYear) : [];
  const selectedPerspective = perspectiveId ?? "modern";
  const perspectiveLabel = labelForPerspective(selectedPerspective);

  return `<div class="stack">
    ${renderFeaturePerspectiveTabs(selectedPortfolio, "forecast", selectedPerspective, getPerspectiveOptions(), { selected_year: selectedYear })}
    <div>
      <h2>Forecast</h2>
      <p>Forecast is edited against the canonical model. Modern perspective uses base and peak terms per P0033.</p>
    </div>
    ${state.error ? `<div class="notice error">${escapeHtml(state.error)}</div>` : ""}
    ${state.forecast_message ? `<div class="notice success">${escapeHtml(state.forecast_message)}</div>` : ""}
    <form method="get" action="/hedging" class="compact-selector">
      <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
      ${renderPerspectiveHidden(selectedPerspective)}
      <input type="hidden" name="feature_id" value="forecast">
      <label>
        Year
        <select name="selected_year" onchange="this.form.submit()">
          ${years.map((year) => `<option value="${escapeHtml(year)}"${year === selectedYear ? " selected" : ""}>${escapeHtml(year)}</option>`).join("")}
        </select>
      </label>
    </form>
    ${
      rows.length === 0
        ? `<div class="notice"><p>No forecast rows for ${escapeHtml(selectedYear)}.</p></div>`
        : `<form method="post" action="/hedging/forecast" class="stack">
            <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
            ${renderPerspectiveHidden(selectedPerspective)}
            <input type="hidden" name="selected_year" value="${escapeHtml(selectedYear)}">
            ${renderForecastTable(rows)}
            <button class="primary" type="submit">Save forecast</button>
          </form>`
    }
  </div>`;
}

function renderForecastTable(rows: ForecastDisplayRow[]): string {
  return `<table class="forecast-table">
    <colgroup>
      <col class="month">
      <col class="base">
      <col class="peak">
      <col class="total">
    </colgroup>
    <thead>
      <tr>
        <th>Month</th>
        <th>Base MWh</th>
        <th>Peak MWh</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
            <td class="month-cell">
              ${escapeHtml(row.month)}
              <input type="hidden" name="month" value="${escapeHtml(row.month)}">
            </td>
            <td><input name="modern_base_mwh_${escapeHtml(row.month)}" type="number" min="0" step="0.001" value="${escapeHtml(formatInputNumber(row.modern_base_mwh))}"></td>
            <td><input name="modern_peak_mwh_${escapeHtml(row.month)}" type="number" step="0.001" value="${escapeHtml(formatInputNumber(row.modern_peak_mwh))}"></td>
            <td class="number">${formatNumber(row.mwh)}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}

function renderForecastHedgeFeature(
  database: PrototypeDatabase,
  selectedPortfolio: PortfolioOption,
  state: HedgingToolState,
  perspectiveId: PerspectiveId | undefined,
): string {
  const months = [...database.calendars.values()].map((calendar) => calendar.month).sort();
  const startMonth =
    state.forecast_hedge_profile?.start_month ?? state.forecast_hedge_input?.start_month ?? months[0] ?? "";
  const endMonth =
    state.forecast_hedge_profile?.end_month ?? state.forecast_hedge_input?.end_month ?? months[Math.min(2, months.length - 1)] ?? "";
  const percentage =
    state.forecast_hedge_profile ? String(formatPercentInput(state.forecast_hedge_profile.percentage)) : state.forecast_hedge_input?.percentage ?? "50";
  const selectedPerspective = perspectiveId === "classic" ? "classic" : "modern";
  const perspectiveLabel = labelForPerspective(selectedPerspective);

  return `<div class="stack">
    ${renderFeaturePerspectiveTabs(selectedPortfolio, "forecast-hedge", selectedPerspective, getPerspectiveOptions().filter((option) => option.perspective_id !== "baseloads"))}
    <div>
      <h2>Hedge Forecast</h2>
      <p>Create a monthly hedge profile from a percentage of forecast. Accepted rows are written as canonical transactions.</p>
    </div>
    ${state.error ? `<div class="notice error">${escapeHtml(state.error)}</div>` : ""}
    ${
      state.forecast_hedge_result
        ? `<div class="notice success">Calloff ${escapeHtml(state.forecast_hedge_result.calloff.calloff_id)} created with ${state.forecast_hedge_result.transactions.length} transactions.</div>`
        : ""
    }
    <form method="post" action="/hedging/forecast-hedge/generate" class="stack">
      <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
      ${renderPerspectiveHidden(selectedPerspective)}
      <div class="form-grid">
        <label>
          Start month
          ${renderMonthSelect("start_month", months, startMonth)}
        </label>
        <label>
          End month
          ${renderMonthSelect("end_month", months, endMonth)}
        </label>
        <label>
          Percentage
          <input name="percentage" type="number" min="0" max="100" step="0.001" required value="${escapeHtml(percentage)}">
        </label>
      </div>
      <button type="submit">Build hedge profile</button>
    </form>
    ${state.forecast_hedge_profile ? renderForecastHedgeProfile(selectedPortfolio, state.forecast_hedge_profile, selectedPerspective) : ""}
  </div>`;
}

function renderForecastHedgeProfile(
  selectedPortfolio: PortfolioOption,
  profile: ForecastHedgeProfile,
  perspectiveId: PerspectiveId | undefined,
): string {
  return `<form method="post" action="/hedging/forecast-hedge/accept" class="stack">
    <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
    ${renderPerspectiveHidden(perspectiveId)}
    <input type="hidden" name="start_month" value="${escapeHtml(profile.start_month)}">
    <input type="hidden" name="end_month" value="${escapeHtml(profile.end_month)}">
    <input type="hidden" name="percentage" value="${escapeHtml(String(formatPercentInput(profile.percentage)))}">
    <table class="hedge-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Forecast Base MWh</th>
          <th>Forecast Peak MWh</th>
          <th>Hedge %</th>
          <th>Base MWh</th>
          <th>Base MW</th>
          <th>Peak MWh</th>
          <th>Peak MW</th>
          <th>Total MWh</th>
        </tr>
      </thead>
      <tbody>
        ${profile.rows
          .map(
            (row) => `<tr data-forecast-mwh="${escapeHtml(String(row.forecast_mwh))}" data-calendar-total-h="${escapeHtml(String(row.calendar_total_h))}" data-calendar-peak-h="${escapeHtml(String(row.calendar_peak_h))}">
              <td>
                ${escapeHtml(row.month)}
                <input type="hidden" name="month" value="${escapeHtml(row.month)}">
              </td>
              <td class="number">${formatNumber(row.forecast_modern_base_mwh)}</td>
              <td class="number">${formatNumber(row.forecast_modern_peak_mwh)}</td>
              <td><output data-role="hedge-percent">${formatNumber(row.percentage * 100)}</output></td>
              <td><input name="modern_base_mwh_${escapeHtml(row.month)}" data-role="modern-base-mwh" type="number" min="0" step="0.001" value="${escapeHtml(formatInputNumber(row.modern_base_mwh))}"></td>
              <td><output data-role="modern-base-mw">${formatNumber(row.modern_base_mw)}</output></td>
              <td><input name="modern_peak_mwh_${escapeHtml(row.month)}" data-role="modern-peak-mwh-input" type="number" step="0.001" value="${escapeHtml(formatInputNumber(row.modern_peak_mwh))}"></td>
              <td><output data-role="modern-peak-mw">${formatNumber(row.modern_peak_mw)}</output></td>
              <td><output data-role="total-mwh">${formatNumber(row.total_mwh)}</output></td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <button class="primary" type="submit">Accept hedge profile</button>
    <script>
      document.querySelectorAll('[data-role="modern-base-mwh"], [data-role="modern-peak-mwh-input"]').forEach((input) => {
        input.addEventListener('input', () => {
          const row = input.closest('tr');
          const forecastMwh = Number(row.dataset.forecastMwh);
          const calendarTotalH = Number(row.dataset.calendarTotalH);
          const calendarPeakH = Number(row.dataset.calendarPeakH);
          const modernBaseMwh = Number(row.querySelector('[data-role="modern-base-mwh"]').value);
          const modernPeakMwh = Number(row.querySelector('[data-role="modern-peak-mwh-input"]').value);
          const modernBaseMw = Number.isFinite(modernBaseMwh) && calendarTotalH > 0 ? modernBaseMwh / calendarTotalH : 0;
          const modernPeakMw = Number.isFinite(modernPeakMwh) && calendarPeakH > 0 ? modernPeakMwh / calendarPeakH : 0;
          const totalMwh = (Number.isFinite(modernBaseMwh) ? modernBaseMwh : 0) + (Number.isFinite(modernPeakMwh) ? modernPeakMwh : 0);
          const hedgePercent = forecastMwh > 0 ? (totalMwh / forecastMwh) * 100 : 0;
          row.querySelector('[data-role="modern-base-mw"]').value = modernBaseMw.toLocaleString('en-US', { maximumFractionDigits: 6 });
          row.querySelector('[data-role="modern-peak-mw"]').value = modernPeakMw.toLocaleString('en-US', { maximumFractionDigits: 6 });
          row.querySelector('[data-role="total-mwh"]').value = totalMwh.toLocaleString('en-US', { maximumFractionDigits: 3 });
          row.querySelector('[data-role="hedge-percent"]').value = hedgePercent.toLocaleString('en-US', { maximumFractionDigits: 2 });
        });
      });
    </script>
  </form>`;
}

function renderDataViewer(
  database: PrototypeDatabase,
  selectedPortfolio: PortfolioOption,
  state: HedgingToolState,
): string {
  const selectedView = parseDataViewerPerspectiveId(state.selected_view);
  let selectedTable: DataViewerTableId = defaultTableForDataViewerPerspective(selectedView);
  let error = state.error;
  try {
    selectedTable = parseDataViewerTableId(state.selected_table ?? selectedTable);
  } catch (caught) {
    error = caught instanceof DataViewerError ? caught.message : "Data Viewer failed";
  }

  if (!tableBelongsToDataViewerPerspective(selectedTable, selectedView)) {
    selectedTable = defaultTableForDataViewerPerspective(selectedView);
  }

  const tables = getDataViewerTables().filter((table) => tableBelongsToDataViewerPerspective(table.table_id, selectedView));
  const years = getDataViewerYears(database, selectedPortfolio.portfolio_id, selectedTable);
  const selectedYear = state.selected_year ?? years[0] ?? "";
  let content = `<div class="notice"><p>No rows for selected portfolio and year.</p></div>`;

  if (!error && selectedYear) {
    try {
      const result = getDataViewerRows(database, selectedPortfolio.portfolio_id, selectedTable, selectedYear);
      content = renderDataViewerRows(result.table_id, result.rows);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Data Viewer failed";
      content = `<div class="notice error">${escapeHtml(message)}</div>`;
    }
  }

  return `<div class="stack">
    ${renderDataViewerPerspectiveTabs(selectedPortfolio, selectedView, selectedYear)}
    <div>
      <h2>Data Viewer</h2>
      <p>Canonical raw rows and projected perspective views for the selected portfolio.</p>
    </div>
    ${error ? `<div class="notice error">${escapeHtml(error)}</div>` : ""}
    <form method="get" action="/hedging" class="form-grid">
      <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
      <input type="hidden" name="selected_view" value="${escapeHtml(selectedView)}">
      <input type="hidden" name="feature_id" value="data-viewer">
      <label>
        Table
        <select name="selected_table" onchange="this.form.submit()">
          ${tables.map((table) => `<option value="${escapeHtml(table.table_id)}"${table.table_id === selectedTable ? " selected" : ""}>${escapeHtml(table.label)}</option>`).join("")}
        </select>
      </label>
      <label>
        Delivery year
        <select name="selected_year" onchange="this.form.submit()">
          ${years.map((year) => `<option value="${escapeHtml(year)}"${year === selectedYear ? " selected" : ""}>${escapeHtml(year)}</option>`).join("")}
        </select>
      </label>
    </form>
    ${content}
  </div>`;
}

function renderDataViewerRows(
  tableId: DataViewerTableId,
  rows:
    | RawCalloffRow[]
    | RawTransactionRow[]
    | BaseloadsProjectedTransactionRow[]
    | PeaksClassicCalloffTransactionRow[]
    | ModernProjectedCalloffRow[]
    | ModernProjectedTransactionRow[],
): string {
  if (rows.length === 0) {
    return `<div class="notice"><p>No rows for selected portfolio and year.</p></div>`;
  }

  if (tableId === "calloffs") {
    return renderRawCalloffsTable(rows as RawCalloffRow[]);
  }

  if (tableId === "modern-projected-calloffs") {
    return renderModernProjectedCalloffsTable(rows as ModernProjectedCalloffRow[]);
  }

  if (tableId === "baseloads-projected-transactions") {
    return renderBaseloadsProjectedTransactionsTable(rows as BaseloadsProjectedTransactionRow[]);
  }

  if (tableId === "classic-projected-calloffs") {
    return renderClassicProjectedCalloffsTable(rows as PeaksClassicCalloffTransactionRow[]);
  }

  if (tableId === "modern-projected-transactions") {
    return renderModernProjectedTransactionsTable(rows as ModernProjectedTransactionRow[]);
  }

  return renderRawTransactionsTable(rows as RawTransactionRow[]);
}

function renderRawCalloffsTable(rows: RawCalloffRow[]): string {
  return `<table>
    <thead>
      <tr>
        <th>calloff_id</th>
        <th>product_id</th>
        <th>portfolio_id</th>
        <th>date</th>
        <th>delivery_start_month</th>
        <th>delivery_end_month</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.calloff_id)}</td>
            <td>${escapeHtml(row.product_id)}</td>
            <td>${escapeHtml(row.portfolio_id)}</td>
            <td>${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.delivery_start_month)}</td>
            <td>${escapeHtml(row.delivery_end_month)}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}

function renderRawTransactionsTable(rows: RawTransactionRow[]): string {
  return `<table>
    <thead>
      <tr>
        <th>transaction_id</th>
        <th>calloff_id</th>
        <th>month</th>
        <th>productcomponent_id</th>
        <th>mw</th>
        <th>q_factor</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.transaction_id)}</td>
            <td>${escapeHtml(row.calloff_id)}</td>
            <td>${escapeHtml(row.month)}</td>
            <td>${escapeHtml(row.productcomponent_id)}</td>
            <td class="number">${formatNumber(row.mw)}</td>
            <td class="number">${formatNumber(row.q_factor)}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}

function renderBaseloadsProjectedTransactionsTable(rows: BaseloadsProjectedTransactionRow[]): string {
  return `<table>
    <thead>
      <tr>
        <th>calloff_id</th>
        <th>month</th>
        <th>component</th>
        <th>mwh</th>
        <th>price</th>
        <th>value</th>
        <th>source_component</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.calloff_id)}</td>
            <td>${escapeHtml(row.month)}</td>
            <td>${escapeHtml(row.component)}</td>
            <td class="number">${formatNumber(row.mwh)}</td>
            <td class="number">${formatOptionalNumber(row.price)}</td>
            <td class="number">${formatNumber(row.value)}</td>
            <td>${escapeHtml(row.source_component)}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}

function renderClassicProjectedCalloffsTable(rows: PeaksClassicCalloffTransactionRow[]): string {
  return `<table>
    <thead>
      <tr>
        <th>calloff_id</th>
        <th>date</th>
        <th>period</th>
        <th>offpeak_mwh</th>
        <th>peak_mwh</th>
        <th>offpeak_price</th>
        <th>peak_price</th>
        <th>canonical_total_value</th>
        <th>projected_total_value</th>
        <th>warnings</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.calloff_id)}</td>
            <td>${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.period)}</td>
            <td class="number">${formatNumber(row.offpeak_mwh)}</td>
            <td class="number">${formatNumber(row.peak_mwh)}</td>
            <td class="number">${formatOptionalNumber(row.offpeak_price)}</td>
            <td class="number">${formatOptionalNumber(row.peak_price)}</td>
            <td class="number">${formatNumber(row.canonical_total_value)}</td>
            <td class="number">${formatNumber(row.projected_total_value)}</td>
            <td>${escapeHtml(row.warnings.join("; "))}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}

function renderModernProjectedCalloffsTable(rows: ModernProjectedCalloffRow[]): string {
  return `<table>
    <thead>
      <tr>
        <th>calloff_id</th>
        <th>date</th>
        <th>period_start</th>
        <th>period_end</th>
        <th>base_mwh</th>
        <th>peak_mwh</th>
        <th>base_price</th>
        <th>peak_price</th>
        <th>base_value</th>
        <th>peak_value</th>
        <th>total_value</th>
        <th>warnings</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.calloff_id)}</td>
            <td>${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.period_start)}</td>
            <td>${escapeHtml(row.period_end)}</td>
            <td class="number">${formatNumber(row.base_mwh)}</td>
            <td class="number">${formatNumber(row.peak_mwh)}</td>
            <td class="number">${formatOptionalNumber(row.base_price)}</td>
            <td class="number">${formatOptionalNumber(row.peak_price)}</td>
            <td class="number">${formatNumber(row.base_value)}</td>
            <td class="number">${formatNumber(row.peak_value)}</td>
            <td class="number">${formatNumber(row.total_value)}</td>
            <td>${escapeHtml(row.warnings.join("; "))}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}

function renderModernProjectedTransactionsTable(rows: ModernProjectedTransactionRow[]): string {
  return `<table>
    <thead>
      <tr>
        <th>calloff_id</th>
        <th>month</th>
        <th>component</th>
        <th>mw</th>
        <th>price</th>
        <th>value</th>
        <th>source_components</th>
        <th>warnings</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.calloff_id)}</td>
            <td>${escapeHtml(row.month)}</td>
            <td>${escapeHtml(row.component)}</td>
            <td class="number">${formatOptionalNumber(row.mw)}</td>
            <td class="number">${formatOptionalNumber(row.price)}</td>
            <td class="number">${formatNumber(row.value)}</td>
            <td>${escapeHtml(row.source_components)}</td>
            <td>${escapeHtml(row.warnings.join("; "))}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}

function renderMonthSelect(name: string, months: string[], selectedMonth: string): string {
  return `<select name="${escapeHtml(name)}">
    ${months.map((month) => `<option value="${escapeHtml(month)}"${month === selectedMonth ? " selected" : ""}>${escapeHtml(month)}</option>`).join("")}
  </select>`;
}

function renderFeaturePerspectiveTabs(
  selectedPortfolio: PortfolioOption,
  featureId: HedgingFeatureId,
  selectedPerspective: PerspectiveId,
  options: Array<{ perspective_id: PerspectiveId; label: string }>,
  extraParams: Record<string, string | undefined> = {},
): string {
  return `<nav class="tabs" aria-label="Feature perspective">
    ${options
      .map((option) => {
        const params = new URLSearchParams({
          portfolio_id: selectedPortfolio.portfolio_id,
          feature_id: featureId,
          perspective_id: option.perspective_id,
        });
        for (const [key, value] of Object.entries(extraParams)) {
          if (value) {
            params.set(key, value);
          }
        }
        const active = option.perspective_id === selectedPerspective ? " active" : "";
        return `<a class="tab${active}" href="/hedging?${escapeHtml(params.toString())}">${escapeHtml(option.label)}</a>`;
      })
      .join("")}
  </nav>`;
}

function renderDataViewerPerspectiveTabs(
  selectedPortfolio: PortfolioOption,
  selectedView: DataViewerPerspectiveId,
  selectedYear: string,
): string {
  return `<nav class="tabs" aria-label="Data Viewer perspective">
    ${getDataViewerPerspectiveOptions()
      .map((option) => {
        const params = new URLSearchParams({
          portfolio_id: selectedPortfolio.portfolio_id,
          feature_id: "data-viewer",
          selected_view: option.perspective_id,
          selected_table: defaultTableForDataViewerPerspective(option.perspective_id),
        });
        if (selectedYear) {
          params.set("selected_year", selectedYear);
        }
        const active = option.perspective_id === selectedView ? " active" : "";
        return `<a class="tab${active}" href="/hedging?${escapeHtml(params.toString())}">${escapeHtml(option.label)}</a>`;
      })
      .join("")}
  </nav>`;
}

function parseDataViewerPerspectiveId(value: string | undefined): DataViewerPerspectiveId {
  return getDataViewerPerspectiveOptions().some((option) => option.perspective_id === value)
    ? (value as DataViewerPerspectiveId)
    : "canonical";
}

function normalizeFeatureId(featureId: HedgingFeatureId | undefined): HedgingFeatureId | undefined {
  if (
    featureId === "baseloads-calloff-list" ||
    featureId === "legacy-calloff-list" ||
    featureId === "modern-calloff-transaction-list"
  ) {
    return "calloff-list";
  }
  return featureId;
}

function perspectiveForFeatureAlias(featureId: HedgingFeatureId | undefined): PerspectiveId | undefined {
  if (featureId === "legacy-calloff-list") {
    return "classic";
  }
  if (featureId === "modern-calloff-transaction-list") {
    return "modern";
  }
  if (featureId === "baseloads-calloff-list") {
    return "baseloads";
  }
  return undefined;
}

function defaultTableForDataViewerPerspective(view: DataViewerPerspectiveId): DataViewerTableId {
  if (view === "baseloads") {
    return "baseloads-projected-transactions";
  }
  if (view === "classic") {
    return "classic-projected-calloffs";
  }
  if (view === "modern") {
    return "modern-projected-transactions";
  }
  return "calloffs";
}

function tableBelongsToDataViewerPerspective(tableId: DataViewerTableId, view: DataViewerPerspectiveId): boolean {
  if (view === "canonical") {
    return tableId === "calloffs" || tableId === "transactions";
  }
  if (view === "baseloads") {
    return tableId === "baseloads-projected-transactions";
  }
  if (view === "classic") {
    return tableId === "classic-projected-calloffs";
  }
  return tableId === "modern-projected-calloffs" || tableId === "modern-projected-transactions";
}

function renderPerspectiveHidden(perspectiveId: PerspectiveId | undefined): string {
  return perspectiveId ? `<input type="hidden" name="perspective_id" value="${escapeHtml(perspectiveId)}">` : "";
}

function labelForPerspective(perspectiveId: PerspectiveId | undefined): string {
  if (perspectiveId === "classic") {
    return "Classic";
  }
  if (perspectiveId === "modern") {
    return "Modern";
  }
  return "Baseloads";
}

function formatPercentInput(value: number): number {
  return Math.round(value * 100_000) / 1_000;
}

function formatInputNumber(value: number): string {
  return String(Math.round(value * 1_000) / 1_000);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function formatOptionalNumber(value: number | null): string {
  return value === null ? "" : formatNumber(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
