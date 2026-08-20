import type { PrototypeDatabase } from "../database/schema.ts";
import type { EventDetail, EventDetailReason, EventDetailFactorType, HedgingEvent } from "../database/types.ts";
import { DatabaseError } from "../database/types.ts";
import { insertEvent, insertEventDetail } from "../database/repository.ts";

const EPSILON = 0.000001;

export type MarketOnlyAdjustmentInput = {
  portfolio_id: string;
  customer_event_detail_id: string;
  factor: number;
  reason: EventDetailReason;
  date?: string;
  event_id?: string;
};

export type MarketOnlyAdjustmentResult = {
  event: HedgingEvent | null;
  event_details: EventDetail[];
  customer_event_detail_id: string;
  target_market_quantity: number;
  current_market_quantity: number;
  market_delta: number;
  reason: EventDetailReason;
  factor: number;
};

export class MarketOnlyAdjustmentError extends Error {
  readonly code: "invalid_input" | "not_found";

  constructor(code: "invalid_input" | "not_found", message: string) {
    super(message);
    this.code = code;
    this.name = "MarketOnlyAdjustmentError";
  }
}

export function createMarketOnlyFactorAdjustment(
  database: PrototypeDatabase,
  input: MarketOnlyAdjustmentInput,
): MarketOnlyAdjustmentResult {
  const normalized = validateInput(input);
  const customerDetail = getCustomerDetail(database, normalized.customer_event_detail_id);
  const sourceEvent = database.events.get(customerDetail.event_id);
  if (!sourceEvent) {
    throw new MarketOnlyAdjustmentError("not_found", `event_id ${customerDetail.event_id} does not exist`);
  }
  if (sourceEvent.portfolio_id !== normalized.portfolio_id) {
    throw new MarketOnlyAdjustmentError("invalid_input", "customer event detail must belong to selected portfolio");
  }
  if (customerDetail.price_area === null) {
    throw new MarketOnlyAdjustmentError("invalid_input", "customer event detail must have price_area");
  }

  const targetMarketQuantity = roundQuantity(customerDetail.quantity * normalized.factor);
  const currentMarketQuantity = getCurrentLinkedMarketQuantity(database, normalized.portfolio_id, customerDetail);
  const marketDelta = roundQuantity(targetMarketQuantity - currentMarketQuantity);
  if (Math.abs(marketDelta) <= EPSILON) {
    return {
      event: null,
      event_details: [],
      customer_event_detail_id: customerDetail.event_detail_id,
      target_market_quantity: targetMarketQuantity,
      current_market_quantity: roundQuantity(currentMarketQuantity),
      market_delta: 0,
      reason: normalized.reason,
      factor: normalized.factor,
    };
  }

  const eventId = normalized.event_id ?? nextAdjustmentEventId(database, customerDetail);
  const event = wrapDatabaseError(() =>
    insertEvent(database, {
      event_id: eventId,
      portfolio_id: normalized.portfolio_id,
      event_type: "ADJUSTMENT",
      version: 1,
      created_at: normalized.date ?? currentIsoDate(),
      created_order: nextEventOrder(database),
      source: "market_only_adjustment",
      status: "active",
    }),
  );
  const eventDetails = [
    wrapDatabaseError(() =>
      insertEventDetail(database, {
        event_detail_id: `${eventId}:market`,
        event_id: event.event_id,
        leg_type: "MARKET",
        component_code: `market.base.${customerDetail.price_area?.toLowerCase()}`,
        period: customerDetail.period,
        price_area: customerDetail.price_area,
        quantity: marketDelta,
        quantity_type: "MWh",
        price: customerDetail.price === null ? null : roundPrice(customerDetail.price / normalized.factor),
        price_type: customerDetail.price_type,
        factor: normalized.factor,
        factor_type: factorTypeForReason(normalized.reason),
        reason: normalized.reason,
        linked_detail_id: customerDetail.event_detail_id,
      }),
    ),
  ];

  return {
    event,
    event_details: eventDetails,
    customer_event_detail_id: customerDetail.event_detail_id,
    target_market_quantity: targetMarketQuantity,
    current_market_quantity: roundQuantity(currentMarketQuantity),
    market_delta: marketDelta,
    reason: normalized.reason,
    factor: normalized.factor,
  };
}

function validateInput(input: MarketOnlyAdjustmentInput): MarketOnlyAdjustmentInput & { date: string } {
  if (!input.portfolio_id) {
    throw new MarketOnlyAdjustmentError("invalid_input", "portfolio_id is required");
  }
  if (!input.customer_event_detail_id) {
    throw new MarketOnlyAdjustmentError("invalid_input", "customer_event_detail_id is required");
  }
  if (!Number.isFinite(input.factor) || input.factor <= 0) {
    throw new MarketOnlyAdjustmentError("invalid_input", "factor must be greater than zero");
  }
  if (input.reason !== "Q_FACTOR_UPDATE" && input.reason !== "PROFILE_FACTOR_UPDATE") {
    throw new MarketOnlyAdjustmentError("invalid_input", "reason must be Q_FACTOR_UPDATE or PROFILE_FACTOR_UPDATE");
  }
  return {
    portfolio_id: input.portfolio_id,
    customer_event_detail_id: input.customer_event_detail_id,
    factor: input.factor,
    reason: input.reason,
    date: input.date ?? currentIsoDate(),
    event_id: input.event_id,
  };
}

function getCustomerDetail(database: PrototypeDatabase, eventDetailId: string): EventDetail {
  const detail = database.eventDetails.get(eventDetailId);
  if (!detail) {
    throw new MarketOnlyAdjustmentError("not_found", `event_detail_id ${eventDetailId} does not exist`);
  }
  if (detail.leg_type !== "CUSTOMER") {
    throw new MarketOnlyAdjustmentError("invalid_input", "customer_event_detail_id must reference a CUSTOMER detail");
  }
  if (detail.component_code !== "modern.base" && detail.component_code !== "modern.peak") {
    throw new MarketOnlyAdjustmentError("invalid_input", "customer event detail must use Modern customer basis");
  }
  return detail;
}

function getCurrentLinkedMarketQuantity(database: PrototypeDatabase, portfolioId: string, customerDetail: EventDetail): number {
  const activeEvents = new Set(
    [...database.events.values()]
      .filter(
        (event) =>
          event.portfolio_id === portfolioId &&
          event.status === "active" &&
          (event.event_type === "PURCHASE" || event.event_type === "REBALANCE" || event.event_type === "ADJUSTMENT"),
      )
      .map((event) => event.event_id),
  );
  return [...database.eventDetails.values()]
    .filter(
      (detail) =>
        activeEvents.has(detail.event_id) &&
        detail.leg_type === "MARKET" &&
        detail.linked_detail_id === customerDetail.event_detail_id &&
        detail.period === customerDetail.period &&
        detail.price_area === customerDetail.price_area &&
        detail.component_code === `market.base.${customerDetail.price_area?.toLowerCase()}`,
    )
    .reduce((sum, detail) => sum + detail.quantity, 0);
}

function factorTypeForReason(reason: EventDetailReason): EventDetailFactorType {
  return reason === "PROFILE_FACTOR_UPDATE" ? "PROFILE_FACTOR" : "Q_FACTOR";
}

function nextAdjustmentEventId(database: PrototypeDatabase, customerDetail: EventDetail): string {
  const count = [...database.events.values()].filter((event) => event.event_type === "ADJUSTMENT").length;
  return `EVT:ADJUSTMENT:${customerDetail.event_detail_id}:${String(count).padStart(3, "0")}`;
}

function nextEventOrder(database: PrototypeDatabase): number {
  return Math.max(0, ...[...database.events.values()].map((event) => event.created_order)) + 1;
}

function currentIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function roundQuantity(value: number): number {
  return Number(value.toFixed(6));
}

function roundPrice(value: number): number {
  return Number(value.toFixed(6));
}

function wrapDatabaseError<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw new MarketOnlyAdjustmentError(error.code === "not_found" ? "not_found" : "invalid_input", error.message);
    }
    throw error;
  }
}
