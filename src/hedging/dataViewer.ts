import { canonicalProductPackageName } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, CustomerTransaction } from "../database/types.ts";
import { projectPeaksCalloffMonth, type PeaksMonthlyProjection } from "./peaksCalloffTransactionList.ts";

export type DataViewerTableId = "calloffs" | "transactions" | "modern-calloffs" | "modern-transactions";

export type DataViewerTable = {
  table_id: DataViewerTableId;
  label: string;
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
  mw: number;
  q_factor: number;
};

export type ModernCalloffRow = {
  calloff_id: string;
  source_product_id: string;
  projected_product_package: string;
  portfolio_id: string;
  date: string;
  delivery_start_month: string;
  delivery_end_month: string;
  canonical_total_value: number;
  projected_total_value: number;
};

export type ModernTransactionRow = {
  projected_transaction_id: string;
  calloff_id: string;
  period: string;
  component: "base" | "peak";
  mwh: number;
  price: number | null;
  value: number;
};

export type DataViewerRows = {
  table_id: DataViewerTableId;
  rows: RawCalloffRow[] | RawTransactionRow[] | ModernCalloffRow[] | ModernTransactionRow[];
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
  return [
    { table_id: "calloffs", label: "Calloffs" },
    { table_id: "transactions", label: "Transactions" },
    { table_id: "modern-calloffs", label: "Modern Calloffs" },
    { table_id: "modern-transactions", label: "Modern Transactions" },
  ];
}

export function getDataViewerYears(database: PrototypeDatabase, portfolioId: string, tableId: DataViewerTableId): string[] {
  validatePortfolio(database, portfolioId);
  validateTableId(tableId);

  const years = new Set([...database.calendars.values()].map((calendar) => calendar.month.slice(0, 4)));

  if (tableId === "calloffs" || tableId === "modern-calloffs" || tableId === "modern-transactions") {
    for (const calloff of getPortfolioCalloffs(database, portfolioId)) {
      years.add(calloff.delivery_start_month.slice(0, 4));
    }
  }

  if (tableId === "transactions") {
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
    .map((transaction) => ({
      transaction_id: transaction.transaction_id,
      calloff_id: transaction.calloff_id,
      month: transaction.month,
      productcomponent_id: transaction.productcomponent_id,
      mw: transaction.mw,
      q_factor: transaction.q_factor,
    }));
}

export function getModernCalloffsForPortfolioYear(database: PrototypeDatabase, portfolioId: string, year: string): ModernCalloffRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getProjectedPeaksCalloffs(database, portfolioId, year).map((calloff) => {
    const projection = aggregateModernProjection(projectCalloffMonths(database, calloff));
    return {
      calloff_id: calloff.calloff_id,
      source_product_id: calloff.product_id,
      projected_product_package: "Peaks.Modern",
      portfolio_id: calloff.portfolio_id,
      date: calloff.date,
      delivery_start_month: calloff.delivery_start_month,
      delivery_end_month: calloff.delivery_end_month,
      canonical_total_value: projection.canonical_total_value,
      projected_total_value: projection.modern_total_value,
    };
  });
}

export function getModernTransactionsForPortfolioYear(database: PrototypeDatabase, portfolioId: string, year: string): ModernTransactionRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getProjectedPeaksCalloffs(database, portfolioId, year).flatMap((calloff) => {
    const projection = aggregateModernProjection(projectCalloffMonths(database, calloff));
    return [
      {
        projected_transaction_id: `${calloff.calloff_id}:modern.base`,
        calloff_id: calloff.calloff_id,
        period: projection.period,
        component: "base" as const,
        mwh: projection.base_mwh,
        price: projection.base_price,
        value: projection.base_value,
      },
      {
        projected_transaction_id: `${calloff.calloff_id}:modern.peak`,
        calloff_id: calloff.calloff_id,
        period: projection.period,
        component: "peak" as const,
        mwh: projection.peak_mwh,
        price: projection.peak_price,
        value: projection.peak_value,
      },
    ];
  });
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

  if (tableId === "modern-calloffs") {
    return {
      table_id: tableId,
      rows: getModernCalloffsForPortfolioYear(database, portfolioId, year),
    };
  }

  if (tableId === "modern-transactions") {
    return {
      table_id: tableId,
      rows: getModernTransactionsForPortfolioYear(database, portfolioId, year),
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

function isPeaksCalloff(database: PrototypeDatabase, calloff: Calloff): boolean {
  const product = database.productConfigurations.get(calloff.product_id);
  if (!product) {
    return false;
  }
  const productPackage = canonicalProductPackageName(product.name);
  return productPackage === "Peaks.Classic" || productPackage === "Peaks.Modern";
}

function projectCalloffMonths(database: PrototypeDatabase, calloff: Calloff): PeaksMonthlyProjection[] {
  const transactions = getCalloffTransactions(database, calloff.calloff_id);
  const months = [...new Set(transactions.map((transaction) => transaction.month))].sort();
  if (months.length === 0) {
    return [projectPeaksCalloffMonth(database, calloff, [])];
  }
  return months.map((month) =>
    projectPeaksCalloffMonth(
      database,
      calloff,
      transactions.filter((transaction) => transaction.month === month),
    ),
  );
}

function aggregateModernProjection(rows: PeaksMonthlyProjection[]) {
  const baseMwh = sum(rows, "modern_base_mwh");
  const peakMwh = sum(rows, "modern_peak_mwh");
  const baseValue = sum(rows, "modern_base_value");
  const peakValue = sum(rows, "modern_peak_value");

  return {
    period: rows.length === 1 ? rows[0].month : `${rows[0].month} - ${rows[rows.length - 1].month}`,
    base_mwh: roundProjection(baseMwh),
    peak_mwh: roundProjection(peakMwh),
    base_price: divideOrNull(baseValue, baseMwh),
    peak_price: divideOrNull(peakValue, peakMwh),
    base_value: roundProjection(baseValue),
    peak_value: roundProjection(peakValue),
    canonical_total_value: roundProjection(sum(rows, "canonical_total_value")),
    modern_total_value: roundProjection(baseValue + peakValue),
  };
}

function getCalloffTransactions(database: PrototypeDatabase, calloffId: string): CustomerTransaction[] {
  return [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloffId);
}

function getPortfolioCalloffs(database: PrototypeDatabase, portfolioId: string) {
  return [...database.calloffs.values()].filter((calloff) => calloff.portfolio_id === portfolioId);
}

function getPortfolioTransactions(database: PrototypeDatabase, portfolioId: string) {
  const calloffIds = new Set(getPortfolioCalloffs(database, portfolioId).map((calloff) => calloff.calloff_id));
  return [...database.transactions.values()].filter((transaction) => calloffIds.has(transaction.calloff_id));
}

function divideOrNull(numerator: number, denominator: number): number | null {
  if (Math.abs(denominator) <= 0.000001) {
    return null;
  }
  return roundProjection(numerator / denominator);
}

function sum(rows: PeaksMonthlyProjection[], key: keyof PeaksMonthlyProjection): number {
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
