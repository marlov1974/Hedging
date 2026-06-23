import { getComponentHourBasis, isMarketProjectionComponent } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerTransaction, ProductConfigurationComponent } from "../database/types.ts";

export type MarketProjectionRow = {
  transaction_id: string;
  component: string;
  month: string;
  market_mw: number;
  market_mwh: number;
};

export function getMarketProjectionRows(database: PrototypeDatabase, transactions: CustomerTransaction[]): MarketProjectionRow[] {
  return transactions
    .map((transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
      if (!component || !isMarketProjectionComponent(component)) {
        return undefined;
      }

      const marketMw = roundProjection(transaction.mw * transaction.q_factor);
      return {
        transaction_id: transaction.transaction_id,
        component: component.component,
        month: transaction.month,
        market_mw: marketMw,
        market_mwh: roundProjection(marketMw * hoursForComponent(database, component, transaction.month)),
      };
    })
    .filter((row): row is MarketProjectionRow => Boolean(row));
}

function hoursForComponent(database: PrototypeDatabase, component: ProductConfigurationComponent, month: string): number {
  const basis = getComponentHourBasis(component);
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar || basis === "none") {
    return 0;
  }
  if (basis === "peak_h") {
    return calendar.peak_h;
  }
  if (basis === "offpeak_h") {
    return calendar.total_h - calendar.peak_h;
  }
  return calendar.total_h;
}

function roundProjection(value: number): number {
  return Number(value.toFixed(6));
}
