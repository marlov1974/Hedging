import { getComponentHourBasis } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerTransaction, ProductConfigurationComponent } from "../database/types.ts";
import { resolveTransactionComponentPrice } from "./componentPricing.ts";

export type PowerTransactionEconomics = {
  quantity_mw: number;
  hours: number;
  mwh: number;
  price_eur_per_mwh: number;
  factor: number;
  raw_value_eur: number;
  q_value_eur: number;
};

export type CurrencyTransactionEconomics = {
  quantity_eur: number;
  sek_per_eur: number;
  currency_value_sek: number;
};

export type NormalizedSekCommercialPowerLeg = {
  power: {
    quantity: number;
    quantity_type: "MW";
    price: number;
    price_type: "EUR_PER_MWH";
    factor: number;
    factor_type: "Q_FACTOR";
  };
  currency: {
    quantity: number;
    quantity_type: "EUR";
    price: number;
    price_type: "SEK_PER_EUR";
    factor: null;
    factor_type: null;
  };
};

export function derivePowerTransactionEconomics(
  database: PrototypeDatabase,
  transaction: CustomerTransaction,
): PowerTransactionEconomics {
  const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
  if (!component) {
    throw new Error(`Missing product component for ${transaction.productcomponent_id}`);
  }
  const hours = hoursForComponent(database, component, transaction.month);
  const quantityMw = transaction.quantity ?? transaction.mw;
  const price = resolveTransactionComponentPrice(database, transaction) ?? priceForTransaction(database, transaction);
  const factor = transaction.factor ?? transaction.q_factor;
  const mwh = quantityMw * hours;
  const rawValueEur = mwh * price;

  return {
    quantity_mw: round(quantityMw),
    hours,
    mwh: round(mwh),
    price_eur_per_mwh: round(price),
    factor: round(factor),
    raw_value_eur: round(rawValueEur),
    q_value_eur: round(rawValueEur * factor),
  };
}

export function deriveCurrencyTransactionEconomics(transaction: CustomerTransaction): CurrencyTransactionEconomics {
  if (transaction.quantity_type !== "EUR" || transaction.price_type !== "SEK_PER_EUR") {
    throw new Error("currency transaction must use EUR quantity and SEK_PER_EUR price");
  }
  const quantity = transaction.quantity ?? 0;
  const price = transaction.price ?? 0;
  return {
    quantity_eur: round(quantity),
    sek_per_eur: round(price),
    currency_value_sek: round(quantity * price),
  };
}

export function normalizeSekCommercialPowerLeg(input: {
  mwh: number;
  sek_amount: number;
  fx_rate: number;
  total_h: number;
  q_factor?: number;
}): NormalizedSekCommercialPowerLeg {
  if (input.mwh <= 0) {
    throw new Error("mwh must be greater than zero");
  }
  if (input.fx_rate <= 0) {
    throw new Error("fx_rate must be greater than zero");
  }
  if (input.total_h <= 0) {
    throw new Error("total_h must be greater than zero");
  }

  const eurAmount = input.sek_amount / input.fx_rate;
  return {
    power: {
      quantity: round(input.mwh / input.total_h),
      quantity_type: "MW",
      price: round(eurAmount / input.mwh),
      price_type: "EUR_PER_MWH",
      factor: input.q_factor ?? 1,
      factor_type: "Q_FACTOR",
    },
    currency: {
      quantity: round(eurAmount),
      quantity_type: "EUR",
      price: round(input.fx_rate),
      price_type: "SEK_PER_EUR",
      factor: null,
      factor_type: null,
    },
  };
}

function hoursForComponent(database: PrototypeDatabase, component: ProductConfigurationComponent, month: string): number {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    throw new Error(`Missing calendar for ${month}`);
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

function priceForTransaction(database: PrototypeDatabase, transaction: CustomerTransaction): number {
  const price = [...database.priceComponents.values()].find(
    (candidate) => candidate.productcomponent_id === transaction.productcomponent_id,
  );
  if (!price) {
    throw new Error(`Missing price component for ${transaction.productcomponent_id}`);
  }
  return price.price;
}

function round(value: number): number {
  return Number(value.toFixed(6));
}
