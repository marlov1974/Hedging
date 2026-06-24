import { getComponentCategory, getComponentHourBasis } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { Calloff, ComponentCategory, CustomerTransaction, ProductConfigurationComponent } from "../database/types.ts";
import { resolveTransactionComponentPrice } from "./componentPricing.ts";
import { deriveCurrencyTransactionEconomics, derivePowerTransactionEconomics } from "./currencyModel.ts";

const EPSILON = 0.000001;
const COVERAGE_EUR_TOLERANCE = 0.01;

export type DisplayCurrency = "EUR" | "SEK";

export type TransactionViewEconomics = {
  component_code: string;
  component_category: ComponentCategory;
  period: string;
  quantity: number | null;
  quantity_type: "MW" | "EUR" | null;
  price: number | null;
  price_type: "EUR_PER_MWH" | "SEK_PER_EUR" | null;
  factor: number | null;
  factor_type: "Q_FACTOR" | null;
  hours: number | null;
  mwh: number | null;
  value_eur: number | null;
  q_value_eur: number | null;
  value_sek: number | null;
};

export type CurrencyCoverage = {
  fx_rate: number | null;
  currency_covered_eur: number;
  currency_value_sek: number;
  coverage_pct: number | null;
  warnings: string[];
};

export type DisplayCurrencyResult = CurrencyCoverage & {
  display_currency: DisplayCurrency;
  display_value: number;
  display_price: number | null;
  value_eur: number;
  value_sek: number | null;
};

export function getTransactionComponent(database: PrototypeDatabase, transaction: CustomerTransaction): ProductConfigurationComponent | undefined {
  return database.productConfigurationComponents.get(transaction.productcomponent_id);
}

export function getTransactionComponentCode(database: PrototypeDatabase, transaction: CustomerTransaction): string {
  return getTransactionComponent(database, transaction)?.component ?? transaction.productcomponent_id;
}

export function getTransactionViewEconomics(
  database: PrototypeDatabase,
  transaction: CustomerTransaction,
): TransactionViewEconomics {
  const component = getTransactionComponent(database, transaction);
  const componentCode = component?.component ?? transaction.productcomponent_id;
  const componentCategory = component ? getComponentCategory(component) : "adjustment";
  const quantity = transaction.quantity ?? transaction.mw;
  const quantityType = transaction.quantity_type ?? (componentCategory === "currency" ? null : "MW");
  const price = resolveTransactionComponentPrice(database, transaction);
  const priceType = transaction.price_type ?? (componentCategory === "currency" ? null : "EUR_PER_MWH");
  const factor = transaction.factor ?? (componentCategory === "currency" ? null : transaction.q_factor);
  const factorType = transaction.factor_type ?? (componentCategory === "currency" ? null : "Q_FACTOR");

  if (quantityType === "EUR" && priceType === "SEK_PER_EUR") {
    const currency = deriveCurrencyTransactionEconomics(transaction);
    return {
      component_code: componentCode,
      component_category: componentCategory,
      period: transaction.month,
      quantity: round(quantity),
      quantity_type: quantityType,
      price: price === null ? null : round(price),
      price_type: priceType,
      factor,
      factor_type: factorType,
      hours: null,
      mwh: null,
      value_eur: null,
      q_value_eur: null,
      value_sek: currency.currency_value_sek,
    };
  }

  if (quantityType === "MW" && priceType === "EUR_PER_MWH") {
    const power = derivePowerTransactionEconomics(database, transaction);
    return {
      component_code: componentCode,
      component_category: componentCategory,
      period: transaction.month,
      quantity: power.quantity_mw,
      quantity_type: quantityType,
      price: power.price_eur_per_mwh,
      price_type: priceType,
      factor: power.factor,
      factor_type: factorType,
      hours: power.hours,
      mwh: power.mwh,
      value_eur: power.raw_value_eur,
      q_value_eur: power.q_value_eur,
      value_sek: null,
    };
  }

  return {
    component_code: componentCode,
    component_category: componentCategory,
    period: transaction.month,
    quantity: quantity === undefined ? null : round(quantity),
    quantity_type: quantityType,
    price: price === null ? null : round(price),
    price_type: priceType,
    factor,
    factor_type: factorType,
    hours: null,
    mwh: null,
    value_eur: null,
    q_value_eur: null,
    value_sek: null,
  };
}

export function getCalloffCurrencyCoverage(
  database: PrototypeDatabase,
  input: { calloff: Calloff; transactions: CustomerTransaction[]; powerValueEur: number },
): CurrencyCoverage {
  const currencyRows = input.transactions.filter(
    (transaction) => getTransactionComponentCode(database, transaction) === "currency.eursek",
  );
  const warnings: string[] = [];
  if (currencyRows.length === 0) {
    return {
      fx_rate: null,
      currency_covered_eur: 0,
      currency_value_sek: 0,
      coverage_pct: input.powerValueEur === 0 ? null : 0,
      warnings: ["missing_currency_row"],
    };
  }

  let coveredEur = 0;
  let valueSek = 0;
  for (const row of currencyRows) {
    const economics = getTransactionViewEconomics(database, row);
    coveredEur += economics.quantity ?? 0;
    valueSek += economics.value_sek ?? 0;
  }

  const fxRate = Math.abs(coveredEur) <= EPSILON ? null : valueSek / coveredEur;
  const coveragePct = Math.abs(input.powerValueEur) <= EPSILON ? null : coveredEur / input.powerValueEur;
  const roundedCoveragePct = coveragePct === null ? null : round(coveragePct);
  const uncoveredEur = Math.abs(coveredEur - input.powerValueEur);
  if (currencyRows.length > 1) {
    warnings.push("multiple_currency_rows");
  }
  if (roundedCoveragePct !== null && Math.abs(roundedCoveragePct - 1) > EPSILON && uncoveredEur > COVERAGE_EUR_TOLERANCE) {
    warnings.push("partial_currency_coverage");
  }

  return {
    fx_rate: fxRate === null ? null : round(fxRate),
    currency_covered_eur: round(coveredEur),
    currency_value_sek: round(valueSek),
    coverage_pct: roundedCoveragePct,
    warnings,
  };
}

export function applyDisplayCurrency(
  database: PrototypeDatabase,
  input: {
    calloff: Calloff;
    transactions: CustomerTransaction[];
    valueEur: number;
    coverageValueEur?: number;
    mwh: number;
  },
): DisplayCurrencyResult {
  const portfolio = database.portfolios.get(input.calloff.portfolio_id);
  const displayCurrency = portfolio?.currency === "SEK" ? "SEK" : "EUR";
  if (displayCurrency === "EUR") {
    return {
      display_currency: "EUR",
      display_value: round(input.valueEur),
      display_price: divideOrNull(input.valueEur, input.mwh),
      value_eur: round(input.valueEur),
      value_sek: null,
      fx_rate: null,
      currency_covered_eur: 0,
      currency_value_sek: 0,
      coverage_pct: null,
      warnings: [],
    };
  }

  const coverage = getCalloffCurrencyCoverage(database, {
    calloff: input.calloff,
    transactions: input.transactions,
    powerValueEur: input.coverageValueEur ?? input.valueEur,
  });
  if (coverage.fx_rate === null) {
    return {
      ...coverage,
      display_currency: "EUR",
      display_value: round(input.valueEur),
      display_price: divideOrNull(input.valueEur, input.mwh),
      value_eur: round(input.valueEur),
      value_sek: null,
    };
  }

  const valueSek = Math.abs((coverage.coverage_pct ?? 0) - 1) <= EPSILON ? coverage.currency_value_sek : input.valueEur * coverage.fx_rate;
  return {
    ...coverage,
    display_currency: "SEK",
    display_value: round(valueSek),
    display_price: divideOrNull(valueSek, input.mwh),
    value_eur: round(input.valueEur),
    value_sek: round(valueSek),
  };
}

export function hoursForTransaction(database: PrototypeDatabase, transaction: CustomerTransaction): number {
  const component = getTransactionComponent(database, transaction);
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === transaction.month);
  if (!component || !calendar) {
    return 0;
  }
  const basis = getComponentHourBasis(component);
  if (basis === "peak_h") {
    return calendar.peak_h;
  }
  if (basis === "offpeak_h") {
    return calendar.total_h - calendar.peak_h;
  }
  if (basis === "none") {
    return 0;
  }
  return calendar.total_h;
}

function divideOrNull(numerator: number, denominator: number): number | null {
  if (Math.abs(denominator) <= EPSILON) {
    return null;
  }
  return round(numerator / denominator);
}

function round(value: number): number {
  return Number(value.toFixed(6));
}
