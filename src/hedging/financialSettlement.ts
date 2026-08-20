import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerTransaction, EventDetail, HedgingEvent, ProductConfigurationComponent } from "../database/types.ts";
import { getMonthlySpotActual } from "../settlement/spotActuals.ts";
import { formatDerivativeName } from "./derivativeNames.ts";
import { isBaseloadsPortfolio } from "./features.ts";

const SETTLEMENT_PRICE_AREA = "STO";
const BASELOAD_COMPONENTS = new Set(["base.sys", "base.epad"]);
const MARKET_BASE_COMPONENT_PATTERN = /^market\.base\.(sto|mal|lul|sun)$/;

export type FinancialSettlementRow = {
  month: string;
  calloff_id: string;
  derivative_name: string;
  component_group: "base.sys + base.epad" | "market.base";
  hedge_volume_mwh: number;
  hedge_price: number;
  monthly_spot_price: number;
  financial_settlement: number;
};

export type FinancialSettlementResult = {
  month: string;
  monthly_spot_price: number;
  spot_source_name: string;
  rows: FinancialSettlementRow[];
};

export type CombinedSysAndEpadHedge = {
  hedge_volume_mwh: number;
  hedge_price: number;
  derivative_name: string;
  component_group: "base.sys + base.epad" | "market.base";
  components: string[];
};

export function getFinancialSettlementMonths(database: PrototypeDatabase, portfolioId: string): string[] {
  const transactionMonths = getBaseloadsTransactionsForPortfolio(database, portfolioId).map((transaction) => transaction.month);
  const staticMonths = [...database.calendars.values()].map((calendar) => calendar.month);
  return [...new Set([...transactionMonths, ...staticMonths])].sort();
}

export function calculateFinancialSettlementForMonth(
  database: PrototypeDatabase,
  portfolioId: string,
  month: string,
): FinancialSettlementResult {
  const spotActual = getMonthlySpotActualForSettlement(month);
  const marketBasisRows = getMarketBasisSettlementRows(database, portfolioId, month, spotActual.monthly_average_price);
  if (marketBasisRows.length > 0) {
    return {
      month,
      monthly_spot_price: spotActual.monthly_average_price,
      spot_source_name: spotActual.source_name,
      rows: marketBasisRows,
    };
  }

  const transactions = getBaseloadsTransactionsForPortfolio(database, portfolioId).filter((transaction) => transaction.month === month);
  const groupedTransactions = groupTransactionsByCalloff(transactions);

  const rows = [...groupedTransactions.entries()]
    .map(([calloffId, calloffTransactions]) => {
      const combined = combineSysAndEpadHedgePrice(database, calloffTransactions);
      return {
        month,
        calloff_id: calloffId,
        derivative_name: combined.derivative_name,
        component_group: combined.component_group,
        hedge_volume_mwh: combined.hedge_volume_mwh,
        hedge_price: combined.hedge_price,
        monthly_spot_price: spotActual.monthly_average_price,
        financial_settlement: combined.hedge_volume_mwh * (spotActual.monthly_average_price - combined.hedge_price),
      };
    })
    .filter((row) => row.hedge_volume_mwh > 0)
    .sort((left, right) => left.calloff_id.localeCompare(right.calloff_id));

  return {
    month,
    monthly_spot_price: spotActual.monthly_average_price,
    spot_source_name: spotActual.source_name,
    rows,
  };
}

function getMarketBasisSettlementRows(
  database: PrototypeDatabase,
  portfolioId: string,
  month: string,
  monthlySpotPrice: number,
): FinancialSettlementRow[] {
  const events = [...database.events.values()]
    .filter(
      (event) =>
        event.portfolio_id === portfolioId &&
        event.status === "active" &&
        (event.event_type === "PURCHASE" || event.event_type === "REBALANCE" || event.event_type === "ADJUSTMENT"),
    )
    .sort((left, right) => left.created_order - right.created_order || left.event_id.localeCompare(right.event_id));

  return events
    .map((event) => marketBasisSettlementRowForEvent(database, event, month, monthlySpotPrice))
    .filter((row): row is FinancialSettlementRow => Boolean(row))
    .filter((row) => row.hedge_volume_mwh > 0);
}

function marketBasisSettlementRowForEvent(
  database: PrototypeDatabase,
  event: HedgingEvent,
  month: string,
  monthlySpotPrice: number,
): FinancialSettlementRow | undefined {
  const details = [...database.eventDetails.values()].filter(
    (detail) =>
      detail.event_id === event.event_id &&
      detail.period === month &&
      detail.leg_type === "MARKET" &&
      MARKET_BASE_COMPONENT_PATTERN.test(detail.component_code),
  );
  if (details.length === 0) {
    return undefined;
  }

  const hedgeVolume = details.reduce((sum, detail) => sum + detail.quantity, 0);
  const hedgeValue = details.reduce((sum, detail) => sum + detail.quantity * (detail.price ?? 0), 0);
  const hedgePrice = hedgeVolume === 0 ? 0 : roundPrice(hedgeValue / hedgeVolume);
  const priceArea = details.find((detail) => detail.price_area)?.price_area ?? SETTLEMENT_PRICE_AREA;

  return {
    month,
    calloff_id: calloffIdFromPurchaseEvent(event.event_id),
    derivative_name: formatDerivativeName("market.base", [month], priceArea),
    component_group: "market.base",
    hedge_volume_mwh: roundMwh(hedgeVolume),
    hedge_price: hedgePrice,
    monthly_spot_price: monthlySpotPrice,
    financial_settlement: hedgeVolume * (monthlySpotPrice - hedgePrice),
  };
}

function calloffIdFromPurchaseEvent(eventId: string): string {
  if (eventId.startsWith("EVT:PURCHASE:")) {
    return eventId.slice("EVT:PURCHASE:".length);
  }
  if (eventId.startsWith("EVT:REBALANCE:")) {
    return eventId.slice("EVT:REBALANCE:".length);
  }
  if (eventId.startsWith("EVT:ADJUSTMENT:")) {
    return eventId.slice("EVT:ADJUSTMENT:".length);
  }
  return eventId;
}

export function combineSysAndEpadHedgePrice(database: PrototypeDatabase, transactions: CustomerTransaction[]): CombinedSysAndEpadHedge {
  const componentRows = transactions
    .map((transaction) => {
      const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
      return component && BASELOAD_COMPONENTS.has(component.component) ? { transaction, component } : undefined;
    })
    .filter((row): row is { transaction: CustomerTransaction; component: ProductConfigurationComponent } => Boolean(row));

  const groupedByComponent = new Map<string, { transaction: CustomerTransaction; component: ProductConfigurationComponent }[]>();
  for (const row of componentRows) {
    const existing = groupedByComponent.get(row.component.component) ?? [];
    existing.push(row);
    groupedByComponent.set(row.component.component, existing);
  }

  const componentMwh = [...groupedByComponent.entries()].map(([component, rows]) => ({
    component,
    mwh: rows.reduce((sum, row) => sum + calculateTransactionMwh(database, row.transaction), 0),
    price: getWeightedComponentPrice(database, rows),
  }));

  if (componentMwh.length === 0) {
    return {
      hedge_volume_mwh: 0,
      hedge_price: 0,
      derivative_name: "No Baseloads hedge",
      component_group: "base.sys + base.epad",
      components: [],
    };
  }

  const representativeMwh = Math.max(...componentMwh.map((row) => row.mwh));
  const weightedPriceSum = componentMwh.reduce((sum, row) => sum + row.mwh * row.price, 0);
  const hedgePrice = representativeMwh === 0 ? 0 : roundPrice(weightedPriceSum / representativeMwh);
  const months = [...new Set(componentRows.map((row) => row.transaction.month))].sort();

  return {
    hedge_volume_mwh: representativeMwh,
    hedge_price: hedgePrice,
    derivative_name: formatDerivativeName("base.sys + base.epad", months, "STO"),
    component_group: "base.sys + base.epad",
    components: componentMwh.map((row) => row.component).sort(),
  };
}

export function getMonthlySpotActualForSettlement(month: string) {
  return getMonthlySpotActual(month, SETTLEMENT_PRICE_AREA);
}

function getBaseloadsTransactionsForPortfolio(database: PrototypeDatabase, portfolioId: string): CustomerTransaction[] {
  if (!isBaseloadsPortfolio(database, portfolioId)) {
    return [];
  }

  const baseloadsProduct = [...database.productConfigurations.values()].find((product) => product.name === "Baseloads");
  if (!baseloadsProduct) {
    return [];
  }

  const baseloadsCalloffIds = new Set(
    [...database.calloffs.values()]
      .filter((calloff) => calloff.portfolio_id === portfolioId && calloff.product_id === baseloadsProduct.product_id)
      .map((calloff) => calloff.calloff_id),
  );

  return [...database.transactions.values()]
    .filter((transaction) => baseloadsCalloffIds.has(transaction.calloff_id))
    .sort((left, right) => left.month.localeCompare(right.month) || left.calloff_id.localeCompare(right.calloff_id));
}

function groupTransactionsByCalloff(transactions: CustomerTransaction[]): Map<string, CustomerTransaction[]> {
  const grouped = new Map<string, CustomerTransaction[]>();
  for (const transaction of transactions) {
    const existing = grouped.get(transaction.calloff_id) ?? [];
    existing.push(transaction);
    grouped.set(transaction.calloff_id, existing);
  }
  return grouped;
}

function calculateTransactionMwh(database: PrototypeDatabase, transaction: CustomerTransaction): number {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === transaction.month);
  if (!calendar) {
    throw new Error(`Missing calendar for ${transaction.month}`);
  }
  return transaction.mw * calendar.total_h;
}

function getWeightedComponentPrice(
  database: PrototypeDatabase,
  rows: { transaction: CustomerTransaction; component: ProductConfigurationComponent }[],
): number {
  let weightedPriceSum = 0;
  let mwhSum = 0;

  for (const row of rows) {
    const priceComponent = [...database.priceComponents.values()].find(
      (candidate) => candidate.productcomponent_id === row.transaction.productcomponent_id,
    );
    if (!priceComponent) {
      throw new Error(`Missing price component for ${row.transaction.productcomponent_id}`);
    }

    const mwh = calculateTransactionMwh(database, row.transaction);
    weightedPriceSum += mwh * priceComponent.price;
    mwhSum += mwh;
  }

  return mwhSum === 0 ? 0 : roundPrice(weightedPriceSum / mwhSum);
}

function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

function roundMwh(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
