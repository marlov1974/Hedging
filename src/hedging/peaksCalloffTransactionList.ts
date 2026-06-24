import { canonicalProductPackageName, componentCodeConcept, type ComponentCodeConcept } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, CustomerTransaction } from "../database/types.ts";
import { resolveTransactionComponentPrice } from "./componentPricing.ts";
import { applyDisplayCurrency, getTransactionViewEconomics, type DisplayCurrency } from "./viewEconomics.ts";

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
  value_eur: number;
  fx_rate: number | null;
  value_sek: number | null;
  display_currency: DisplayCurrency;
  display_value: number;
  display_price: number | null;
  coverage_pct: number | null;
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
  value_eur: number;
  fx_rate: number | null;
  value_sek: number | null;
  display_currency: DisplayCurrency;
  display_value: number;
  display_price: number | null;
  coverage_pct: number | null;
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
  display_currency: DisplayCurrency;
  fx_rate: number | null;
  value_sek: number | null;
  display_value: number;
  display_price: number | null;
  coverage_pct: number | null;
  warnings: string[];
};

export type PeaksProjectedModelTransactionRow = {
  calloff_id: string;
  month: string;
  component: string;
  component_concept: ComponentCodeConcept;
  quantity: number | null;
  quantity_type: "MW" | "EUR" | null;
  mw: number | null;
  mwh: number | null;
  price: number | null;
  price_type: "EUR_PER_MWH" | "SEK_PER_EUR" | null;
  factor: number | null;
  factor_type: "Q_FACTOR" | null;
  value_eur: number | null;
  value_sek: number | null;
  value: number;
  source_components: string;
  warnings: string[];
};

export type PeaksClassicProjectedModelRow = PeaksProjectedModelTransactionRow;
export type PeaksModernProjectedModelRow = PeaksProjectedModelTransactionRow;

export function getPeaksClassicCalloffTransactionRows(
  database: PrototypeDatabase,
  portfolioId: string,
): PeaksClassicCalloffTransactionRow[] {
  return aggregateClassicProjectedModelRows(database, getClassicProjectedModelRowsForPortfolio(database, portfolioId));
}

export function getPeaksModernCalloffTransactionRows(
  database: PrototypeDatabase,
  portfolioId: string,
): PeaksModernCalloffTransactionRow[] {
  return aggregateModernProjectedModelRows(database, getModernProjectedModelRowsForPortfolio(database, portfolioId));
}

export function getClassicProjectedModelRowsForPortfolio(
  database: PrototypeDatabase,
  portfolioId: string,
): PeaksClassicProjectedModelRow[] {
  return getPeaksCalloffs(database, portfolioId).flatMap((calloff) => projectClassicModelRowsForCalloff(database, calloff));
}

export function getModernProjectedModelRowsForPortfolio(
  database: PrototypeDatabase,
  portfolioId: string,
): PeaksModernProjectedModelRow[] {
  return getPeaksCalloffs(database, portfolioId).flatMap((calloff) => projectModernModelRowsForCalloff(database, calloff));
}

export function getClassicProjectedModelRowsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): PeaksClassicProjectedModelRow[] {
  return getClassicProjectedModelRowsForPortfolio(database, portfolioId).filter((row) => row.month.startsWith(`${year}-`));
}

export function getModernProjectedModelRowsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): PeaksModernProjectedModelRow[] {
  return getModernProjectedModelRowsForPortfolio(database, portfolioId).filter((row) => row.month.startsWith(`${year}-`));
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
  const powerQValueEur = transactions.reduce((sum, transaction) => {
    const economics = getTransactionViewEconomics(database, transaction);
    return economics.component_category === "currency" ? sum : sum + (economics.q_value_eur ?? 0);
  }, 0);
  const display = applyDisplayCurrency(database, {
    calloff,
    transactions,
    valueEur: canonicalTotalValue,
    coverageValueEur: powerQValueEur,
    mwh: canonicalBaseMwh + canonicalPeakMwh,
  });

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
    display_currency: display.display_currency,
    fx_rate: display.fx_rate,
    value_sek: display.value_sek,
    display_value: display.display_value,
    display_price: display.display_price,
    coverage_pct: display.coverage_pct,
    warnings: [...new Set([...warnings, ...display.warnings])],
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

function projectClassicModelRowsForCalloff(database: PrototypeDatabase, calloff: Calloff): PeaksClassicProjectedModelRow[] {
  const transactions = [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloff.calloff_id);
  const months = [...new Set(transactions.map((transaction) => transaction.month))].sort();
  if (months.length === 0) {
    return projectClassicModelRowsForMonth(database, calloff, calloff.delivery_start_month, []);
  }
  return months.flatMap((month) =>
    projectClassicModelRowsForMonth(
      database,
      calloff,
      month,
      transactions.filter((transaction) => transaction.month === month),
    ),
  );
}

function projectModernModelRowsForCalloff(database: PrototypeDatabase, calloff: Calloff): PeaksModernProjectedModelRow[] {
  const transactions = [...database.transactions.values()].filter((transaction) => transaction.calloff_id === calloff.calloff_id);
  const months = [...new Set(transactions.map((transaction) => transaction.month))].sort();
  if (months.length === 0) {
    return projectModernModelRowsForMonth(database, calloff, calloff.delivery_start_month, []);
  }
  return months.flatMap((month) =>
    projectModernModelRowsForMonth(
      database,
      calloff,
      month,
      transactions.filter((transaction) => transaction.month === month),
    ),
  );
}

function projectClassicModelRowsForMonth(
  database: PrototypeDatabase,
  calloff: Calloff,
  month: string,
  transactions: CustomerTransaction[],
): PeaksClassicProjectedModelRow[] {
  const projection = projectPeaksCalloffMonth(database, calloff, transactions);
  return [
    {
      calloff_id: calloff.calloff_id,
      month,
      component: "classic.offpeak.sys",
      component_concept: "projected",
      quantity: null,
      quantity_type: null,
      mw: projection.classic_offpeak_mw,
      mwh: projection.classic_offpeak_mwh,
      price: projection.classic_offpeak_price,
      price_type: "EUR_PER_MWH",
      factor: null,
      factor_type: null,
      value_eur: roundProjection(projection.classic_offpeak_value),
      value_sek: null,
      value: roundProjection(projection.classic_offpeak_value),
      source_components: "base.sys, base.epad, allocation.peak.sys, allocation.peak.epad",
      warnings: projection.warnings,
    },
    {
      calloff_id: calloff.calloff_id,
      month,
      component: "classic.peak.sys",
      component_concept: "projected",
      quantity: null,
      quantity_type: null,
      mw: projection.classic_peak_mw,
      mwh: projection.classic_peak_mwh,
      price: projection.classic_peak_price,
      price_type: "EUR_PER_MWH",
      factor: null,
      factor_type: null,
      value_eur: roundProjection(projection.classic_peak_value),
      value_sek: null,
      value: roundProjection(projection.classic_peak_value),
      source_components: "base.sys, base.epad, allocation.peak.sys, allocation.peak.epad, peak.sys, peak.epad",
      warnings: projection.warnings,
    },
    ...projectCurrencyModelRows(database, transactions),
  ];
}

function projectModernModelRowsForMonth(
  database: PrototypeDatabase,
  calloff: Calloff,
  month: string,
  transactions: CustomerTransaction[],
): PeaksModernProjectedModelRow[] {
  const commonWarnings = projectPeaksCalloffMonth(database, calloff, transactions).warnings;
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    return emptyProjectedRows(calloff.calloff_id, month, "missing calendar");
  }

  const offpeakH = calendar.total_h - calendar.peak_h;
  if (calendar.peak_h === 0 || offpeakH === 0) {
    return emptyProjectedRows(calloff.calloff_id, month, "zero peak or offpeak hours");
  }

  return [
    ...projectModernModelDimension(database, calloff.calloff_id, month, transactions, "sys", calendar.total_h, calendar.peak_h, offpeakH),
    ...projectModernModelDimension(database, calloff.calloff_id, month, transactions, "epad", calendar.total_h, calendar.peak_h, offpeakH),
    ...projectCurrencyModelRows(database, transactions),
  ]
    .map((row) => ({ ...row, warnings: [...new Set([...row.warnings, ...commonWarnings])] }))
    .sort((left, right) => projectedComponentSort(left.component) - projectedComponentSort(right.component));
}

function projectModernModelDimension(
  database: PrototypeDatabase,
  calloffId: string,
  month: string,
  transactions: CustomerTransaction[],
  dimension: "sys" | "epad",
  totalH: number,
  peakH: number,
  offpeakH: number,
): PeaksModernProjectedModelRow[] {
  const warnings: string[] = [];
  const base = findFirstComponentTransaction(database, transactions, [`base.${dimension}`]);
  const allocation = findFirstComponentTransaction(database, transactions, [`allocation.peak.${dimension}`]);
  const peak = findFirstComponentTransaction(database, transactions, [`peak.${dimension}`, `peak.premium.${dimension}`, `peak.modern.${dimension}`]);
  if (!base) {
    warnings.push(`missing base.${dimension}`);
  }
  if (!allocation) {
    warnings.push(`missing allocation.peak.${dimension}`);
  }
  if (!peak) {
    warnings.push(`missing peak.${dimension}`);
  }

  const basePrice = findTransactionComponentPrice(database, [`base.${dimension}`], transactions, warnings);
  const peakPrice = findTransactionComponentPrice(
    database,
    [`peak.${dimension}`, `peak.premium.${dimension}`, `peak.modern.${dimension}`],
    transactions,
    warnings,
  );

  if (!base || !allocation || !peak || basePrice === null || peakPrice === null) {
    return emptyProjectedRows(calloffId, month, warnings.join("; "), dimension);
  }

  const baseMw = (base.mw * totalH - allocation.mw * peakH) / offpeakH;
  const modernPeakMw = allocation.mw - baseMw;
  const baseMwh = baseMw * totalH;
  const peakMwh = modernPeakMw * peakH;
  const canonicalValue = base.mw * totalH * basePrice + peak.mw * peakH * peakPrice;
  const baseValue = baseMwh * basePrice;
  const projectedPeakPrice = divideValueOrNull(canonicalValue - baseValue, peakMwh);
  if (projectedPeakPrice === null) {
    warnings.push(`zero modern peak ${dimension} MWh`);
  }
  const peakValue = projectedPeakPrice === null ? 0 : canonicalValue - baseValue;

  return [
    {
      calloff_id: calloffId,
      month,
      component: `modern.base.${dimension}`,
      component_concept: "projected",
      quantity: roundProjection(baseMw),
      quantity_type: "MW",
      mw: roundProjection(baseMw),
      mwh: roundProjection(baseMwh),
      price: roundProjection(basePrice),
      price_type: "EUR_PER_MWH",
      factor: null,
      factor_type: null,
      value_eur: roundProjection(baseValue),
      value_sek: null,
      value: roundProjection(baseValue),
      source_components: `base.${dimension}, allocation.peak.${dimension}`,
      warnings,
    },
    {
      calloff_id: calloffId,
      month,
      component: `modern.peak.${dimension}`,
      component_concept: "projected",
      quantity: roundProjection(modernPeakMw),
      quantity_type: "MW",
      mw: roundProjection(modernPeakMw),
      mwh: roundProjection(peakMwh),
      price: projectedPeakPrice,
      price_type: "EUR_PER_MWH",
      factor: null,
      factor_type: null,
      value_eur: roundProjection(peakValue),
      value_sek: null,
      value: roundProjection(peakValue),
      source_components: `base.${dimension}, allocation.peak.${dimension}, peak.${dimension}`,
      warnings,
    },
  ];
}

function projectCurrencyModelRows(database: PrototypeDatabase, transactions: CustomerTransaction[]): PeaksProjectedModelTransactionRow[] {
  return transactions
    .filter((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component === "currency.eursek")
    .map((transaction) => {
      const economics = getTransactionViewEconomics(database, transaction);
      return {
        calloff_id: transaction.calloff_id,
        month: transaction.month,
        component: "currency.eursek",
        component_concept: componentCodeConcept("currency.eursek"),
        quantity: economics.quantity,
        quantity_type: economics.quantity_type,
        mw: null,
        mwh: null,
        price: economics.price,
        price_type: economics.price_type,
        factor: economics.factor,
        factor_type: economics.factor_type,
        value_eur: null,
        value_sek: economics.value_sek,
        value: economics.value_sek ?? 0,
        source_components: "currency.eursek",
        warnings: [],
      };
    });
}

function aggregateClassicProjectedModelRows(
  database: PrototypeDatabase,
  rows: PeaksClassicProjectedModelRow[],
): PeaksClassicCalloffTransactionRow[] {
  return [...groupProjectedRowsByCalloff(rows).entries()].map(([calloffId, calloffRows]) => {
    const calloff = database.calloffs.get(calloffId);
    const warnings = aggregateProjectedWarnings(calloffRows);
    const offpeakRows = calloffRows.filter((row) => row.component === "classic.offpeak.sys");
    const peakRows = calloffRows.filter((row) => row.component === "classic.peak.sys");
    const currency = projectedCurrencySummary(calloffRows);
    const offpeakMwh = sumProjectedRows(offpeakRows, "mwh");
    const peakMwh = sumProjectedRows(peakRows, "mwh");
    const offpeakValue = sumProjectedRows(offpeakRows, "value_eur");
    const peakValue = sumProjectedRows(peakRows, "value_eur");
    const valueEur = offpeakValue + peakValue;
    const fxRate = currency.fx_rate;
    const displayValue = displayValueForProjectedRows(valueEur, currency);
    addCurrencyCoverageWarning(warnings, valueEur, currency.covered_eur);
    return {
      date: calloff?.date ?? "",
      calloff_id: calloffId,
      period: projectedPeriod(calloffRows),
      offpeak_mwh: roundProjection(offpeakMwh),
      peak_mwh: roundProjection(peakMwh),
      offpeak_price: divideOrNull(displayLegValue(offpeakValue, fxRate), offpeakMwh, warnings, "zero classic offpeak MWh"),
      peak_price: divideOrNull(displayLegValue(peakValue, fxRate), peakMwh, warnings, "zero classic peak MWh"),
      value_eur: roundProjection(valueEur),
      fx_rate: fxRate,
      value_sek: currency.value_sek,
      display_currency: fxRate === null ? "EUR" : "SEK",
      display_value: roundProjection(displayValue),
      display_price: divideOrNull(displayValue, offpeakMwh + peakMwh, warnings, "zero classic total MWh"),
      coverage_pct: coveragePct(valueEur, currency.covered_eur),
      canonical_total_value: roundProjection(valueEur),
      projected_total_value: roundProjection(offpeakValue + peakValue),
      warnings,
    };
  });
}

function aggregateModernProjectedModelRows(
  database: PrototypeDatabase,
  rows: PeaksModernProjectedModelRow[],
): PeaksModernCalloffTransactionRow[] {
  return [...groupProjectedRowsByCalloff(rows).entries()].map(([calloffId, calloffRows]) => {
    const calloff = database.calloffs.get(calloffId);
    const warnings = aggregateProjectedWarnings(calloffRows);
    const baseSysRows = calloffRows.filter((row) => row.component === "modern.base.sys");
    const baseEpadRows = calloffRows.filter((row) => row.component === "modern.base.epad");
    const peakSysRows = calloffRows.filter((row) => row.component === "modern.peak.sys");
    const peakEpadRows = calloffRows.filter((row) => row.component === "modern.peak.epad");
    const currency = projectedCurrencySummary(calloffRows);
    const baseMwh = sumProjectedRows(baseSysRows, "mwh");
    const peakMwh = sumProjectedRows(peakSysRows, "mwh");
    const baseValue = sumProjectedRows(baseSysRows, "value_eur") + sumProjectedRows(baseEpadRows, "value_eur");
    const peakValue = sumProjectedRows(peakSysRows, "value_eur") + sumProjectedRows(peakEpadRows, "value_eur");
    const valueEur = baseValue + peakValue;
    const fxRate = currency.fx_rate;
    const displayValue = displayValueForProjectedRows(valueEur, currency);
    addCurrencyCoverageWarning(warnings, valueEur, currency.covered_eur);
    return {
      date: calloff?.date ?? "",
      calloff_id: calloffId,
      period: projectedPeriod(calloffRows),
      base_mwh: roundProjection(baseMwh),
      peak_mwh: roundProjection(peakMwh),
      base_price: divideOrNull(displayLegValue(baseValue, fxRate), baseMwh, warnings, "zero modern base MWh"),
      peak_price: divideOrNull(displayLegValue(peakValue, fxRate), peakMwh, warnings, "zero modern peak MWh"),
      value_eur: roundProjection(valueEur),
      fx_rate: fxRate,
      value_sek: currency.value_sek,
      display_currency: fxRate === null ? "EUR" : "SEK",
      display_value: roundProjection(displayValue),
      display_price: divideOrNull(displayValue, baseMwh + peakMwh, warnings, "zero modern total MWh"),
      coverage_pct: coveragePct(valueEur, currency.covered_eur),
      canonical_total_value: roundProjection(valueEur),
      projected_total_value: roundProjection(baseValue + peakValue),
      warnings,
    };
  });
}

function aggregateClassicProjection(rows: PeaksMonthlyProjection[]): PeaksClassicCalloffTransactionRow {
  const warnings = aggregateWarnings(rows);
  const offpeakMwh = sum(rows, "classic_offpeak_mwh");
  const peakMwh = sum(rows, "classic_peak_mwh");
  const offpeakValue = sum(rows, "classic_offpeak_value");
  const peakValue = sum(rows, "classic_peak_value");
  const valueEur = sum(rows, "canonical_total_value");
  const valueSek = nullableSum(rows, "value_sek");
  const displayValue = sum(rows, "display_value");
  const displayCurrency = aggregateDisplayCurrency(rows);

  return {
    date: rows[0].date,
    calloff_id: rows[0].calloff_id,
    period: periodForRows(rows),
    offpeak_mwh: roundProjection(offpeakMwh),
    peak_mwh: roundProjection(peakMwh),
    offpeak_price: divideOrNull(sumDisplayLegValue(rows, "classic_offpeak_mwh", "classic_offpeak_price"), offpeakMwh, warnings, "zero classic offpeak MWh"),
    peak_price: divideOrNull(sumDisplayLegValue(rows, "classic_peak_mwh", "classic_peak_price"), peakMwh, warnings, "zero classic peak MWh"),
    value_eur: roundProjection(valueEur),
    fx_rate: aggregateFxRate(rows),
    value_sek: valueSek,
    display_currency: displayCurrency,
    display_value: roundProjection(displayValue),
    display_price: divideOrNull(displayValue, offpeakMwh + peakMwh, warnings, "zero classic total MWh"),
    coverage_pct: aggregateCoverage(rows),
    canonical_total_value: roundProjection(valueEur),
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
  const valueEur = sum(rows, "canonical_total_value");
  const valueSek = nullableSum(rows, "value_sek");
  const displayValue = sum(rows, "display_value");
  const displayCurrency = aggregateDisplayCurrency(rows);

  return {
    date: rows[0].date,
    calloff_id: rows[0].calloff_id,
    period: periodForRows(rows),
    base_mwh: roundProjection(baseMwh),
    peak_mwh: roundProjection(peakMwh),
    base_price: divideOrNull(sumDisplayLegValue(rows, "modern_base_mwh", "modern_base_price"), baseMwh, warnings, "zero modern base MWh"),
    peak_price: divideOrNull(sumDisplayLegValue(rows, "modern_peak_mwh", "modern_peak_price"), peakMwh, warnings, "zero modern peak MWh"),
    value_eur: roundProjection(valueEur),
    fx_rate: aggregateFxRate(rows),
    value_sek: valueSek,
    display_currency: displayCurrency,
    display_value: roundProjection(displayValue),
    display_price: divideOrNull(displayValue, baseMwh + peakMwh, warnings, "zero modern total MWh"),
    coverage_pct: aggregateCoverage(rows),
    canonical_total_value: roundProjection(valueEur),
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
  const matchingTransactions = transactions.filter((transaction) => {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
    return component ? componentCodes.includes(component.component) : false;
  });
  let price = 0;
  for (const transaction of matchingTransactions) {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
    const componentPrice = resolveTransactionComponentPrice(database, transaction);
    if (!component || componentPrice === null) {
      warnings.push(`missing ${label} component ${component?.component ?? transaction.productcomponent_id}`);
      continue;
    }
    price += componentPrice;
  }
  if (matchingTransactions.length < 2) {
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
    display_currency: "EUR",
    fx_rate: null,
    value_sek: null,
    display_value: 0,
    display_price: null,
    coverage_pct: null,
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

function groupProjectedRowsByCalloff<T extends PeaksProjectedModelTransactionRow>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const existing = groups.get(row.calloff_id) ?? [];
    existing.push(row);
    groups.set(row.calloff_id, existing);
  }
  return groups;
}

function aggregateProjectedWarnings(rows: PeaksProjectedModelTransactionRow[]): string[] {
  return [...new Set(rows.flatMap((row) => row.warnings))];
}

function projectedPeriod(rows: PeaksProjectedModelTransactionRow[]): string {
  const months = [...new Set(rows.map((row) => row.month))].sort();
  return months.length === 1 ? months[0] : `${months[0]} - ${months[months.length - 1]}`;
}

function sumProjectedRows(rows: PeaksProjectedModelTransactionRow[], key: "mwh" | "value_eur"): number {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function projectedCurrencySummary(rows: PeaksProjectedModelTransactionRow[]): {
  covered_eur: number;
  value_sek: number | null;
  fx_rate: number | null;
} {
  const currencyRows = rows.filter((row) => row.component === "currency.eursek");
  const coveredEur = currencyRows.reduce((total, row) => total + Number(row.quantity ?? 0), 0);
  const valueSek = currencyRows.reduce((total, row) => total + Number(row.value_sek ?? 0), 0);
  const weightedFx = currencyRows.reduce(
    (state, row) => {
      const quantity = Math.abs(row.quantity ?? 0);
      return {
        value: state.value + Number(row.price ?? 0) * quantity,
        weight: state.weight + quantity,
      };
    },
    { value: 0, weight: 0 },
  );
  return {
    covered_eur: roundProjection(coveredEur),
    value_sek: currencyRows.length === 0 ? null : roundProjection(valueSek),
    fx_rate: weightedFx.weight === 0 ? null : roundProjection(weightedFx.value / weightedFx.weight),
  };
}

function displayValueForProjectedRows(
  valueEur: number,
  currency: { covered_eur: number; value_sek: number | null; fx_rate: number | null },
): number {
  if (currency.fx_rate === null) {
    return valueEur;
  }
  if (Math.abs((coveragePct(valueEur, currency.covered_eur) ?? 0) - 1) <= EPSILON && currency.value_sek !== null) {
    return currency.value_sek;
  }
  return valueEur * currency.fx_rate;
}

function displayLegValue(valueEur: number, fxRate: number | null): number {
  return fxRate === null ? valueEur : valueEur * fxRate;
}

function coveragePct(valueEur: number, coveredEur: number): number | null {
  if (Math.abs(valueEur) <= EPSILON) {
    return null;
  }
  return roundProjection(coveredEur / valueEur);
}

function addCurrencyCoverageWarning(warnings: string[], valueEur: number, coveredEur: number): void {
  const coverage = coveragePct(valueEur, coveredEur);
  if (coverage !== null && Math.abs(coverage - 1) > EPSILON && Math.abs(coveredEur - valueEur) > 0.01) {
    warnings.push("partial_currency_coverage");
  }
}

function divideValueOrNull(numerator: number, denominator: number): number | null {
  if (Math.abs(denominator) <= EPSILON) {
    return null;
  }
  return roundProjection(numerator / denominator);
}

function findTransactionComponentPrice(
  database: PrototypeDatabase,
  componentCodes: string[],
  transactions: CustomerTransaction[],
  warnings: string[],
): number | null {
  const transaction = transactions.find(
    (candidate) => {
      const component = database.productConfigurationComponents.get(candidate.productcomponent_id)?.component;
      return component ? componentCodes.includes(component) : false;
    },
  );
  if (!transaction) {
    warnings.push(`missing ${componentCodes[0]} price source`);
    return null;
  }
  const price = resolveTransactionComponentPrice(database, transaction);
  if (price === null) {
    warnings.push(`missing ${componentCodes[0]} price`);
    return null;
  }
  return price;
}

function emptyProjectedRows(
  calloffId: string,
  month: string,
  warning: string,
  dimension?: "sys" | "epad",
): PeaksModernProjectedModelRow[] {
  const dimensions = dimension ? [dimension] : (["sys", "epad"] as const);
  return dimensions.flatMap((candidate) => [
    emptyProjectedRow(calloffId, month, `modern.base.${candidate}`, warning),
    emptyProjectedRow(calloffId, month, `modern.peak.${candidate}`, warning),
  ]);
}

function emptyProjectedRow(
  calloffId: string,
  month: string,
  component: string,
  warning: string,
): PeaksProjectedModelTransactionRow {
  return {
    calloff_id: calloffId,
    month,
    component,
    component_concept: "projected",
    quantity: null,
    quantity_type: null,
    mw: null,
    mwh: 0,
    price: null,
    price_type: null,
    factor: null,
    factor_type: null,
    value_eur: null,
    value_sek: null,
    value: 0,
    source_components: "",
    warnings: [warning].filter(Boolean),
  };
}

function projectedComponentSort(component: string): number {
  const order = [
    "modern.base.sys",
    "modern.base.epad",
    "modern.peak.sys",
    "modern.peak.epad",
    "classic.offpeak.sys",
    "classic.peak.sys",
    "currency.eursek",
  ];
  const index = order.indexOf(component);
  return index === -1 ? order.length : index;
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
  return roundPrice(numerator / denominator);
}

function sum(rows: PeaksMonthlyProjection[], key: keyof PeaksMonthlyProjection): number {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function nullableSum(rows: PeaksMonthlyProjection[], key: keyof PeaksMonthlyProjection): number | null {
  const values = rows.map((row) => row[key]).filter((value): value is number => typeof value === "number");
  return values.length === 0 ? null : roundProjection(values.reduce((total, value) => total + value, 0));
}

function sumDisplayLegValue(
  rows: PeaksMonthlyProjection[],
  mwhKey: "classic_offpeak_mwh" | "classic_peak_mwh" | "modern_base_mwh" | "modern_peak_mwh",
  priceKey: "classic_offpeak_price" | "classic_peak_price" | "modern_base_price" | "modern_peak_price",
): number {
  return rows.reduce((total, row) => total + Number(row[mwhKey] ?? 0) * Number(row[priceKey] ?? 0) * (row.fx_rate ?? 1), 0);
}

function aggregateDisplayCurrency(rows: PeaksMonthlyProjection[]): DisplayCurrency {
  return rows.some((row) => row.display_currency === "SEK") ? "SEK" : "EUR";
}

function aggregateFxRate(rows: PeaksMonthlyProjection[]): number | null {
  const weighted = rows.reduce(
    (state, row) => {
      if (row.fx_rate === null) {
        return state;
      }
      const weight = row.display_value;
      return { value: state.value + row.fx_rate * weight, weight: state.weight + weight };
    },
    { value: 0, weight: 0 },
  );
  return weighted.weight === 0 ? null : roundProjection(weighted.value / weighted.weight);
}

function aggregateCoverage(rows: PeaksMonthlyProjection[]): number | null {
  const weighted = rows.reduce(
    (state, row) => {
      if (row.coverage_pct === null) {
        return state;
      }
      const weight = Math.abs(row.canonical_total_value);
      return { value: state.value + row.coverage_pct * weight, weight: state.weight + weight };
    },
    { value: 0, weight: 0 },
  );
  return weighted.weight === 0 ? null : roundProjection(weighted.value / weighted.weight);
}

function roundProjection(value: number): number {
  return Number(value.toFixed(6));
}

function roundPrice(value: number): number {
  const rounded = roundProjection(value);
  const twoDecimals = Number(value.toFixed(2));
  return Math.abs(rounded - twoDecimals) <= EPSILON * 2 ? twoDecimals : rounded;
}
