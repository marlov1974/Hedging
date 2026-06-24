import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerTransaction, ProductConfigurationComponent } from "../database/types.ts";
import { formatDerivativeName } from "./derivativeNames.ts";
import { isBaseloadsPortfolio } from "./features.ts";
import { resolveTransactionComponentPrice } from "./componentPricing.ts";

export type BaseloadsCalloffListRow = {
  date: string;
  synthetic_derivative_name: string;
  component: string;
  mwh: number;
  mw: number;
  price: number;
  calloff_id: string;
  transaction_count: number;
};

export function getBaseloadsCalloffListRows(database: PrototypeDatabase, portfolioId: string): BaseloadsCalloffListRow[] {
  if (!isBaseloadsPortfolio(database, portfolioId)) {
    return [];
  }

  const portfolio = database.portfolios.get(portfolioId);
  if (!portfolio) {
    return [];
  }

  const baseloadsProduct = [...database.productConfigurations.values()].find((product) => product.name === "Baseloads");
  if (!baseloadsProduct) {
    return [];
  }

  return [...database.calloffs.values()]
    .filter((calloff) => calloff.portfolio_id === portfolioId && calloff.product_id === baseloadsProduct.product_id)
    .sort((left, right) => left.date.localeCompare(right.date) || left.calloff_id.localeCompare(right.calloff_id))
    .flatMap((calloff) => {
      const transactions = [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloff.calloff_id);
      return groupTransactionsByComponent(database, transactions).map((group) => {
        const months = group.transactions.map((transaction) => transaction.month);
        const mwh = calculateComponentMwh(database, group.transactions);
        return {
          date: calloff.date,
          synthetic_derivative_name: resolveSyntheticDerivativeName(group.transactions, group.component.component, months, portfolio.price_area),
          component: group.component.component,
          mwh,
          mw: calculateComponentMw(database, group.transactions, mwh),
          price: calculateWeightedAveragePrice(database, group.transactions),
          calloff_id: calloff.calloff_id,
          transaction_count: group.transactions.length,
        };
      });
    });
}

export function calculateComponentMwh(database: PrototypeDatabase, transactions: CustomerTransaction[]): number {
  return transactions.reduce((sum, transaction) => {
    const calendar = findCalendarForMonth(database, transaction.month);
    if (!calendar) {
      throw new Error(`Missing calendar for ${transaction.month}`);
    }

    return sum + transaction.mw * calendar.total_h;
  }, 0);
}

export function calculateComponentMw(database: PrototypeDatabase, transactions: CustomerTransaction[], mwh?: number): number {
  const hours = transactions.reduce((sum, transaction) => {
    const calendar = findCalendarForMonth(database, transaction.month);
    if (!calendar) {
      throw new Error(`Missing calendar for ${transaction.month}`);
    }
    return sum + calendar.total_h;
  }, 0);

  if (hours === 0) {
    return 0;
  }

  return (mwh ?? calculateComponentMwh(database, transactions)) / hours;
}

export function calculateWeightedAveragePrice(database: PrototypeDatabase, transactions: CustomerTransaction[]): number {
  let weightedPriceSum = 0;
  let mwhSum = 0;

  for (const transaction of transactions) {
    const calendar = findCalendarForMonth(database, transaction.month);
    if (!calendar) {
      throw new Error(`Missing calendar for ${transaction.month}`);
    }

    const price = resolveTransactionComponentPrice(database, transaction);
    if (price === null) {
      throw new Error(`Missing price component for ${transaction.productcomponent_id}`);
    }

    const mwh = transaction.mw * calendar.total_h;
    weightedPriceSum += mwh * price;
    mwhSum += mwh;
  }

  if (mwhSum === 0) {
    return 0;
  }

  return weightedPriceSum / mwhSum;
}

function resolveSyntheticDerivativeName(
  transactions: CustomerTransaction[],
  component: string,
  months: string[],
  priceArea: string,
): string {
  const explicitNames = [...new Set(transactions.map((transaction) => transaction.synthetic_derivative_name).filter(Boolean))];
  if (explicitNames.length === 1) {
    return explicitNames[0] ?? formatDerivativeName(component, months, priceArea);
  }
  return formatDerivativeName(component, months, priceArea);
}

function groupTransactionsByComponent(database: PrototypeDatabase, transactions: CustomerTransaction[]) {
  const groups = new Map<string, { component: ProductConfigurationComponent; transactions: CustomerTransaction[] }>();

  for (const transaction of transactions) {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
    if (!component) {
      continue;
    }

    const existing = groups.get(component.component) ?? { component, transactions: [] };
    existing.transactions.push(transaction);
    groups.set(component.component, existing);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      transactions: group.transactions.sort((left, right) => left.month.localeCompare(right.month)),
    }))
    .sort((left, right) => left.component.component.localeCompare(right.component.component));
}

function findCalendarForMonth(database: PrototypeDatabase, month: string) {
  return [...database.calendars.values()].find((calendar) => calendar.month === month);
}
