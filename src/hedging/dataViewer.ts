import { canonicalProductPackageName } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, CustomerTransaction } from "../database/types.ts";
import { getPeaksClassicCalloffTransactionRows, type PeaksClassicCalloffTransactionRow } from "./peaksCalloffTransactionList.ts";

const EPSILON = 0.000001;

export type DataViewerTableId =
  | "calloffs"
  | "transactions"
  | "baseloads-projected-transactions"
  | "classic-projected-calloffs"
  | "modern-projected-calloffs"
  | "modern-projected-transactions";

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
  mwh: number;
  price: number | null;
  value: number;
  source_component: string;
};

export type ModernProjectedTransactionRow = {
  calloff_id: string;
  month: string;
  component: "modern.base.sys" | "modern.base.epad" | "modern.peak.sys" | "modern.peak.epad";
  mw: number | null;
  price: number | null;
  mwh: number;
  value: number;
  source_components: string;
  warnings: string[];
};

export type DataViewerRows = {
  table_id: DataViewerTableId;
  rows:
    | RawCalloffRow[]
    | RawTransactionRow[]
    | BaseloadsProjectedTransactionRow[]
    | PeaksClassicCalloffTransactionRow[]
    | ModernProjectedCalloffRow[]
    | ModernProjectedTransactionRow[];
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
    { table_id: "calloffs", label: "Canonical Raw Calloffs" },
    { table_id: "transactions", label: "Canonical Raw Transactions" },
    { table_id: "baseloads-projected-transactions", label: "Baseloads Projected Transactions" },
    { table_id: "classic-projected-calloffs", label: "Classic Projected Calloffs" },
    { table_id: "modern-projected-calloffs", label: "Modern Projected Calloffs" },
    { table_id: "modern-projected-transactions", label: "Modern Projected Transactions" },
  ];
}

export function getDataViewerYears(database: PrototypeDatabase, portfolioId: string, tableId: DataViewerTableId): string[] {
  validatePortfolio(database, portfolioId);
  validateTableId(tableId);

  const years = new Set([...database.calendars.values()].map((calendar) => calendar.month.slice(0, 4)));

  if (tableId !== "transactions") {
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

export function getModernProjectedCalloffsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ModernProjectedCalloffRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getProjectedPeaksCalloffs(database, portfolioId, year).map((calloff) => {
    const rows = projectCalloffMonths(database, calloff);
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

export function getModernProjectedTransactionsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ModernProjectedTransactionRow[] {
  validatePortfolio(database, portfolioId);
  validateYear(year);

  return getProjectedPeaksCalloffs(database, portfolioId, year).flatMap((calloff) => projectCalloffMonths(database, calloff));
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

  if (tableId === "modern-projected-transactions") {
    return {
      table_id: tableId,
      rows: getModernProjectedTransactionsForPortfolioYear(database, portfolioId, year),
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

function projectCalloffMonths(database: PrototypeDatabase, calloff: Calloff): ModernProjectedTransactionRow[] {
  const transactions = getCalloffTransactions(database, calloff.calloff_id);
  const months = [...new Set(transactions.map((transaction) => transaction.month))].sort();
  if (months.length === 0) {
    return projectModernMonth(database, calloff, calloff.delivery_start_month, []);
  }
  return months.flatMap((month) =>
    projectModernMonth(
      database,
      calloff,
      month,
      transactions.filter((transaction) => transaction.month === month),
    ),
  );
}

function projectModernMonth(
  database: PrototypeDatabase,
  calloff: Calloff,
  month: string,
  transactions: CustomerTransaction[],
): ModernProjectedTransactionRow[] {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    return emptyModernRows(calloff.calloff_id, month, "missing calendar");
  }

  const offpeakH = calendar.total_h - calendar.peak_h;
  if (calendar.peak_h === 0 || offpeakH === 0) {
    return emptyModernRows(calloff.calloff_id, month, "zero peak or offpeak hours");
  }

  return [
    ...projectModernDimension(database, calloff.calloff_id, month, transactions, "sys", calendar.total_h, calendar.peak_h, offpeakH),
    ...projectModernDimension(database, calloff.calloff_id, month, transactions, "epad", calendar.total_h, calendar.peak_h, offpeakH),
  ].sort((left, right) => componentSort(left.component) - componentSort(right.component));
}

function projectModernDimension(
  database: PrototypeDatabase,
  calloffId: string,
  month: string,
  transactions: CustomerTransaction[],
  dimension: "sys" | "epad",
  totalH: number,
  peakH: number,
  offpeakH: number,
): ModernProjectedTransactionRow[] {
  const warnings: string[] = [];
  const base = findComponentTransaction(database, transactions, `base.${dimension}`);
  const allocation = findComponentTransaction(database, transactions, `allocation.peak.${dimension}`);
  const peak = findComponentTransaction(database, transactions, `peak.${dimension}`);
  if (!base) {
    warnings.push(`missing base.${dimension}`);
  }
  if (!allocation) {
    warnings.push(`missing allocation.peak.${dimension}`);
  }
  if (!peak) {
    warnings.push(`missing peak.${dimension}`);
  }

  const basePrice = findComponentPrice(database, `base.${dimension}`, transactions, warnings);
  const peakPrice = findComponentPrice(database, `peak.${dimension}`, transactions, warnings);

  if (!base || !allocation || !peak || basePrice === null || peakPrice === null) {
    return emptyModernRows(calloffId, month, warnings.join("; "), dimension);
  }

  const baseMw = (base.mw * totalH - allocation.mw * peakH) / offpeakH;
  const modernPeakMw = allocation.mw - baseMw;
  const baseMwh = baseMw * totalH;
  const peakMwh = modernPeakMw * peakH;
  const canonicalValue = base.mw * totalH * basePrice + peak.mw * peakH * peakPrice;
  const baseValue = baseMwh * basePrice;
  const projectedPeakPrice = divideOrNull(canonicalValue - baseValue, peakMwh);
  if (projectedPeakPrice === null) {
    warnings.push(`zero modern peak ${dimension} MWh`);
  }
  const peakValue = projectedPeakPrice === null ? 0 : canonicalValue - baseValue;

  return [
    {
      calloff_id: calloffId,
      month,
      component: `modern.base.${dimension}`,
      mw: roundProjection(baseMw),
      price: roundProjection(basePrice),
      mwh: roundProjection(baseMwh),
      value: roundProjection(baseValue),
      source_components: `base.${dimension}, allocation.peak.${dimension}`,
      warnings,
    },
    {
      calloff_id: calloffId,
      month,
      component: `modern.peak.${dimension}`,
      mw: roundProjection(modernPeakMw),
      price: projectedPeakPrice,
      mwh: roundProjection(peakMwh),
      value: roundProjection(peakValue),
      source_components: `base.${dimension}, allocation.peak.${dimension}, peak.${dimension}`,
      warnings,
    },
  ];
}

function getCalloffTransactions(database: PrototypeDatabase, calloffId: string): CustomerTransaction[] {
  return [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloffId);
}

function findComponentTransaction(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  componentCode: string,
): CustomerTransaction | undefined {
  return transactions.find(
    (transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component === componentCode,
  );
}

function findComponentPrice(
  database: PrototypeDatabase,
  componentCode: string,
  transactions: CustomerTransaction[],
  warnings: string[],
): number | null {
  const component = transactions
    .map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id))
    .find((candidate) => candidate?.component === componentCode);
  if (!component) {
    warnings.push(`missing ${componentCode} price source`);
    return null;
  }
  const price = [...database.priceComponents.values()].find((candidate) => candidate.productcomponent_id === component.productcomponent_id);
  if (!price) {
    warnings.push(`missing ${componentCode} price`);
    return null;
  }
  return price.price;
}

function emptyModernRows(
  calloffId: string,
  month: string,
  warning: string,
  dimension?: "sys" | "epad",
): ModernProjectedTransactionRow[] {
  const dimensions = dimension ? [dimension] : (["sys", "epad"] as const);
  return dimensions.flatMap((candidate) => [
    emptyModernRow(calloffId, month, `modern.base.${candidate}`, warning),
    emptyModernRow(calloffId, month, `modern.peak.${candidate}`, warning),
  ]);
}

function emptyModernRow(
  calloffId: string,
  month: string,
  component: ModernProjectedTransactionRow["component"],
  warning: string,
): ModernProjectedTransactionRow {
  return {
    calloff_id: calloffId,
    month,
    component,
    mw: null,
    price: null,
    mwh: 0,
    value: 0,
    source_components: "",
    warnings: [warning].filter(Boolean),
  };
}

function componentSort(component: ModernProjectedTransactionRow["component"]): number {
  return ["modern.base.sys", "modern.base.epad", "modern.peak.sys", "modern.peak.epad"].indexOf(component);
}

function mwhMismatch(leftRows: ModernProjectedTransactionRow[], rightRows: ModernProjectedTransactionRow[]): boolean {
  const byMonth = new Map(rightRows.map((row) => [row.month, row.mwh]));
  return leftRows.some((row) => Math.abs(row.mwh - (byMonth.get(row.month) ?? row.mwh)) > EPSILON);
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
