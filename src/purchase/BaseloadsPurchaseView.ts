import { getBaseloadsPortfolioOptions, type BaseloadsPurchaseResult } from "./baseloadsPurchase.ts";
import { getBaseloadsPurchasePeriods, type PurchasePeriodOption } from "./periodOptions.ts";
import type { PrototypeDatabase } from "../database/schema.ts";

export type BaseloadsPurchaseViewState = {
  selected_period_id?: string;
  mw?: string;
  error?: string;
  result?: BaseloadsPurchaseResult;
};

export function renderBaseloadsPurchaseForm(database: PrototypeDatabase, state: BaseloadsPurchaseViewState = {}): string {
  const portfolioOptions = getBaseloadsPortfolioOptions(database);
  const periods = getBaseloadsPurchasePeriods();
  const selectedPeriodId = state.selected_period_id ?? periods[0]?.period_id ?? "";
  const selectedPeriod = periods.find((period) => period.period_id === selectedPeriodId) ?? periods[0];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Baseloads Purchase</title>
  <style>
    :root {
      color-scheme: light;
      --background: #f6f7f9;
      --surface: #ffffff;
      --text: #17202a;
      --muted: #5d6978;
      --line: #d8dee7;
      --accent: #1967d2;
      --accent-dark: #0f4ea8;
      --success: #0f7b4f;
      --danger: #b42318;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--background);
      color: var(--text);
      font: 15px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(980px, calc(100% - 32px));
      margin: 0 auto;
      padding: 40px 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-end;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--line);
    }
    h1 {
      margin: 0 0 8px;
      font-size: 30px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: 0;
    }
    p { margin: 0; color: var(--muted); }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 24px;
      margin-top: 24px;
      align-items: start;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 24px;
    }
    form {
      display: grid;
      gap: 18px;
    }
    label {
      display: grid;
      gap: 6px;
      font-weight: 650;
    }
    select, input {
      width: 100%;
      min-height: 44px;
      border: 1px solid #bcc6d3;
      border-radius: 6px;
      padding: 10px 12px;
      font: inherit;
      background: #fff;
      color: var(--text);
    }
    button {
      min-height: 44px;
      border: 0;
      border-radius: 6px;
      padding: 10px 16px;
      font: inherit;
      font-weight: 700;
      color: #fff;
      background: var(--accent);
      cursor: pointer;
    }
    button:hover { background: var(--accent-dark); }
    .hint, .meta { color: var(--muted); font-size: 13px; }
    .error {
      border-color: #f4b8b2;
      background: #fff5f4;
      color: var(--danger);
    }
    .result {
      border-color: #b8dccb;
      background: #f2fbf6;
      color: var(--success);
    }
    .summary {
      display: grid;
      gap: 12px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--line);
    }
    .summary-row:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }
    .summary-row strong { text-align: right; }
    @media (max-width: 760px) {
      main { width: min(100% - 24px, 980px); padding: 24px 0; }
      .header { display: block; }
      .layout { grid-template-columns: 1fr; }
      h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <main>
    <section class="header">
      <div>
        <h1>Baseloads Purchase</h1>
        <p>Buy Baseloads MW for a selected delivery period.</p>
      </div>
      <p class="meta">Components: base.sys + base.epad</p>
    </section>
    <section class="layout">
      <section class="panel">
        ${state.error ? `<div class="panel error">${escapeHtml(state.error)}</div>` : ""}
        ${state.result ? renderResult(state.result) : ""}
        <form method="post" action="/purchase/baseloads">
          <label>
            Portfolio
            <select name="portfolio_id">
              ${portfolioOptions.map((option) => `<option value="${escapeHtml(option.portfolio_id)}">${escapeHtml(option.label)}</option>`).join("")}
            </select>
          </label>
          <label>
            MW quantity
            <input name="mw" type="number" min="0.001" step="0.001" required value="${escapeHtml(state.mw ?? "10")}">
          </label>
          <label>
            Period
            <select name="period_id">
              ${periods.map((period) => renderPeriodOption(period, selectedPeriodId)).join("")}
            </select>
          </label>
          <button type="submit">Confirm purchase</button>
          <p class="hint">Selected period: ${escapeHtml(selectedPeriod?.label ?? "")}</p>
        </form>
      </section>
      <aside class="panel summary">
        <div class="summary-row"><span>Product</span><strong>Baseloads</strong></div>
        <div class="summary-row"><span>Flow</span><strong>Call-off</strong></div>
        <div class="summary-row"><span>Components</span><strong>2</strong></div>
        <div class="summary-row"><span>Q-factor source</span><strong>Portfolio component</strong></div>
      </aside>
    </section>
  </main>
</body>
</html>`;
}

function renderPeriodOption(period: PurchasePeriodOption, selectedPeriodId: string): string {
  const selected = period.period_id === selectedPeriodId ? " selected" : "";
  return `<option value="${escapeHtml(period.period_id)}"${selected}>${escapeHtml(period.label)}</option>`;
}

function renderResult(result: BaseloadsPurchaseResult): string {
  return `<div class="panel result">
    <strong>Purchase created</strong>
    <p>Calloff ${escapeHtml(result.calloff.calloff_id)} created with ${result.transactions.length} transactions for ${escapeHtml(result.period.label)}.</p>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
