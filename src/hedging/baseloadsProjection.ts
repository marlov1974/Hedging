import type { PrototypeDatabase } from "../database/schema.ts";
import type { EventDetail, HedgingEvent } from "../database/types.ts";

const MARKET_BASE_COMPONENT_PATTERN = /^market\.base\.(sto|mal|lul|sun)$/;
const EPSILON = 0.000001;

export type BaseloadsProjectionShape = "MARKET_NEAR_BASELOADS" | "PROFILED_BASELOADS";

export type BaseloadsMarketProjectionRow = {
  calloff_id: string;
  month: string;
  component: "baseloads.market.base";
  component_concept: "projected";
  mwh: number;
  price: number | null;
  value: number;
  source_component: "market.base";
  shape: BaseloadsProjectionShape;
  source_detail_count: number;
};

export function getBaseloadsMarketProjectionRowsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): BaseloadsMarketProjectionRow[] {
  return getBaseloadsMarketProjectionRows(database, portfolioId)
    .filter((row) => row.month.startsWith(`${year}-`))
    .sort((left, right) => left.month.localeCompare(right.month) || left.calloff_id.localeCompare(right.calloff_id));
}

export function getBaseloadsMarketProjectionRows(database: PrototypeDatabase, portfolioId: string): BaseloadsMarketProjectionRow[] {
  const rowsByCalloff = new Map<string, BaseloadsMarketProjectionRow[]>();
  const events = [...database.events.values()]
    .filter(
      (event) =>
        event.portfolio_id === portfolioId &&
        event.status === "active" &&
        (event.event_type === "PURCHASE" || event.event_type === "REBALANCE" || event.event_type === "ADJUSTMENT"),
    )
    .sort((left, right) => left.created_order - right.created_order || left.event_id.localeCompare(right.event_id));

  for (const event of events) {
    const rows = projectEvent(database, event);
    if (rows.length === 0) {
      continue;
    }
    rowsByCalloff.set(calloffIdFromPurchaseEvent(event.event_id), rows);
  }

  return [...rowsByCalloff.values()].flatMap((rows) => withShape(rows));
}

function projectEvent(database: PrototypeDatabase, event: HedgingEvent): BaseloadsMarketProjectionRow[] {
  const details = [...database.eventDetails.values()].filter(
    (detail) =>
      detail.event_id === event.event_id &&
      detail.leg_type === "MARKET" &&
      MARKET_BASE_COMPONENT_PATTERN.test(detail.component_code),
  );
  const detailsByMonth = new Map<string, EventDetail[]>();
  for (const detail of details) {
    const monthDetails = detailsByMonth.get(detail.period) ?? [];
    monthDetails.push(detail);
    detailsByMonth.set(detail.period, monthDetails);
  }

  return [...detailsByMonth.entries()]
    .map(([month, monthDetails]) => {
      const volume = monthDetails.reduce((sum, detail) => sum + detail.quantity, 0);
      const value = monthDetails.reduce((sum, detail) => sum + detail.quantity * (detail.price ?? 0), 0);
      return {
        calloff_id: calloffIdFromPurchaseEvent(event.event_id),
        month,
        component: "baseloads.market.base" as const,
        component_concept: "projected" as const,
        mwh: round(volume),
        price: Math.abs(volume) <= EPSILON ? null : roundPrice(value / volume),
        value: round(value),
        source_component: "market.base" as const,
        shape: "MARKET_NEAR_BASELOADS" as const,
        source_detail_count: monthDetails.length,
      };
    })
    .sort((left, right) => left.month.localeCompare(right.month));
}

function withShape(rows: BaseloadsMarketProjectionRow[]): BaseloadsMarketProjectionRow[] {
  const nonZeroVolumes = rows.filter((row) => Math.abs(row.mwh) > EPSILON).map((row) => row.mwh);
  const [firstVolume] = nonZeroVolumes;
  const shape =
    firstVolume === undefined || nonZeroVolumes.every((volume) => Math.abs(volume - firstVolume) <= EPSILON)
      ? "MARKET_NEAR_BASELOADS"
      : "PROFILED_BASELOADS";
  return rows.map((row) => ({ ...row, shape }));
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

function round(value: number): number {
  return Number(value.toFixed(6));
}

function roundPrice(value: number): number {
  return Number(value.toFixed(6));
}
