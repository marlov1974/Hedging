import { canonicalProductPackageName } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, CustomerTransaction } from "../database/types.ts";

const EPSILON = 0.000001;

type ProjectionKind = "classic" | "modern";

export type PeaksClassicCalloffTransactionRow = {
  date: string;
  calloff_id: string;
  period: string;
  offpeak_mwh: number;
  peak_mwh: number;
  offpeak_price: number | null;
  peak_price: number | null;
  canonical_total_value: number;
  projected_total_value: number;
  warnings: string[];
};

export type PeaksModernCalloffTransactionRow = {
  date: string;
  calloff_id: string;
  period: string;
  base_mwh: number;
  peak_mwh: number;
  base_price: number | null;
  peak_price: number | null;
  canonical_total_value: number;
  projected_total_value: number;
  warnings: string[];
};

export type PeaksMonthlyProjection = {
  date: string;
  calloff_id: string;
  month: string;
  total_h: number;
  peak_h: number;
  offpeak_h: number;
  canonical_base_mw: number | null;
  allocation_peak_mw: number | null;
  canonical_peak_mw: number | null;
  canonical_base_price: number;
  canonical_peak_price: number;
  canonical_base_mwh: number;
  canonical_peak_mwh: number;
  canonical_base_value: number;
  canonical_peak_value: number;
  canonical_total_value: number;
  classic_offpeak_mw: number | null;
  classic_peak_mw: number | null;
  classic_offpeak_mwh: number;
  classic_peak_mwh: number;
  classic_offpeak_price: number | null;
  classic_peak_price: number | null;
  classic_offpeak_value: number;
  classic_peak_value: number;
  classic_total_value: number;
  modern_base_mw: number | null;
  modern_peak_mw: number | null;
  modern_base_mwh: number;
  modern_peak_mwh: number;
  modern_base_price: number | null;
  modern_peak_price: number | null;
  modern_base_value: number;
  modern_peak_value: number;
  modern_total_value: number;
  warnings: string[];
};

export function getPeaksClassicCalloffTransactionRows(
  database: PrototypeDatabase,
  portfolioId: string,
): PeaksClassicCalloffTransactionRow[] {
  return getPeaksCalloffs(database, portfolioId).map((calloff) =>
    aggregateClassicProjection(projectCalloffMonths(database, calloff)),
  );
}

export function getPeaksModernCalloffTransactionRows(
  database: PrototypeDatabase,
  portfolioId: string,
): PeaksModernCalloffTransactionRow[] {
  return getPeaksCalloffs(database, portfolioId).map((calloff) =>
    aggregateModernProjection(projectCalloffMonths(database, calloff)),
  );
}

export function projectPeaksCalloffMonth(
  database: PrototypeDatabase,
  calloff: Calloff,
  transactions: CustomerTransaction[],
): PeaksMonthlyProjection {
  const month = transactions[0]?.month ?? calloff.delivery_start_month;
  const warnings: string[] = [];
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    warnings.push("missing calendar");
    return emptyMonthlyProjection(calloff, month, warnings);
  }

  const offpeakH = calendar.total_h - calendar.peak_h;
  if (calendar.peak_h === 0 || offpeakH === 0) {
    warnings.push("zero peak or offpeak hours");
    return emptyMonthlyProjection(calloff, month, warnings);
  }

  const baseMw = selectComponentMw(database, transactions, ["base.sys"], ["base.epad"], "base", warnings);
  const allocationPeakMw = selectAllocationPeakMw(database, transactions, warnings);
  const peakMw = selectComponentMw(
    database,
    transactions,
    ["peak.sys", "peak.premium.sys", "peak.modern.sys"],
    ["peak.epad", "peak.premium.epad", "peak.modern.epad"],
    "peak",
    warnings,
  );
  const basePrice = sumTransactionComponentPrices(database, transactions, ["base.sys", "base.epad"], warnings, "base price");
  const peakPrice = sumTransactionComponentPrices(
    database,
    transactions,
    ["peak.sys", "peak.epad", "peak.premium.sys", "peak.premium.epad", "peak.modern.sys", "peak.modern.epad"],
    warnings,
    "peak price",
  );

  if (baseMw === null || allocationPeakMw === null || peakMw === null) {
    return emptyMonthlyProjection(calloff, month, warnings, calendar.total_h, calendar.peak_h, offpeakH);
  }

  if (Math.abs(allocationPeakMw - (baseMw + peakMw)) > EPSILON) {
    warnings.push("canonical relation mismatch");
  }

  const canonicalBaseMwh = baseMw * calendar.total_h;
  const canonicalPeakMwh = peakMw * calendar.peak_h;
  const canonicalBaseValue = canonicalBaseMwh * basePrice;
  const canonicalPeakValue = canonicalPeakMwh * peakPrice;
  const canonicalTotalValue = canonicalBaseValue + canonicalPeakValue;

  const classicOffpeakMwh = canonicalBaseMwh - allocationPeakMw * calendar.peak_h;
  const classicPeakMwh = allocationPeakMw * calendar.peak_h;
  const classicOffpeakMw = classicOffpeakMwh / offpeakH;
  const classicPeakMw = allocationPeakMw;
  const classicOffpeakPrice = basePrice;
  const classicOffpeakValue = classicOffpeakMwh * classicOffpeakPrice;
  const classicPeakPrice =
    classicPeakMwh === 0 ? null : (canonicalTotalValue - classicOffpeakValue) / classicPeakMwh;
  const classicPeakValue = classicPeakPrice === null ? 0 : classicPeakMwh * classicPeakPrice;

  const modernBaseMw = classicOffpeakMw;
  const modernPeakMw = classicPeakMw - modernBaseMw;
  const modernBaseMwh = modernBaseMw * calendar.total_h;
  const modernPeakMwh = modernPeakMw * calendar.peak_h;
  const modernBasePrice = basePrice;
  const modernBaseValue = modernBaseMwh * modernBasePrice;
  const modernPeakPrice =
    modernPeakMwh === 0 ? null : (canonicalTotalValue - modernBaseValue) / modernPeakMwh;
  const modernPeakValue = modernPeakPrice === null ? 0 : modernPeakMwh * modernPeakPrice;

  if (classicPeakPrice === null) {
    warnings.push("zero classic peak MWh");
  }
  if (modernPeakPrice === null) {
    warnings.push("zero modern peak MWh");
  }

  return {
    date: calloff.date,
    calloff_id: calloff.calloff_id,
    month,
    total_h: calendar.total_h,
    peak_h: calendar.peak_h,
    offpeak_h: offpeakH,
    canonical_base_mw: roundProjection(baseMw),
    allocation_peak_mw: roundProjection(allocationPeakMw),
    canonical_peak_mw: roundProjection(peakMw),
    canonical_base_price: roundProjection(basePrice),
    canonical_peak_price: roundProjection(peakPrice),
    canonical_base_mwh: roundProjection(canonicalBaseMwh),
    canonical_peak_mwh: roundProjection(canonicalPeakMwh),
    canonical_base_value: roundProjection(canonicalBaseValue),
    canonical_peak_value: roundProjection(canonicalPeakValue),
    canonical_total_value: roundProjection(canonicalTotalValue),
    classic_offpeak_mw: roundProjection(classicOffpeakMw),
    classic_peak_mw: roundProjection(classicPeakMw),
    classic_offpeak_mwh: roundProjection(classicOffpeakMwh),
    classic_peak_mwh: roundProjection(classicPeakMwh),
    classic_offpeak_price: roundProjection(classicOffpeakPrice),
    classic_peak_price: classicPeakPrice === null ? null : roundProjection(classicPeakPrice),
    classic_offpeak_value: roundProjection(classicOffpeakValue),
    classic_peak_value: roundProjection(classicPeakValue),
    classic_total_value: roundProjection(classicOffpeakValue + classicPeakValue),
    modern_base_mw: roundProjection(modernBaseMw),
    modern_peak_mw: roundProjection(modernPeakMw),
    modern_base_mwh: roundProjection(modernBaseMwh),
    modern_peak_mwh: roundProjection(modernPeakMwh),
    modern_base_price: roundProjection(modernBasePrice),
    modern_peak_price: modernPeakPrice === null ? null : roundProjection(modernPeakPrice),
    modern_base_value: roundProjection(modernBaseValue),
    modern_peak_value: roundProjection(modernPeakValue),
    modern_total_value: roundProjection(modernBaseValue + modernPeakValue),
    warnings,
  };
}

function getPeaksCalloffs(database: PrototypeDatabase, portfolioId: string): Calloff[] {
  return [...database.calloffs.values()]
    .filter((calloff) => calloff.portfolio_id === portfolioId && isPeaksProductPackage(productPackageName(database, calloff.product_id)))
    .sort((left, right) => left.date.localeCompare(right.date) || left.calloff_id.localeCompare(right.calloff_id));
}

function projectCalloffMonths(database: PrototypeDatabase, calloff: Calloff): PeaksMonthlyProjection[] {
  const transactions = [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloff.calloff_id);
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

function aggregateClassicProjection(rows: PeaksMonthlyProjection[]): PeaksClassicCalloffTransactionRow {
  const warnings = aggregateWarnings(rows);
  const offpeakMwh = sum(rows, "classic_offpeak_mwh");
  const peakMwh = sum(rows, "classic_peak_mwh");
  const offpeakValue = sum(rows, "classic_offpeak_value");
  const peakValue = sum(rows, "classic_peak_value");

  return {
    date: rows[0].date,
    calloff_id: rows[0].calloff_id,
    period: periodForRows(rows),
    offpeak_mwh: roundProjection(offpeakMwh),
    peak_mwh: roundProjection(peakMwh),
    offpeak_price: divideOrNull(offpeakValue, offpeakMwh, warnings, "zero classic offpeak MWh"),
    peak_price: divideOrNull(peakValue, peakMwh, warnings, "zero classic peak MWh"),
    canonical_total_value: roundProjection(sum(rows, "canonical_total_value")),
    projected_total_value: roundProjection(offpeakValue + peakValue),
    warnings,
  };
}

function aggregateModernProjection(rows: PeaksMonthlyProjection[]): PeaksModernCalloffTransactionRow {
  const warnings = aggregateWarnings(rows);
  const baseMwh = sum(rows, "modern_base_mwh");
  const peakMwh = sum(rows, "modern_peak_mwh");
  const baseValue = sum(rows, "modern_base_value");
  const peakValue = sum(rows, "modern_peak_value");

  return {
    date: rows[0].date,
    calloff_id: rows[0].calloff_id,
    period: periodForRows(rows),
    base_mwh: roundProjection(baseMwh),
    peak_mwh: roundProjection(peakMwh),
    base_price: divideOrNull(baseValue, baseMwh, warnings, "zero modern base MWh"),
    peak_price: divideOrNull(peakValue, peakMwh, warnings, "zero modern peak MWh"),
    canonical_total_value: roundProjection(sum(rows, "canonical_total_value")),
    projected_total_value: roundProjection(baseValue + peakValue),
    warnings,
  };
}

function selectComponentMw(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  sysComponents: string[],
  epadComponents: string[],
  label: string,
  warnings: string[],
): number | null {
  const sys = findFirstComponentTransaction(database, transactions, sysComponents);
  const epad = findFirstComponentTransaction(database, transactions, epadComponents);
  if (!sys && !epad) {
    warnings.push(`missing ${label}`);
    return null;
  }
  if (!sys || !epad) {
    warnings.push(`partial ${label}`);
    return (sys ?? epad)?.mw ?? null;
  }
  if (Math.abs(sys.mw - epad.mw) > EPSILON) {
    warnings.push(`mismatched ${label} MW`);
  }
  return sys.mw;
}

function selectAllocationPeakMw(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  warnings: string[],
): number | null {
  const sys = findFirstComponentTransaction(database, transactions, ["allocation.peak.sys"]);
  const epad = findFirstComponentTransaction(database, transactions, ["allocation.peak.epad"]);
  if (sys || epad) {
    if (!sys || !epad) {
      warnings.push("partial allocation peak");
      return (sys ?? epad)?.mw ?? null;
    }
    if (Math.abs(sys.mw - epad.mw) > EPSILON) {
      warnings.push("mismatched allocation peak MW");
    }
    return sys.mw;
  }

  const legacy = findFirstComponentTransaction(database, transactions, ["allocation.peak"]);
  if (legacy) {
    warnings.push("legacy allocation.peak alias");
    return legacy.mw;
  }
  warnings.push("missing allocation peak");
  return null;
}

function sumTransactionComponentPrices(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  componentCodes: string[],
  warnings: string[],
  label: string,
): number {
  const components = transactions
    .map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id))
    .filter((component) => component && componentCodes.includes(component.component));
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

function findFirstComponentTransaction(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  componentCodes: string[],
): CustomerTransaction | undefined {
  return transactions.find((transaction) => {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
    return component ? componentCodes.includes(component.component) : false;
  });
}

function emptyMonthlyProjection(
  calloff: Calloff,
  month: string,
  warnings: string[],
  totalH = 0,
  peakH = 0,
  offpeakH = 0,
): PeaksMonthlyProjection {
  return {
    date: calloff.date,
    calloff_id: calloff.calloff_id,
    month,
    total_h: totalH,
    peak_h: peakH,
    offpeak_h: offpeakH,
    canonical_base_mw: null,
    allocation_peak_mw: null,
    canonical_peak_mw: null,
    canonical_base_price: 0,
    canonical_peak_price: 0,
    canonical_base_mwh: 0,
    canonical_peak_mwh: 0,
    canonical_base_value: 0,
    canonical_peak_value: 0,
    canonical_total_value: 0,
    classic_offpeak_mw: null,
    classic_peak_mw: null,
    classic_offpeak_mwh: 0,
    classic_peak_mwh: 0,
    classic_offpeak_price: null,
    classic_peak_price: null,
    classic_offpeak_value: 0,
    classic_peak_value: 0,
    classic_total_value: 0,
    modern_base_mw: null,
    modern_peak_mw: null,
    modern_base_mwh: 0,
    modern_peak_mwh: 0,
    modern_base_price: null,
    modern_peak_price: null,
    modern_base_value: 0,
    modern_peak_value: 0,
    modern_total_value: 0,
    warnings,
  };
}

function productPackageName(database: PrototypeDatabase, productId: string): string | undefined {
  const product = database.productConfigurations.get(productId);
  return product ? canonicalProductPackageName(product.name) : undefined;
}

function isPeaksProductPackage(productPackage: string | undefined): boolean {
  return productPackage === "Peaks.Classic" || productPackage === "Peaks.Modern";
}

function aggregateWarnings(rows: PeaksMonthlyProjection[]): string[] {
  return [...new Set(rows.flatMap((row) => row.warnings))];
}

function periodForRows(rows: PeaksMonthlyProjection[]): string {
  return rows.length === 1 ? rows[0].month : `${rows[0].month} - ${rows[rows.length - 1].month}`;
}

function divideOrNull(numerator: number, denominator: number, warnings: string[], warning: string): number | null {
  if (Math.abs(denominator) <= EPSILON) {
    warnings.push(warning);
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
