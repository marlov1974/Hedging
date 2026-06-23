import { canonicalProductPackageName } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, CustomerTransaction } from "../database/types.ts";
import { isPeaksClassicPortfolio } from "./applicationConfig.ts";

const EPSILON = 0.000001;

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
  const month = transactions[0]?.month ?? calloff.delivery_start_month;
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  const warnings: string[] = [];

  if (!calendar) {
    return errorRows(calloff, month, "missing calendar");
  }

  const offpeakHours = calendar.total_h - calendar.peak_h;
  if (calendar.peak_h === 0 || offpeakHours === 0) {
    return errorRows(calloff, month, "zero peak or offpeak hours");
  }

  const base = selectComponentMw(database, transactions, ["base.sys", "base.epad"], "base", warnings);
  const allocationPeak = findComponentTransaction(database, transactions, "allocation.peak");
  const peakPremium = selectComponentMw(database, transactions, ["peak.premium.sys", "peak.premium.epad", "peak.modern.sys", "peak.modern.epad"], "peak premium", warnings);

  if (base.mw === null || !allocationPeak) {
    if (!allocationPeak) {
      warnings.push("missing allocation.peak");
    }
    return errorRows(calloff, month, warnings.join("; "));
  }

  const basePrice = sumComponentPrices(database, calloff.product_id, ["base.sys", "base.epad"], warnings, "base price");
  const peakPremiumPrice = sumComponentPrices(
    database,
    calloff.product_id,
    ["peak.premium.sys", "peak.premium.epad", "peak.modern.sys", "peak.modern.epad"],
    warnings,
    "peak premium price",
  );

  const baseMwh = base.mw * calendar.total_h;
  const legacyPeakMwh = allocationPeak.mw * calendar.peak_h;
  const legacyOffpeakMwh = baseMwh - legacyPeakMwh;
  const legacyOffpeakMw = legacyOffpeakMwh / offpeakHours;
  const legacyPeakMw = allocationPeak.mw;
  const peakPremiumMwh = (peakPremium.mw ?? 0) * calendar.peak_h;
  const baseValue = baseMwh * basePrice;
  const peakPremiumValue = peakPremiumMwh * peakPremiumPrice;
  const totalValue = baseValue + peakPremiumValue;
  const legacyOffpeakPrice = basePrice;
  const legacyOffpeakValue = legacyOffpeakMwh * legacyOffpeakPrice;
  const legacyPeakPrice = legacyPeakMwh === 0 ? null : (totalValue - legacyOffpeakValue) / legacyPeakMwh;
  const legacyPeakValue = legacyPeakPrice === null ? 0 : legacyPeakMwh * legacyPeakPrice;

  if (legacyOffpeakMwh < 0) {
    warnings.push("negative offpeak MWh");
  }
  if (legacyPeakPrice === null) {
    warnings.push("zero peak MWh");
  }

  return [
    {
      date: calloff.date,
      calloff_id: calloff.calloff_id,
      period: month,
      block: "Offpeak",
      mw: roundProjection(legacyOffpeakMw),
      mwh: roundProjection(legacyOffpeakMwh),
      price: roundProjection(legacyOffpeakPrice),
      value: roundProjection(legacyOffpeakValue),
      warnings,
      hours: offpeakHours,
    },
    {
      date: calloff.date,
      calloff_id: calloff.calloff_id,
      period: month,
      block: "Peak",
      mw: roundProjection(legacyPeakMw),
      mwh: roundProjection(legacyPeakMwh),
      price: legacyPeakPrice === null ? null : roundProjection(legacyPeakPrice),
      value: roundProjection(legacyPeakValue),
      warnings,
      hours: calendar.peak_h,
    },
  ];
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

function selectComponentMw(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  components: string[],
  label: string,
  warnings: string[],
): { mw: number | null } {
  const rows = components.map((component) => findComponentTransaction(database, transactions, component)).filter(Boolean) as CustomerTransaction[];
  if (rows.length === 0) {
    warnings.push(`missing ${label}`);
    return { mw: null };
  }
  if (rows.length === 1) {
    warnings.push(`single ${label} component`);
    return { mw: rows[0].mw };
  }
  const [first, second] = rows;
  if (Math.abs(first.mw - second.mw) > EPSILON) {
    warnings.push(`mismatched ${label} MW`);
  }
  return { mw: first.mw };
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

function sumComponentPrices(
  database: PrototypeDatabase,
  productId: string,
  componentCodes: string[],
  warnings: string[],
  label: string,
): number {
  const components = [...database.productConfigurationComponents.values()].filter(
    (component) => component.product_id === productId && componentCodes.includes(component.component),
  );
  let price = 0;
  for (const component of components) {
    const priceComponent = [...database.priceComponents.values()].find(
      (candidate) => candidate.productcomponent_id === component.productcomponent_id,
    );
    if (!priceComponent) {
      warnings.push(`missing ${label} component ${component.component}`);
      continue;
    }
    price += priceComponent.price;
  }
  if (components.length < 2) {
    warnings.push(`partial ${label}`);
  }
  return price;
}

function errorRows(calloff: Calloff, period: string, warning: string): MonthlyProjection[] {
  const warnings = [warning].filter(Boolean);
  return [
    {
      date: calloff.date,
      calloff_id: calloff.calloff_id,
      period,
      block: "Offpeak",
      mw: null,
      mwh: 0,
      price: null,
      value: 0,
      warnings,
      hours: 0,
    },
    {
      date: calloff.date,
      calloff_id: calloff.calloff_id,
      period,
      block: "Peak",
      mw: null,
      mwh: 0,
      price: null,
      value: 0,
      warnings,
      hours: 0,
    },
  ];
}

function productPackageName(database: PrototypeDatabase, productId: string): string | undefined {
  const product = database.productConfigurations.get(productId);
  return product ? canonicalProductPackageName(product.name) : undefined;
}

function roundProjection(value: number): number {
  return Number(value.toFixed(6));
}
