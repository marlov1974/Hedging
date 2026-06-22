import type { PrototypeDatabase } from "../database/schema.ts";
import type { BaseloadsPurchaseResult } from "../purchase/baseloadsPurchase.ts";
import { getBaseloadsPurchasePeriods } from "../purchase/periodOptions.ts";
import { getBaseloadsCalloffListRows } from "./calloffList.ts";
import { getPortfolioDetails } from "./portfolioDetails.ts";
import { getPositionReportRows, getPositionReportYears } from "./positionReport.ts";
import {
  getAvailableFeaturesForPortfolio,
  getPortfolioOptions,
  type HedgingFeatureId,
  type PortfolioOption,
} from "./features.ts";

export type HedgingToolState = {
  portfolio_id?: string;
  feature_id?: HedgingFeatureId;
  mw?: string;
  selected_period_id?: string;
  selected_year?: string;
  error?: string;
  purchase_result?: BaseloadsPurchaseResult;
};

export function renderHedgingTool(database: PrototypeDatabase, state: HedgingToolState = {}): string {
  const portfolios = getPortfolioOptions(database);
  const selectedPortfolio = portfolios.find((portfolio) => portfolio.portfolio_id === state.portfolio_id);
  const features = getAvailableFeaturesForPortfolio(database, selectedPortfolio?.portfolio_id);
  const activeFeature = state.feature_id ?? "portfolio-details";

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
      --danger: #b42318;
      --success: #0f7b4f;
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
    h1, h2, h3 { margin: 0; letter-spacing: 0; }
    h1 { font-size: 20px; line-height: 1.15; }
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
    .compact-selector {
      display: grid;
      grid-template-columns: minmax(180px, 280px) auto;
      gap: 10px;
      align-items: end;
    }
    .selected-name { color: var(--muted); font-weight: 650; }
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
<body>
  <main>
    <section class="topbar">
      ${renderPortfolioSelector(portfolios, selectedPortfolio, activeFeature)}
      <span class="selected-name">${selectedPortfolio ? escapeHtml(selectedPortfolio.portfolio_name) : "No portfolio selected"}</span>
    </section>
    <section class="layout">
      <aside class="panel stack">
        ${renderFeatureNav(features, selectedPortfolio, activeFeature)}
      </aside>
      <section class="panel stack">
        ${renderActiveFeature(database, selectedPortfolio, activeFeature, state)}
      </section>
    </section>
  </main>
</body>
</html>`;
}

function renderPortfolioSelector(portfolios: PortfolioOption[], selectedPortfolio: PortfolioOption | undefined, activeFeature: HedgingFeatureId): string {
  return `<form method="get" action="/hedging" class="compact-selector">
    <input type="hidden" name="feature_id" value="${escapeHtml(activeFeature)}">
    <label>
      Portfolio
      <select name="portfolio_id" onchange="this.form.submit()">
        <option value="">Select portfolio</option>
        ${portfolios
          .map((portfolio) => `<option value="${escapeHtml(portfolio.portfolio_id)}"${portfolio.portfolio_id === selectedPortfolio?.portfolio_id ? " selected" : ""}>${escapeHtml(portfolio.portfolio_name)}</option>`)
          .join("")}
      </select>
    </label>
    <button type="submit">Open</button>
  </form>`;
}

function renderFeatureNav(features: ReturnType<typeof getAvailableFeaturesForPortfolio>, selectedPortfolio: PortfolioOption | undefined, activeFeature: HedgingFeatureId): string {
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

  const feature = getAvailableFeaturesForPortfolio(database, selectedPortfolio.portfolio_id).find(
    (candidate) => candidate.feature_id === activeFeature,
  );
  if (!feature?.available) {
    return `<div class="notice"><h2>${escapeHtml(feature?.label ?? "Feature")}</h2><p>${escapeHtml(feature?.unavailable_reason ?? "Feature is not available.")}</p></div>`;
  }

  if (activeFeature === "baseloads-calloff-list") {
    return renderCalloffList(database, selectedPortfolio);
  }

  if (activeFeature === "portfolio-details") {
    return renderPortfolioDetails(database, selectedPortfolio);
  }

  if (activeFeature === "position-report") {
    return renderPositionReport(database, selectedPortfolio, state);
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

function renderCalloffList(database: PrototypeDatabase, selectedPortfolio: PortfolioOption): string {
  const rows = getBaseloadsCalloffListRows(database, selectedPortfolio.portfolio_id);
  if (rows.length === 0) {
    return `<div class="notice"><h2>Baseloads Calloff List</h2><p>No Baseloads calloffs for the selected portfolio.</p></div>`;
  }

  return `<div>
    <h2>Baseloads Calloff List</h2>
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
  </div>`;
}

function renderPortfolioDetails(database: PrototypeDatabase, selectedPortfolio: PortfolioOption): string {
  const details = getPortfolioDetails(database, selectedPortfolio.portfolio_id);
  if (!details) {
    return `<div class="notice"><h2>Portfolio Details</h2><p>Portfolio details are not available.</p></div>`;
  }

  return `<div class="stack">
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

function renderPositionReport(database: PrototypeDatabase, selectedPortfolio: PortfolioOption, state: HedgingToolState): string {
  const years = getPositionReportYears(database, selectedPortfolio.portfolio_id);
  const selectedYear = state.selected_year ?? years[0] ?? "";
  const rows = selectedYear ? getPositionReportRows(database, selectedPortfolio.portfolio_id, selectedYear) : [];

  return `<div class="stack">
    <div>
      <h2>Position Report</h2>
      <p>Monthly aggregated positions by component.</p>
    </div>
    <form method="get" action="/hedging" class="compact-selector">
      <input type="hidden" name="portfolio_id" value="${escapeHtml(selectedPortfolio.portfolio_id)}">
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
