import { canonicalProductPackageName, componentCodeConcept, type ComponentCodeConcept } from "../database/canonicalComponents.ts";
import { getCanonicalForecasts, getEventDetails } from "../database/eventForecasts.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, ComponentCategory, CustomerTransaction } from "../database/types.ts";
import { deriveClassicFromForecast } from "./classicProjection.ts";
import { deriveModernFromForecast } from "./modernProjection.ts";
import { getMarketProjectionRows } from "./marketProjection.ts";
import {
  getClassicProjectedModelRowsForPortfolioYear,
  getPeaksClassicCalloffTransactionRows,
  getModernProjectedModelRowsForPortfolioYear,
  type PeaksClassicCalloffTransactionRow,
  type PeaksProjectedModelTransactionRow,
} from "./peaksCalloffTransactionList.ts";
import { getCalloffCurrencyCoverage, getTransactionViewEconomics } from "./viewEconomics.ts";

const EPSILON = 0.000001;

export type DataViewerTableId =
  | "calloffs"
  | "transactions"
  | "forecast-event-details"
  | "classic-projected-forecast"
  | "modern-projected-forecast"
  | "baseloads-projected-transactions"
  | "classic-projected-calloffs"
  | "classic-projected-transactions"
  | "modern-projected-calloffs"
  | "modern-projected-transactions"
  | "market-projection";

export type DataViewerViewGroupId = "raw-canonical" | "projected-customer" | "market-internal";

export type DataViewerTable = {
  table_id: DataViewerTableId;
  label: string;
  view_group_id: DataViewerViewGroupId;
  view_group_label: string;
  description: string;
};

export type RawCalloffRow = {
  calloff_id: string;
  product_id: string;
  portfolio_id: string;
  date: string;
  delivery_start_month: string;
  delivery_end_month: string;
};

export type RawTransactionRow = {
  transaction_id: string;
  calloff_id: string;
  month: string;
  productcomponent_id: string;
  component: string;
  component_code: string;
  component_category: ComponentCategory;
  component_concept: ComponentCodeConcept;
  period: string;
  mw: number;
  q_factor: number;
  quantity: number | null;
  quantity_type: "MW" | "EUR" | null;
  price: number | null;
  price_type: "EUR_PER_MWH" | "SEK_PER_EUR" | null;
  factor: number | null;
  factor_type: "Q_FACTOR" | null;
  hours: number | null;
  mwh: number | null;
  value_eur: number | null;
  q_value_eur: number | null;
  value_sek: number | null;
  coverage_pct: number | null;
};

export type RawForecastEventDetailRow = {
  event_id: string;
  event_detail_id: string;
  event_type: string;
  period: string;
  component_code: string;
  component_concept: ComponentCodeConcept;
  price_area: string | null;
  quantity: number;
  quantity_type: string;
};

export type ClassicProjectedForecastRow = {
  month: string;
  offpeak_mwh: number;
  peak_mwh: number;
  offpeak_mw: number;
  peak_mw: number;
  source_event_id: string;
};

export type ModernProjectedForecastRow = {
  month: string;
  base_mwh: number;
  peak_mwh: number;
  base_mw: number;
  peak_mw: number;
  source_event_id: string;
};

export type ModernProjectedCalloffRow = {
  calloff_id: string;
  date: string;
  period_start: string;
  period_end: string;
  base_mwh: number;
  peak_mwh: number;
  base_price: number | null;
  peak_price: number | null;
  base_value: number;
  peak_value: number;
  total_value: number;
  warnings: string[];
};

export type BaseloadsProjectedTransactionRow = {
  calloff_id: string;
  month: string;
  component: "baseloads.base.sys" | "baseloads.base.epad";
  component_concept: "projected";
  mwh: number;
  price: number | null;
  value: number;
  source_component: string;
};

export type ModernProjectedTransactionRow = PeaksProjectedModelTransactionRow;
export type ClassicProjectedTransactionRow = PeaksProjectedModelTransactionRow;

export type DataViewerMarketProjectionRow = {
  transaction_id: string;
  month: string;
  component: string;
  component_concept: ComponentCodeConcept;
  market_mw: number;
  market_mwh: number;
  dimension_note: string;
};

export type DataViewerRows = {
  table_id: DataViewerTableId;
  rows:
    | RawCalloffRow[]
    | RawTransactionRow[]
    | RawForecastEventDetailRow[]
    | ClassicProjectedForecastRow[]
    | ModernProjectedForecastRow[]
    | BaseloadsProjectedTransactionRow[]
    | PeaksClassicCalloffTransactionRow[]
    | ClassicProjectedTransactionRow[]
    | ModernProjectedCalloffRow[]
    | ModernProjectedTransactionRow[]
    | DataViewerMarketProjectionRow[];
};

export class DataViewerError extends Error {
  readonly code: "invalid_input" | "not_found";

  constructor(code: "invalid_input" | "not_found", message: string) {
    super(message);
    this.code = code;
    this.name = "DataViewerError";
  }
}

export function getDataViewerTables(): DataViewerTable[] {
  const rawDescription = "Stored source-of-truth rows and model inputs.";
  const projectedDescription = "Derived customer-facing views built from canonical rows.";
  const marketDescription = "Derived market/internal rows; sys and epad are price dimensions, not additive physical volume.";
  return [
    {
      table_id: "calloffs",
      label: "Canonical Raw Calloffs",
      view_group_id: "raw-canonical",
      view_group_label: "Raw canonical",
      description: rawDescription,
    },
    {
      table_id: "transactions",
      label: "Canonical Raw Transactions",
      view_group_id: "raw-canonical",
      view_group_label: "Raw canonical",
      description: rawDescription,
    },
    {
      table_id: "forecast-event-details",
      label: "Canonical Forecast Event Details",
      view_group_id: "raw-canonical",
      view_group_label: "Raw canonical",
      description: rawDescription,
    },
    {
      table_id: "classic-projected-forecast",
      label: "Classic Projected Forecast",
      view_group_id: "projected-customer",
      view_group_label: "Projected customer views",
      description: projectedDescription,
    },
    {
      table_id: "modern-projected-forecast",
      label: "Modern Projected Forecast",
      view_group_id: "projected-customer",
      view_group_label: "Projected customer views",
      description: projectedDescription,
    },
    {
      table_id: "baseloads-projected-transactions",
      label: "Baseloads Projected Transactions",
      view_group_id: "projected-customer",
      view_group_label: "Projected customer views",
      description: projectedDescription,
    },
    {
      table_id: "classic-projected-calloffs",
      label: "Classic Projected Calloffs",
      view_group_id: "projected-customer",
      view_group_label: "Projected customer views",
      description: projectedDescription,
    },
    {
      table_id: "classic-projected-transactions",
      label: "Classic Projected Transactions",
      view_group_id: "projected-customer",
      view_group_label: "Projected customer views",
      description: projectedDescription,
    },
    {
      table_id: "modern-projected-calloffs",
      label: "Modern Projected Calloffs",
      view_group_id: "projected-customer",
      view_group_label: "Projected customer views",
      description: projectedDescription,
    },
    {
      table_id: "modern-projected-transactions",
      label: "Modern Projected Transactions",
      view_group_id: "projected-customer",
      view_group_label: "Projected customer views",
      description: projectedDescription,
    },
    {
      table_id: "market-projection",
      label: "Market Projection",
      view_group_id: "market-internal",
      view_group_label: "Market/internal views",
      description: marketDescription,
    },
  ];
}

export function getDataViewerYears(database: PrototypeDatabase, portfolioId: string, tableId: DataViewerTableId): string[] {
  validatePortfolio(database, portfolioId);
  validateTableId(tableId);

  const years = new Set([...database.calendars.values()].map((calendar) => calendar.month.slice(0, 4)));

  const forecastTable =
    tableId === "forecast-event-details" || tableId === "classic-projected-forecast" || tableId === "modern-projected-forecast";
  const transactionMonthTable = tableId === "transactions" || tableId === "market-projection";

  if (forecastTable) {
    for (const forecast of getCanonicalForecasts(database, portfolioId)) {
      years.add(forecast.month.slice(0, 4));
    }
  }

  if (!transactionMonthTable) {
    for (const calloff of getPortfolioCalloffs(database, portfolioId)) {
      years.add(calloff.delivery_start_month.slice(0, 4));
    }
  }

  if (transactionMonthTable) {
    for (const transaction of getPortfolioTransactions(database, portfolioId)) {
      years.add(transaction.month.slice(0, 4));
    }
  }

  return [...years].sort();
}

export function getRawCalloffsForPortfolioYear(database: PrototypeDatabase, portfolioId: string, year: string): RawCalloffRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getPortfolioCalloffs(database, portfolioId)
    .filter((calloff) => calloff.delivery_start_month.startsWith(`${year}-`))
    .sort(
      (left, right) =>
        left.delivery_start_month.localeCompare(right.delivery_start_month) ||
        left.delivery_end_month.localeCompare(right.delivery_end_month) ||
        left.calloff_id.localeCompare(right.calloff_id),
    )
    .map((calloff) => ({
      calloff_id: calloff.calloff_id,
      product_id: calloff.product_id,
      portfolio_id: calloff.portfolio_id,
      date: calloff.date,
      delivery_start_month: calloff.delivery_start_month,
      delivery_end_month: calloff.delivery_end_month,
    }));
}

export function getRawTransactionsForPortfolioYear(database: PrototypeDatabase, portfolioId: string, year: string): RawTransactionRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getPortfolioTransactions(database, portfolioId)
    .filter((transaction) => transaction.month.startsWith(`${year}-`))
    .sort(
      (left, right) =>
        left.month.localeCompare(right.month) ||
        left.calloff_id.localeCompare(right.calloff_id) ||
        left.transaction_id.localeCompare(right.transaction_id),
    )
    .map((transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id)?.component ?? transaction.productcomponent_id;
      const economics = getTransactionViewEconomics(database, transaction);
      return {
        transaction_id: transaction.transaction_id,
        calloff_id: transaction.calloff_id,
        month: transaction.month,
        productcomponent_id: transaction.productcomponent_id,
        component,
        component_code: economics.component_code,
        component_category: economics.component_category,
        component_concept: componentCodeConcept(component),
        period: economics.period,
        mw: transaction.mw,
        q_factor: transaction.q_factor,
        quantity: economics.quantity,
        quantity_type: economics.quantity_type,
        price: economics.price,
        price_type: economics.price_type,
        factor: economics.factor,
        factor_type: economics.factor_type,
        hours: economics.hours,
        mwh: economics.mwh,
        value_eur: economics.value_eur,
        q_value_eur: economics.q_value_eur,
        value_sek: economics.value_sek,
        coverage_pct: rawTransactionCoveragePct(database, transaction),
      };
    });
}

export function getRawForecastEventDetailsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): RawForecastEventDetailRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return [...database.events.values()]
    .filter((event) => event.portfolio_id === portfolioId && event.event_type === "FORECAST" && event.status === "active")
    .flatMap((event) =>
      getEventDetails(database, event.event_id)
        .filter((detail) => detail.period.startsWith(`${year}-`))
        .map((detail) => ({
          event_id: event.event_id,
          event_detail_id: detail.event_detail_id,
          event_type: event.event_type,
          period: detail.period,
          component_code: detail.component_code,
          component_concept: componentCodeConcept(detail.component_code),
          price_area: detail.price_area,
          quantity: detail.quantity,
          quantity_type: detail.quantity_type,
        })),
    )
    .sort(
      (left, right) =>
        left.period.localeCompare(right.period) ||
        (left.price_area ?? "").localeCompare(right.price_area ?? "") ||
        left.component_code.localeCompare(right.component_code),
    );
}

export function getClassicProjectedForecastForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ClassicProjectedForecastRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getCanonicalForecasts(database, portfolioId)
    .filter((forecast) => forecast.month.startsWith(`${year}-`))
    .map((forecast) => {
      const calendar = getCalendar(database, forecast.month);
      const classic = deriveClassicFromForecast({
        total_mwh: forecast.mwh,
        peak_pct: forecast.peak_pct,
        total_h: calendar.total_h,
        peak_h: calendar.peak_h,
      });
      return {
        month: forecast.month,
        offpeak_mwh: classic.classic_offpeak_mwh,
        peak_mwh: classic.classic_peak_mwh,
        offpeak_mw: classic.classic_offpeak_mw,
        peak_mw: classic.classic_peak_mw,
        source_event_id: forecast.forecast_id,
      };
    });
}

export function getModernProjectedForecastForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ModernProjectedForecastRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getCanonicalForecasts(database, portfolioId)
    .filter((forecast) => forecast.month.startsWith(`${year}-`))
    .map((forecast) => {
      const calendar = getCalendar(database, forecast.month);
      const modern = deriveModernFromForecast({
        total_mwh: forecast.mwh,
        peak_pct: forecast.peak_pct,
        total_h: calendar.total_h,
        peak_h: calendar.peak_h,
      });
      return {
        month: forecast.month,
        base_mwh: modern.modern_base_mwh,
        peak_mwh: modern.modern_peak_mwh,
        base_mw: modern.modern_base_mw,
        peak_mw: modern.modern_peak_mw,
        source_event_id: forecast.forecast_id,
      };
    });
}

export function getModernProjectedCalloffsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ModernProjectedCalloffRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);
  const projectedRows = getModernProjectedModelRowsForPortfolioYear(database, portfolioId, year);

  return getProjectedPeaksCalloffs(database, portfolioId, year).map((calloff) => {
    const rows = projectedRows.filter((row) => row.calloff_id === calloff.calloff_id);
    const baseSysRows = rows.filter((row) => row.component === "modern.base.sys");
    const baseEpadRows = rows.filter((row) => row.component === "modern.base.epad");
    const peakSysRows = rows.filter((row) => row.component === "modern.peak.sys");
    const peakEpadRows = rows.filter((row) => row.component === "modern.peak.epad");
    const baseMwh = sumModernRows(baseSysRows, "mwh");
    const peakMwh = sumModernRows(peakSysRows, "mwh");
    const baseValue = roundProjection(sumModernRows(baseSysRows, "value") + sumModernRows(baseEpadRows, "value"));
    const peakValue = roundProjection(sumModernRows(peakSysRows, "value") + sumModernRows(peakEpadRows, "value"));
    const warnings = [
      ...new Set([
        ...rows.flatMap((row) => row.warnings),
        ...(mwhMismatch(baseSysRows, baseEpadRows) ? ["mismatched modern base sys/epad MWh"] : []),
        ...(mwhMismatch(peakSysRows, peakEpadRows) ? ["mismatched modern peak sys/epad MWh"] : []),
      ]),
    ];
    return {
      calloff_id: calloff.calloff_id,
      date: calloff.date,
      period_start: calloff.delivery_start_month,
      period_end: calloff.delivery_end_month,
      base_mwh: roundProjection(baseMwh),
      peak_mwh: roundProjection(peakMwh),
      base_price: divideOrNull(baseValue, baseMwh),
      peak_price: divideOrNull(peakValue, peakMwh),
      base_value: baseValue,
      peak_value: peakValue,
      total_value: roundProjection(baseValue + peakValue),
      warnings,
    };
  });
}

export function getBaseloadsProjectedTransactionsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): BaseloadsProjectedTransactionRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  const calloffIds = new Set(
    getPortfolioCalloffs(database, portfolioId)
      .filter((calloff) => calloff.delivery_start_month.startsWith(`${year}-`))
      .map((calloff) => calloff.calloff_id),
  );

  return [...database.transactions.values()]
    .filter((transaction) => calloffIds.has(transaction.calloff_id))
    .flatMap((transaction) => projectBaseloadsTransaction(database, transaction))
    .sort(
      (left, right) =>
        left.month.localeCompare(right.month) ||
        left.calloff_id.localeCompare(right.calloff_id) ||
        left.component.localeCompare(right.component),
    );
}

export function getClassicProjectedCalloffsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): PeaksClassicCalloffTransactionRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getPeaksClassicCalloffTransactionRows(database, portfolioId).filter((row) => row.period.startsWith(year));
}

export function getClassicProjectedTransactionsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ClassicProjectedTransactionRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getClassicProjectedModelRowsForPortfolioYear(database, portfolioId, year);
}

export function getModernProjectedTransactionsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ModernProjectedTransactionRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getModernProjectedModelRowsForPortfolioYear(database, portfolioId, year);
}

export function getMarketProjectionRowsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): DataViewerMarketProjectionRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  const transactions = getPortfolioTransactions(database, portfolioId).filter((transaction) => transaction.month.startsWith(`${year}-`));
  return getMarketProjectionRows(database, transactions)
    .map((row) => ({
      transaction_id: row.transaction_id,
      month: row.month,
      component: row.component,
      component_concept: componentCodeConcept(row.component),
      market_mw: row.market_mw,
      market_mwh: row.market_mwh,
      dimension_note: "sys and epad are price dimensions, not additive physical volume",
    }))
    .sort(
      (left, right) =>
        left.month.localeCompare(right.month) ||
        left.transaction_id.localeCompare(right.transaction_id) ||
        left.component.localeCompare(right.component),
    );
}

export function getDataViewerRows(
  database: PrototypeDatabase,
  portfolioId: string,
  tableId: DataViewerTableId,
  year: string,
): DataViewerRows {
  validateTableId(tableId);

  if (tableId === "calloffs") {
    return {
      table_id: tableId,
      rows: getRawCalloffsForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "forecast-event-details") {
    return {
      table_id: tableId,
      rows: getRawForecastEventDetailsForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "classic-projected-forecast") {
    return {
      table_id: tableId,
      rows: getClassicProjectedForecastForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "modern-projected-forecast") {
    return {
      table_id: tableId,
      rows: getModernProjectedForecastForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "modern-projected-calloffs") {
    return {
      table_id: tableId,
      rows: getModernProjectedCalloffsForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "baseloads-projected-transactions") {
    return {
      table_id: tableId,
      rows: getBaseloadsProjectedTransactionsForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "classic-projected-calloffs") {
    return {
      table_id: tableId,
      rows: getClassicProjectedCalloffsForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "classic-projected-transactions") {
    return {
      table_id: tableId,
      rows: getClassicProjectedTransactionsForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "modern-projected-transactions") {
    return {
      table_id: tableId,
      rows: getModernProjectedTransactionsForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "market-projection") {
    return {
      table_id: tableId,
      rows: getMarketProjectionRowsForPortfolioYear(database, portfolioId, year),
    };
  }

  return {
    table_id: tableId,
    rows: getRawTransactionsForPortfolioYear(database, portfolioId, year),
  };
}

export function parseDataViewerTableId(value: string | undefined): DataViewerTableId {
  const tableId = (value ?? "calloffs").trim();
  if (!getDataViewerTables().some((table) => table.table_id === tableId)) {
    throw new DataViewerError("invalid_input", `unknown Data Viewer table ${tableId}`);
  }
  return tableId as DataViewerTableId;
}

function getProjectedPeaksCalloffs(database: PrototypeDatabase, portfolioId: string, year: string): Calloff[] {
  return getPortfolioCalloffs(database, portfolioId)
    .filter((calloff) => calloff.delivery_start_month.startsWith(`${year}-`))
    .filter((calloff) => isPeaksCalloff(database, calloff))
    .sort(
      (left, right) =>
        left.delivery_start_month.localeCompare(right.delivery_start_month) ||
        left.delivery_end_month.localeCompare(right.delivery_end_month) ||
        left.calloff_id.localeCompare(right.calloff_id),
    );
}

function projectBaseloadsTransaction(
  database: PrototypeDatabase,
  transaction: CustomerTransaction,
): BaseloadsProjectedTransactionRow[] {
  const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
  if (!component || (component.component !== "base.sys" && component.component !== "base.epad")) {
    return [];
  }
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === transaction.month);
  const price = [...database.priceComponents.values()].find(
    (candidate) => candidate.productcomponent_id === transaction.productcomponent_id,
  )?.price ?? null;
  const mwh = roundProjection(transaction.mw * (calendar?.total_h ?? 0));
  return [
    {
      calloff_id: transaction.calloff_id,
      month: transaction.month,
      component: `baseloads.${component.component}`,
      component_concept: "projected",
      mwh,
      price: price === null ? null : roundProjection(price),
      value: price === null ? 0 : roundProjection(mwh * price),
      source_component: component.component,
    },
  ];
}

function isPeaksCalloff(database: PrototypeDatabase, calloff: Calloff): boolean {
  const product = database.productConfigurations.get(calloff.product_id);
  if (!product) {
    return false;
  }
  const productPackage = canonicalProductPackageName(product.name);
  return productPackage === "Peaks.Classic" || productPackage === "Peaks.Modern";
}

function getCalloffTransactions(database: PrototypeDatabase, calloffId: string): CustomerTransaction[] {
  return [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloffId);
}

function mwhMismatch(leftRows: ModernProjectedTransactionRow[], rightRows: ModernProjectedTransactionRow[]): boolean {
  const byMonth = new Map(rightRows.map((row) => [row.month, row.mwh]));
  return leftRows.some((row) => Math.abs((row.mwh ?? 0) - (byMonth.get(row.month) ?? row.mwh ?? 0)) > EPSILON);
}

function rawTransactionCoveragePct(database: PrototypeDatabase, transaction: CustomerTransaction): number | null {
  const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
  if (component?.component !== "currency.eursek") {
    return null;
  }
  const calloff = database.calloffs.get(transaction.calloff_id);
  if (!calloff) {
    return null;
  }
  const scopedTransactions = getCalloffTransactions(database, transaction.calloff_id).filter((row) => row.month === transaction.month);
  const powerValueEur = scopedTransactions.reduce((sum, row) => {
    const economics = getTransactionViewEconomics(database, row);
    return economics.component_category === "currency" ? sum : sum + (economics.q_value_eur ?? 0);
  }, 0);
  return getCalloffCurrencyCoverage(database, { calloff, transactions: scopedTransactions, powerValueEur }).coverage_pct;
}

function getPortfolioCalloffs(database: PrototypeDatabase, portfolioId: string) {
  return [...database.calloffs.values()].filter((calloff) => calloff.portfolio_id === portfolioId);
}

function getPortfolioTransactions(database: PrototypeDatabase, portfolioId: string) {
  const calloffIds = new Set(getPortfolioCalloffs(database, portfolioId).map((calloff) => calloff.calloff_id));
  return [...database.transactions.values()].filter((transaction) => calloffIds.has(transaction.calloff_id));
}

function getCalendar(database: PrototypeDatabase, month: string) {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    throw new DataViewerError("not_found", `missing calendar row for ${month}`);
  }
  return calendar;
}

function divideOrNull(numerator: number, denominator: number): number | null {
  if (Math.abs(denominator) <= 0.000001) {
    return null;
  }
  return roundProjection(numerator / denominator);
}

function sumModernRows(rows: ModernProjectedTransactionRow[], key: "mwh" | "value"): number {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function roundProjection(value: number): number {
  return Number(value.toFixed(6));
}

function validatePortfolio(database: PrototypeDatabase, portfolioId: string): void {
  if (!portfolioId) {
    throw new DataViewerError("invalid_input", "portfolio_id is required");
  }
  if (!database.portfolios.has(portfolioId)) {
    throw new DataViewerError("not_found", `portfolio_id ${portfolioId} does not exist`);
  }
}

function validateTableId(tableId: DataViewerTableId): void {
  if (!getDataViewerTables().some((table) => table.table_id === tableId)) {
    throw new DataViewerError("invalid_input", `unknown Data Viewer table ${tableId}`);
  }
}

function validateYear(year: string): void {
  if (!/^\d{4}$/.test(year)) {
    throw new DataViewerError("invalid_input", "selected_year must use YYYY format");
  }
}
