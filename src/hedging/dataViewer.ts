import type { PrototypeDatabase } from "../database/schema.ts";

export type DataViewerTableId = "calloffs" | "transactions";

export type DataViewerTable = {
  table_id: DataViewerTableId;
  label: string;
};

export type RawCalloffRow = {
  calloff_id: string;
  product_id: string;
  portfolio_id: string;
  date: string;
};

export type RawTransactionRow = {
  transaction_id: string;
  calloff_id: string;
  month: string;
  productcomponent_id: string;
  mw: number;
  q_factor: number;
};

export type DataViewerRows = {
  table_id: DataViewerTableId;
  rows: RawCalloffRow[] | RawTransactionRow[];
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
  ];
}

export function getDataViewerYears(database: PrototypeDatabase, portfolioId: string, tableId: DataViewerTableId): string[] {
  validatePortfolio(database, portfolioId);
  validateTableId(tableId);

  const years = new Set([...database.calendars.values()].map((calendar) => calendar.month.slice(0, 4)));

  if (tableId === "calloffs") {
    for (const calloff of getPortfolioCalloffs(database, portfolioId)) {
      years.add(calloff.date.slice(0, 4));
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
    .filter((calloff) => calloff.date.startsWith(`${year}-`))
    .sort((left, right) => left.date.localeCompare(right.date) || left.calloff_id.localeCompare(right.calloff_id))
    .map((calloff) => ({
      calloff_id: calloff.calloff_id,
      product_id: calloff.product_id,
      portfolio_id: calloff.portfolio_id,
      date: calloff.date,
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

  return {
    table_id: tableId,
    rows: getRawTransactionsForPortfolioYear(database, portfolioId, year),
  };
}

export function parseDataViewerTableId(value: string | undefined): DataViewerTableId {
  const tableId = (value ?? "calloffs").trim();
  if (tableId !== "calloffs" && tableId !== "transactions") {
    throw new DataViewerError("invalid_input", `unknown Data Viewer table ${tableId}`);
  }
  return tableId;
}

function getPortfolioCalloffs(database: PrototypeDatabase, portfolioId: string) {
  return [...database.calloffs.values()].filter((calloff) => calloff.portfolio_id === portfolioId);
}

function getPortfolioTransactions(database: PrototypeDatabase, portfolioId: string) {
  const calloffIds = new Set(getPortfolioCalloffs(database, portfolioId).map((calloff) => calloff.calloff_id));
  return [...database.transactions.values()].filter((transaction) => calloffIds.has(transaction.calloff_id));
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
