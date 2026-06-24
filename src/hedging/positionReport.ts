import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, CustomerTransaction } from "../database/types.ts";
import { calculateComponentMwh, calculateWeightedAveragePrice } from "./calloffList.ts";
import type { PerspectiveId } from "./applicationConfig.ts";
import {
  getClassicProjectedModelRowsForPortfolioYear,
  getModernProjectedModelRowsForPortfolioYear,
  type PeaksProjectedModelTransactionRow,
} from "./peaksCalloffTransactionList.ts";
import { resolveTransactionComponentPrice } from "./componentPricing.ts";
import type { DisplayCurrency } from "./viewEconomics.ts";

export type MonthlyComponentPositionRow = {
  month: string;
  volume_mwh: number;
  price: number;
  component: string;
  transaction_count: number;
};

export type BaseloadsPositionReportRow = {
  month: string;
  reportable_base_mwh: number;
  hedge_value: number;
  effective_month_hedge_price: number | null;
  transaction_count: number;
};

export type ClassicPositionReportRow = {
  month: string;
  offpeak_mwh: number;
  peak_epad_mwh: number;
  offpeak_price: number | null;
  peak_price: number | null;
  power_value_eur: number;
  currency_covered_eur: number | null;
  currency_value_sek: number | null;
  display_currency: DisplayCurrency;
  display_value: number;
  coverage_pct: number | null;
  warnings: string[];
};

export type ModernPositionReportRow = {
  month: string;
  base_mwh: number;
  peak_epad_mwh: number;
  base_price: number | null;
  peak_price: number | null;
  power_value_eur: number;
  currency_covered_eur: number | null;
  currency_value_sek: number | null;
  display_currency: DisplayCurrency;
  display_value: number;
  coverage_pct: number | null;
  warnings: string[];
};

export type PositionReportRow = BaseloadsPositionReportRow | ClassicPositionReportRow | ModernPositionReportRow;

export function getPositionReportYears(database: PrototypeDatabase, portfolioId: string): string[] {
  const transactionYears = getPortfolioTransactions(database, portfolioId).map((transaction) => transaction.month.slice(0, 4));
  const calendarYears = [...database.calendars.values()].map((calendar) => calendar.month.slice(0, 4));
  return [...new Set([...transactionYears, ...calendarYears])].sort();
}

export function getPositionReportRows(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
  perspectiveId: PerspectiveId = "baseloads",
): PositionReportRow[] {
  if (perspectiveId === "classic") {
    return getClassicPositionReportRows(database, portfolioId, year);
  }
  if (perspectiveId === "modern") {
    return getModernPositionReportRows(database, portfolioId, year);
  }
  return getBaseloadsPositionReportRows(database, portfolioId, year);
}

export function getBaseloadsPositionReportRows(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): BaseloadsPositionReportRow[] {
  return buildBaseloadsPositionReportRowsFromTransactions(
    database,
    getPortfolioTransactions(database, portfolioId).filter((transaction) => transaction.month.startsWith(`${year}-`)),
  );
}

export function buildBaseloadsPositionReportRowsFromTransactions(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
): BaseloadsPositionReportRow[] {
  const groups = new Map<
    string,
    {
      reportable_base_mwh: number;
      hedge_value: number;
      transaction_count: number;
    }
  >();

  for (const transaction of transactions) {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
    if (!component || !isBaseloadsReportComponent(component.component)) {
      continue;
    }

    const mwh = calculateTransactionMwhByComponentHours(database, transaction, component.component);
    const price = resolveTransactionComponentPrice(database, transaction) ?? 0;
    const aggregate = groups.get(transaction.month) ?? {
      reportable_base_mwh: 0,
      hedge_value: 0,
      transaction_count: 0,
    };

    if (component.component === "base.sys") {
      aggregate.reportable_base_mwh += mwh;
    }
    aggregate.hedge_value += mwh * price;
    aggregate.transaction_count += 1;
    groups.set(transaction.month, aggregate);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, aggregate]) => ({
      month,
      reportable_base_mwh: round(aggregate.reportable_base_mwh),
      hedge_value: round(aggregate.hedge_value),
      effective_month_hedge_price: weightedPrice(aggregate.hedge_value, aggregate.reportable_base_mwh),
      transaction_count: aggregate.transaction_count,
    }));
}

export function getClassicPositionReportRows(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ClassicPositionReportRow[] {
  return buildClassicPositionReportRowsFromProjectedModelRows(getClassicProjectedModelRowsForPortfolioYear(database, portfolioId, year));
}

export function getModernPositionReportRows(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ModernPositionReportRow[] {
  return buildModernPositionReportRowsFromProjectedModelRows(getModernProjectedModelRowsForPortfolioYear(database, portfolioId, year));
}

export function getMonthlyComponentPositionRows(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): MonthlyComponentPositionRow[] {
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
): MonthlyComponentPositionRow {
  const [month, component] = groupKey.split("|");

  return {
    month,
    component,
    volume_mwh: calculateComponentMwh(database, transactions),
    price: calculateWeightedAveragePrice(database, transactions),
    transaction_count: transactions.length,
  };
}

export function buildClassicPositionReportRowsFromProjectedModelRows(
  rows: PeaksProjectedModelTransactionRow[],
): ClassicPositionReportRow[] {
  return aggregateProjectedModelRows(rows, "classic").map(([month, values]) => ({
    month,
    offpeak_mwh: round(values.first_mwh),
    peak_epad_mwh: round(values.second_mwh),
    offpeak_price: weightedPrice(values.first_display_value, values.first_mwh),
    peak_price: weightedPrice(values.second_display_value, values.second_mwh),
    power_value_eur: round(values.power_value_eur),
    currency_covered_eur: values.currency_covered_eur === 0 ? null : round(values.currency_covered_eur),
    currency_value_sek: values.currency_value_sek === 0 ? null : round(values.currency_value_sek),
    display_currency: values.display_currency,
    display_value: round(values.display_value),
    coverage_pct: values.coverage_weight === 0 ? null : round(values.coverage_value / values.coverage_weight),
    warnings: values.warnings,
  }));
}

export function buildModernPositionReportRowsFromProjectedModelRows(
  rows: PeaksProjectedModelTransactionRow[],
): ModernPositionReportRow[] {
  return aggregateProjectedModelRows(rows, "modern").map(([month, values]) => ({
    month,
    base_mwh: round(values.first_mwh),
    peak_epad_mwh: round(values.second_mwh),
    base_price: weightedPrice(values.first_display_value, values.first_mwh),
    peak_price: weightedPrice(values.second_display_value, values.second_mwh),
    power_value_eur: round(values.power_value_eur),
    currency_covered_eur: values.currency_covered_eur === 0 ? null : round(values.currency_covered_eur),
    currency_value_sek: values.currency_value_sek === 0 ? null : round(values.currency_value_sek),
    display_currency: values.display_currency,
    display_value: round(values.display_value),
    coverage_pct: values.coverage_weight === 0 ? null : round(values.coverage_value / values.coverage_weight),
    warnings: values.warnings,
  }));
}

function aggregateProjectedModelRows(
  rows: PeaksProjectedModelTransactionRow[],
  perspectiveId: "classic" | "modern",
): [
  string,
  {
    first_mwh: number;
    second_mwh: number;
    first_value: number;
    second_value: number;
    first_display_value: number;
    second_display_value: number;
    power_value_eur: number;
    currency_covered_eur: number;
    currency_value_sek: number;
    currency_fx_value: number;
    currency_fx_weight: number;
    display_value: number;
    coverage_weight: number;
    coverage_value: number;
    display_currency: DisplayCurrency;
    warnings: string[];
  },
][] {
  const groups = new Map<
    string,
    {
      first_mwh: number;
      second_mwh: number;
      first_value: number;
      second_value: number;
      first_display_value: number;
      second_display_value: number;
      power_value_eur: number;
      currency_covered_eur: number;
      currency_value_sek: number;
      currency_fx_value: number;
      currency_fx_weight: number;
      display_value: number;
      coverage_weight: number;
      coverage_value: number;
      display_currency: DisplayCurrency;
      warnings: string[];
    }
  >();

  for (const row of rows) {
    const existing = groups.get(row.month) ?? emptyProjectedAggregate();
    if (row.component === "currency.eursek") {
      existing.currency_covered_eur += row.quantity ?? 0;
      existing.currency_value_sek += row.value_sek ?? 0;
      existing.currency_fx_value += Number(row.price ?? 0) * Math.abs(row.quantity ?? 0);
      existing.currency_fx_weight += Math.abs(row.quantity ?? 0);
      groups.set(row.month, existing);
      continue;
    }

    const isFirst =
      perspectiveId === "classic"
        ? row.component === "classic.offpeak.sys"
        : row.component === "modern.base.sys" || row.component === "modern.base.epad";
    const isSecond =
      perspectiveId === "classic"
        ? row.component === "classic.peak.sys"
        : row.component === "modern.peak.sys" || row.component === "modern.peak.epad";
    if (!isFirst && !isSecond) {
      continue;
    }

    const mwh = row.component.endsWith(".epad") && perspectiveId === "modern" ? 0 : row.mwh ?? 0;
    const valueEur = row.value_eur ?? 0;
    const displayValue = valueEur;
    if (isFirst) {
      existing.first_mwh += mwh;
      existing.first_value += valueEur;
      existing.first_display_value += displayValue;
    }
    if (isSecond) {
      existing.second_mwh += mwh;
      existing.second_value += valueEur;
      existing.second_display_value += displayValue;
    }
    existing.power_value_eur += valueEur;
    existing.warnings = [...new Set([...existing.warnings, ...row.warnings])];
    groups.set(row.month, existing);
  }

  for (const values of groups.values()) {
    const fxRate = values.currency_fx_weight === 0 ? null : values.currency_fx_value / values.currency_fx_weight;
    const coverage = values.power_value_eur === 0 ? null : values.currency_covered_eur / values.power_value_eur;
    if (fxRate !== null) {
      values.first_display_value *= fxRate;
      values.second_display_value *= fxRate;
      values.display_currency = "SEK";
      values.display_value = Math.abs((coverage ?? 0) - 1) <= 0.000001 ? values.currency_value_sek : values.power_value_eur * fxRate;
    } else {
      values.display_value = values.power_value_eur;
    }
    if (coverage !== null) {
      values.coverage_weight = Math.abs(values.power_value_eur);
      values.coverage_value = coverage * values.coverage_weight;
    }
  }

  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function emptyProjectedAggregate() {
  return {
    first_mwh: 0,
    second_mwh: 0,
    first_value: 0,
    second_value: 0,
    first_display_value: 0,
    second_display_value: 0,
    power_value_eur: 0,
    currency_covered_eur: 0,
    currency_value_sek: 0,
    currency_fx_value: 0,
    currency_fx_weight: 0,
    display_value: 0,
    coverage_weight: 0,
    coverage_value: 0,
    display_currency: "EUR" as DisplayCurrency,
    warnings: [] as string[],
  };
}

function getPortfolioCalloffs(database: PrototypeDatabase, portfolioId: string): Calloff[] {
  return [...database.calloffs.values()].filter((calloff) => calloff.portfolio_id === portfolioId);
}

function getPortfolioTransactions(database: PrototypeDatabase, portfolioId: string): CustomerTransaction[] {
  const calloffIds = new Set(
    getPortfolioCalloffs(database, portfolioId).map((calloff) => calloff.calloff_id),
  );

  return [...database.transactions.values()].filter((transaction) => calloffIds.has(transaction.calloff_id));
}

function weightedPrice(value: number, mwh: number): number | null {
  if (Math.abs(mwh) <= 0.000001) {
    return null;
  }
  return roundPrice(value / mwh);
}

function isBaseloadsReportComponent(component: string): boolean {
  return component.startsWith("base.") || component.startsWith("peak.");
}

function calculateTransactionMwhByComponentHours(
  database: PrototypeDatabase,
  transaction: CustomerTransaction,
  componentCode: string,
): number {
  if (transaction.quantity_type === "EUR") {
    return 0;
  }

  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === transaction.month);
  if (!calendar) {
    throw new Error(`Missing calendar for ${transaction.month}`);
  }

  const quantity = transaction.quantity_type === "MW" && transaction.quantity !== undefined ? transaction.quantity : transaction.mw;
  if (componentCode.startsWith("peak.")) {
    return quantity * calendar.peak_h;
  }
  return quantity * calendar.total_h;
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function roundPrice(value: number): number {
  const rounded = round(value);
  const twoDecimals = Number(value.toFixed(2));
  return Math.abs(rounded - twoDecimals) <= 0.000002 ? twoDecimals : rounded;
}
