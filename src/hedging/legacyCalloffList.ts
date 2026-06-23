import { canonicalProductPackageName } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, CustomerTransaction } from "../database/types.ts";
import { isPeaksClassicPortfolio } from "./applicationConfig.ts";
import { projectPeaksCalloffMonth, type PeaksMonthlyProjection } from "./peaksCalloffTransactionList.ts";

export type LegacyCalloffListBlock = "Offpeak" | "Peak";

export type LegacyCalloffListRow = {
  date: string;
  calloff_id: string;
  period: string;
  block: LegacyCalloffListBlock;
  mw: number | null;
  mwh: number;
  price: number | null;
  value: number;
  warnings: string[];
};

type MonthlyProjection = LegacyCalloffListRow & {
  hours: number;
};

export function getLegacyCalloffListRows(database: PrototypeDatabase, portfolioId: string): LegacyCalloffListRow[] {
  if (!isPeaksClassicPortfolio(database, portfolioId)) {
    return [];
  }

  return [...database.calloffs.values()]
    .filter((calloff) => calloff.portfolio_id === portfolioId && productPackageName(database, calloff.product_id) === "Peaks.Classic")
    .sort((left, right) => left.date.localeCompare(right.date) || left.calloff_id.localeCompare(right.calloff_id))
    .flatMap((calloff) => aggregateCalloffRows(projectCalloffMonths(database, calloff)));
}

function projectCalloffMonths(database: PrototypeDatabase, calloff: Calloff): MonthlyProjection[] {
  const transactions = [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloff.calloff_id);
  const months = [...new Set(transactions.map((transaction) => transaction.month))].sort();
  if (months.length === 0) {
    return projectLegacyCalloffMonth(database, calloff, []);
  }
  return months.flatMap((month) =>
    projectLegacyCalloffMonth(
      database,
      calloff,
      transactions.filter((transaction) => transaction.month === month),
    ),
  );
}

export function projectLegacyCalloffMonth(
  database: PrototypeDatabase,
  calloff: Calloff,
  transactions: CustomerTransaction[],
): MonthlyProjection[] {
  const projection = projectPeaksCalloffMonth(database, calloff, transactions);
  return [
    legacyRowFromProjection(projection, "Offpeak"),
    legacyRowFromProjection(projection, "Peak"),
  ];
}

function legacyRowFromProjection(projection: PeaksMonthlyProjection, block: LegacyCalloffListBlock): MonthlyProjection {
  if (block === "Offpeak") {
    return {
      date: projection.date,
      calloff_id: projection.calloff_id,
      period: projection.month,
      block,
      mw: projection.classic_offpeak_mw,
      mwh: projection.classic_offpeak_mwh,
      price: projection.classic_offpeak_price,
      value: projection.classic_offpeak_value,
      warnings: projection.warnings,
      hours: projection.offpeak_h,
    };
  }

  return {
    date: projection.date,
    calloff_id: projection.calloff_id,
    period: projection.month,
    block,
    mw: projection.classic_peak_mw,
    mwh: projection.classic_peak_mwh,
    price: projection.classic_peak_price,
    value: projection.classic_peak_value,
    warnings: projection.warnings,
    hours: projection.peak_h,
  };
}

function aggregateCalloffRows(rows: MonthlyProjection[]): LegacyCalloffListRow[] {
  const groups = new Map<LegacyCalloffListBlock, MonthlyProjection[]>();
  for (const row of rows) {
    groups.set(row.block, [...(groups.get(row.block) ?? []), row]);
  }

  return (["Offpeak", "Peak"] as const)
    .map((block) => groups.get(block) ?? [])
    .filter((group) => group.length > 0)
    .map((group) => {
      const mwh = group.reduce((sum, row) => sum + row.mwh, 0);
      const value = group.reduce((sum, row) => sum + row.value, 0);
      const hours = group.reduce((sum, row) => sum + row.hours, 0);
      const warnings = [...new Set(group.flatMap((row) => row.warnings))];
      const period = group.length === 1 ? group[0].period : `${group[0].period} - ${group[group.length - 1].period}`;
      return {
        date: group[0].date,
        calloff_id: group[0].calloff_id,
        period,
        block: group[0].block,
        mw: hours === 0 ? null : roundProjection(mwh / hours),
        mwh: roundProjection(mwh),
        price: mwh === 0 ? null : roundProjection(value / mwh),
        value: roundProjection(value),
        warnings,
      };
    });
}

function productPackageName(database: PrototypeDatabase, productId: string): string | undefined {
  const product = database.productConfigurations.get(productId);
  return product ? canonicalProductPackageName(product.name) : undefined;
}

function roundProjection(value: number): number {
  return Number(value.toFixed(6));
}
