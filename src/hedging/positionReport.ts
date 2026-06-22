import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerTransaction } from "../database/types.ts";
import { calculateComponentMwh, calculateWeightedAveragePrice } from "./calloffList.ts";

export type PositionReportRow = {
  month: string;
  volume_mwh: number;
  price: number;
  component: string;
  transaction_count: number;
};

export function getPositionReportYears(database: PrototypeDatabase, portfolioId: string): string[] {
  const transactionYears = getPortfolioTransactions(database, portfolioId).map((transaction) => transaction.month.slice(0, 4));
  const calendarYears = [...database.calendars.values()].map((calendar) => calendar.month.slice(0, 4));
  return [...new Set([...transactionYears, ...calendarYears])].sort();
}

export function getPositionReportRows(database: PrototypeDatabase, portfolioId: string, year: string): PositionReportRow[] {
  const groups = new Map<string, CustomerTransaction[]>();

  for (const transaction of getPortfolioTransactions(database, portfolioId)) {
    if (!transaction.month.startsWith(`${year}-`)) {
      continue;
    }

    const component = database.productConfigurationComponents.get(transaction.productcomponent_id)?.component;
    if (!component) {
      continue;
    }

    const groupKey = `${transaction.month}|${component}`;
    const transactions = groups.get(groupKey) ?? [];
    transactions.push(transaction);
    groups.set(groupKey, transactions);
  }

  return [...groups.entries()]
    .map(([groupKey, transactions]) => calculateMonthlyComponentPosition(database, groupKey, transactions))
    .sort((left, right) => left.month.localeCompare(right.month) || left.component.localeCompare(right.component));
}

export function calculateMonthlyComponentPosition(
  database: PrototypeDatabase,
  groupKey: string,
  transactions: CustomerTransaction[],
): PositionReportRow {
  const [month, component] = groupKey.split("|");

  return {
    month,
    component,
    volume_mwh: calculateComponentMwh(database, transactions),
    price: calculateWeightedAveragePrice(database, transactions),
    transaction_count: transactions.length,
  };
}

function getPortfolioTransactions(database: PrototypeDatabase, portfolioId: string): CustomerTransaction[] {
  const calloffIds = new Set(
    [...database.calloffs.values()]
      .filter((calloff) => calloff.portfolio_id === portfolioId)
      .map((calloff) => calloff.calloff_id),
  );

  return [...database.transactions.values()].filter((transaction) => calloffIds.has(transaction.calloff_id));
}
