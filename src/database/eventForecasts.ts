import type { PrototypeDatabase } from "./schema.ts";
import type { Calloff, CustomerForecast, CustomerTransaction, EventDetail, HedgingEvent } from "./types.ts";
import { insertEvent, insertEventDetail } from "./repository.ts";

export const SUPPORTED_PRICE_AREAS = ["STO", "MAL", "LUL", "SUN"] as const;

export type SupportedPriceArea = (typeof SUPPORTED_PRICE_AREAS)[number];

export type PriceAreaShare = {
  price_area: SupportedPriceArea;
  share: number;
};

export type CanonicalForecast = {
  forecast_id: string;
  portfolio_id: string;
  month: string;
  mwh: number;
  peak_pct: number;
};

export type PurchaseEventResult = {
  event: HedgingEvent;
  event_details: EventDetail[];
};

const PRICE_AREA_SHARES: PriceAreaShare[] = [
  { price_area: "STO", share: 0.4 },
  { price_area: "MAL", share: 0.25 },
  { price_area: "LUL", share: 0.2 },
  { price_area: "SUN", share: 0.15 },
];

export function createForecastEventDetailsForForecast(
  database: PrototypeDatabase,
  forecast: CustomerForecast,
  source = "poc_seed",
): { event: HedgingEvent; event_details: EventDetail[] } {
  const eventId = forecastEventId(forecast.portfolio_id, forecast.month);
  const event = upsertEvent(database, {
    event_id: eventId,
    portfolio_id: forecast.portfolio_id,
    event_type: "FORECAST",
    version: 1,
    created_at: `${forecast.month}-01`,
    created_order: nextEventOrder(database, eventId),
    source,
    status: "active",
  });

  deleteEventDetails(database, eventId);
  const peakMwh = forecast.mwh * forecast.peak_pct;
  const totalH = forecastHoursForComponent(database, forecast.month, "base.sto");
  const peakH = forecastHoursForComponent(database, forecast.month, "peak.sto");
  const eventDetails = PRICE_AREA_SHARES.flatMap(({ price_area: priceArea, share }) => [
    insertEventDetail(database, {
      event_detail_id: forecastEventDetailId(eventId, `base.${priceArea.toLowerCase()}`),
      event_id: eventId,
      component_code: `base.${priceArea.toLowerCase()}`,
      period: forecast.month,
      price_area: priceArea,
      quantity: roundStoredQuantity((forecast.mwh * share) / totalH),
      quantity_type: "MW",
      price: null,
      price_type: null,
      factor: null,
      factor_type: null,
    }),
    insertEventDetail(database, {
      event_detail_id: forecastEventDetailId(eventId, `peak.${priceArea.toLowerCase()}`),
      event_id: eventId,
      component_code: `peak.${priceArea.toLowerCase()}`,
      period: forecast.month,
      price_area: priceArea,
      quantity: roundStoredQuantity((peakMwh * share) / peakH),
      quantity_type: "MW",
      price: null,
      price_type: null,
      factor: null,
      factor_type: null,
    }),
  ]);

  return { event, event_details: eventDetails };
}

export function syncForecastEventDetails(database: PrototypeDatabase, forecast: CustomerForecast): { event: HedgingEvent; event_details: EventDetail[] } {
  return createForecastEventDetailsForForecast(database, forecast, "forecast_feature");
}

export function getCanonicalForecast(database: PrototypeDatabase, portfolioId: string, month: string): CanonicalForecast | undefined {
  const event = getForecastEvent(database, portfolioId, month);
  if (!event) {
    return getCompatibilityForecast(database, portfolioId, month);
  }

  const details = getEventDetails(database, event.event_id).filter((detail) => detail.period === month);
  let baseMwh = 0;
  let peakMwh = 0;
  try {
    baseMwh = details
      .filter((detail) => /^base\.(sto|mal|lul|sun)$/.test(detail.component_code))
      .reduce((sum, detail) => sum + forecastDetailMwh(database, detail), 0);
    peakMwh = details
      .filter((detail) => /^peak\.(sto|mal|lul|sun)$/.test(detail.component_code))
      .reduce((sum, detail) => sum + forecastDetailMwh(database, detail), 0);
  } catch (error) {
    if (error instanceof Error && /Missing calendar/.test(error.message)) {
      return getCompatibilityForecast(database, portfolioId, month);
    }
    throw error;
  }

  if (baseMwh <= 0) {
    return getCompatibilityForecast(database, portfolioId, month);
  }

  return {
    forecast_id: event.event_id,
    portfolio_id: portfolioId,
    month,
    mwh: roundQuantity(baseMwh),
    peak_pct: roundDecimal(peakMwh / baseMwh),
  };
}

export function getCanonicalForecasts(database: PrototypeDatabase, portfolioId: string): CanonicalForecast[] {
  const months = new Set<string>();
  for (const event of database.events.values()) {
    if (event.portfolio_id !== portfolioId || event.event_type !== "FORECAST" || event.status !== "active") {
      continue;
    }
    for (const detail of getEventDetails(database, event.event_id)) {
      months.add(detail.period);
    }
  }
  for (const forecast of database.forecasts.values()) {
    if (forecast.portfolio_id === portfolioId) {
      months.add(forecast.month);
    }
  }

  return [...months]
    .sort()
    .map((month) => getCanonicalForecast(database, portfolioId, month))
    .filter((forecast): forecast is CanonicalForecast => Boolean(forecast));
}

export function getForecastAreaShares(database: PrototypeDatabase, portfolioId: string, month: string): PriceAreaShare[] {
  const event = getForecastEvent(database, portfolioId, month);
  if (!event) {
    return PRICE_AREA_SHARES;
  }
  const baseDetails = getEventDetails(database, event.event_id).filter(
    (detail) => detail.price_area && /^base\.(sto|mal|lul|sun)$/.test(detail.component_code),
  );
  let baseMwhByArea: { detail: EventDetail; mwh: number }[] = [];
  let total = 0;
  try {
    baseMwhByArea = baseDetails.map((detail) => ({ detail, mwh: forecastDetailMwh(database, detail) }));
    total = baseMwhByArea.reduce((sum, row) => sum + row.mwh, 0);
  } catch (error) {
    if (error instanceof Error && /Missing calendar/.test(error.message)) {
      return PRICE_AREA_SHARES;
    }
    throw error;
  }
  if (total <= 0) {
    return PRICE_AREA_SHARES;
  }
  return baseMwhByArea.map(({ detail, mwh }) => ({
    price_area: detail.price_area as SupportedPriceArea,
    share: mwh / total,
  }));
}

export function createPurchaseEventForCalloff(
  database: PrototypeDatabase,
  input: { calloff: Calloff; transactions: CustomerTransaction[]; source?: string },
): PurchaseEventResult {
  const eventId = purchaseEventId(input.calloff.calloff_id);
  const event = upsertEvent(database, {
    event_id: eventId,
    portfolio_id: input.calloff.portfolio_id,
    event_type: "PURCHASE",
    version: 1,
    created_at: input.calloff.date,
    created_order: nextEventOrder(database, eventId),
    source: input.source ?? "forecast_hedge",
    status: "active",
  });

  deleteEventDetails(database, eventId);
  const eventDetails: EventDetail[] = [];
  for (const transaction of input.transactions) {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id)?.component;
    if (!component) {
      continue;
    }
    const details = eventDetailsForTransaction(database, eventId, input.calloff, transaction, component);
    eventDetails.push(...details.map((detail) => insertEventDetail(database, detail)));
  }

  return { event, event_details: eventDetails };
}

export function getEventDetails(database: PrototypeDatabase, eventId: string): EventDetail[] {
  return [...database.eventDetails.values()]
    .filter((detail) => detail.event_id === eventId)
    .sort((left, right) => left.event_detail_id.localeCompare(right.event_detail_id));
}

function eventDetailsForTransaction(
  database: PrototypeDatabase,
  eventId: string,
  calloff: Calloff,
  transaction: CustomerTransaction,
  componentCode: string,
): EventDetail[] {
  if (componentCode === "currency.eursek") {
    return [
      eventDetailFromTransaction(eventId, transaction, componentCode, null, transaction.quantity ?? 0, transaction.quantity_type ?? "EUR", 0),
    ];
  }

  const shares = getForecastAreaShares(database, calloff.portfolio_id, transaction.month);
  return shares.map(({ price_area: priceArea, share }, index) => {
    const detailComponent = eventDetailComponentForTransaction(componentCode, priceArea);
    return eventDetailFromTransaction(
      eventId,
      transaction,
      detailComponent,
      priceArea,
      roundQuantity((transaction.quantity ?? transaction.mw) * share),
      transaction.quantity_type ?? "MW",
      index,
    );
  });
}

function eventDetailFromTransaction(
  eventId: string,
  transaction: CustomerTransaction,
  componentCode: string,
  priceArea: SupportedPriceArea | null,
  quantity: number,
  quantityType: "MW" | "EUR",
  index: number,
): EventDetail {
  return {
    event_detail_id: purchaseEventDetailId(eventId, transaction.transaction_id, componentCode, priceArea, index),
    event_id: eventId,
    component_code: componentCode,
    period: transaction.month,
    price_area: priceArea,
    quantity,
    quantity_type: quantityType,
    price: transaction.price ?? null,
    price_type: transaction.price_type ?? null,
    factor: transaction.factor ?? null,
    factor_type: transaction.factor_type ?? null,
  };
}

function eventDetailComponentForTransaction(componentCode: string, priceArea: SupportedPriceArea): string {
  if (componentCode === "base.epad") {
    return `base.${priceArea.toLowerCase()}`;
  }
  if (componentCode === "peak.epad") {
    return `peak.${priceArea.toLowerCase()}`;
  }
  return componentCode;
}

function upsertEvent(database: PrototypeDatabase, input: HedgingEvent): HedgingEvent {
  const existing = database.events.get(input.event_id);
  if (existing) {
    Object.assign(existing, input);
    return existing;
  }
  return insertEvent(database, input);
}

function deleteEventDetails(database: PrototypeDatabase, eventId: string): void {
  for (const detail of [...database.eventDetails.values()]) {
    if (detail.event_id === eventId) {
      database.eventDetails.delete(detail.event_detail_id);
    }
  }
}

function getForecastEvent(database: PrototypeDatabase, portfolioId: string, month: string): HedgingEvent | undefined {
  return [...database.events.values()]
    .filter((event) => event.portfolio_id === portfolioId && event.event_type === "FORECAST" && event.status === "active")
    .find((event) => getEventDetails(database, event.event_id).some((detail) => detail.period === month));
}

function getCompatibilityForecast(database: PrototypeDatabase, portfolioId: string, month: string): CanonicalForecast | undefined {
  const forecast = [...database.forecasts.values()].find(
    (candidate) => candidate.portfolio_id === portfolioId && candidate.month === month,
  );
  return forecast ? { ...forecast } : undefined;
}

function forecastEventId(portfolioId: string, month: string): string {
  return `EVT:FORECAST:${portfolioId}:${month}`;
}

function purchaseEventId(calloffId: string): string {
  return `EVT:PURCHASE:${calloffId}`;
}

function forecastEventDetailId(eventId: string, componentCode: string): string {
  return `${eventId}:${componentCode}`;
}

function purchaseEventDetailId(
  eventId: string,
  transactionId: string,
  componentCode: string,
  priceArea: SupportedPriceArea | null,
  index: number,
): string {
  return `${eventId}:${transactionId}:${componentCode}:${priceArea ?? "NA"}:${String(index).padStart(2, "0")}`;
}

function forecastDetailMwh(database: PrototypeDatabase, detail: EventDetail): number {
  if (detail.quantity_type === "MWh") {
    return detail.quantity;
  }
  if (detail.quantity_type !== "MW") {
    return 0;
  }
  return detail.quantity * forecastHoursForComponent(database, detail.period, detail.component_code);
}

function forecastHoursForComponent(database: PrototypeDatabase, month: string, componentCode: string): number {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    throw new Error(`Missing calendar for ${month}`);
  }
  if (componentCode.startsWith("peak.")) {
    return calendar.peak_h;
  }
  return calendar.total_h;
}

function nextEventOrder(database: PrototypeDatabase, eventId: string): number {
  return database.events.get(eventId)?.created_order ?? database.events.size + 1;
}

function roundQuantity(value: number): number {
  return Number(value.toFixed(6));
}

function roundStoredQuantity(value: number): number {
  return Number(value.toFixed(9));
}

function roundDecimal(value: number): number {
  return Number(value.toFixed(6));
}
