import { componentCodeConcept, type ComponentCodeConcept } from "../database/canonicalComponents.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import type { EventDetail, HedgingEvent } from "../database/types.ts";

const CUSTOMER_MODERN_COMPONENTS = new Set(["modern.base", "modern.peak"]);
const MARKET_BASE_COMPONENT_PATTERN = /^market\.base\.(sto|mal|lul|sun)$/;
const EVENT_TYPES = new Set(["PURCHASE", "REBALANCE", "ADJUSTMENT"]);
const EPSILON = 0.000001;

export type ModernCustomerCanonicalRow = {
  calloff_id: string;
  event_id: string;
  event_detail_id: string;
  event_type: string;
  month: string;
  component: "modern.base" | "modern.peak";
  component_concept: ComponentCodeConcept;
  price_area: string | null;
  mwh: number;
  price: number | null;
  value: number;
};

export type ClassicCustomerProjectionRow = {
  calloff_id: string;
  event_id: string;
  month: string;
  component: "classic.offpeak" | "classic.peak";
  component_concept: "projected";
  mwh: number;
  price: number | null;
  value: number;
  source_components: string;
  source_event_detail_ids: string;
};

export type MarketBasisPositionRow = {
  calloff_id: string;
  event_id: string;
  event_type: string;
  month: string;
  component: "market.base";
  component_concept: ComponentCodeConcept;
  price_area: string | null;
  mwh: number;
  price: number | null;
  value: number;
  source_detail_count: number;
};

export function getModernCustomerCanonicalRowsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ModernCustomerCanonicalRow[] {
  return getModernCustomerCanonicalRows(database, portfolioId)
    .filter((row) => row.month.startsWith(`${year}-`))
    .sort(
      (left, right) =>
        left.month.localeCompare(right.month) ||
        left.calloff_id.localeCompare(right.calloff_id) ||
        left.component.localeCompare(right.component) ||
        left.event_detail_id.localeCompare(right.event_detail_id),
    );
}

export function getModernCustomerCanonicalRows(database: PrototypeDatabase, portfolioId: string): ModernCustomerCanonicalRow[] {
  return activeReadModelEvents(database, portfolioId)
    .flatMap((event) =>
      eventDetails(database, event)
        .filter(
          (detail) =>
            detail.leg_type === "CUSTOMER" &&
            CUSTOMER_MODERN_COMPONENTS.has(detail.component_code) &&
            detail.quantity_type === "MWh",
        )
        .map((detail) => ({
          calloff_id: calloffIdFromEvent(event.event_id),
          event_id: event.event_id,
          event_detail_id: detail.event_detail_id,
          event_type: event.event_type,
          month: detail.period,
          component: detail.component_code as ModernCustomerCanonicalRow["component"],
          component_concept: componentCodeConcept(detail.component_code),
          price_area: detail.price_area,
          mwh: round(detail.quantity),
          price: detail.price === null ? null : roundPrice(detail.price),
          value: round(detail.quantity * (detail.price ?? 0)),
        })),
    );
}

export function getClassicCustomerProjectionRowsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): ClassicCustomerProjectionRow[] {
  return getClassicCustomerProjectionRows(database, portfolioId)
    .filter((row) => row.month.startsWith(`${year}-`))
    .sort(
      (left, right) =>
        left.month.localeCompare(right.month) ||
        left.calloff_id.localeCompare(right.calloff_id) ||
        left.component.localeCompare(right.component),
    );
}

export function getClassicCustomerProjectionRows(database: PrototypeDatabase, portfolioId: string): ClassicCustomerProjectionRow[] {
  const rows = getModernCustomerCanonicalRows(database, portfolioId);
  const groups = new Map<string, ModernCustomerCanonicalRow[]>();
  for (const row of rows) {
    const key = `${row.event_id}|${row.month}`;
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  }

  return [...groups.values()].flatMap((groupRows) => projectModernGroupToClassic(database, groupRows));
}

export function getMarketBasisPositionRowsForPortfolioYear(
  database: PrototypeDatabase,
  portfolioId: string,
  year: string,
): MarketBasisPositionRow[] {
  return getMarketBasisPositionRows(database, portfolioId)
    .filter((row) => row.month.startsWith(`${year}-`))
    .sort(
      (left, right) =>
        left.month.localeCompare(right.month) ||
        left.calloff_id.localeCompare(right.calloff_id) ||
        (left.price_area ?? "").localeCompare(right.price_area ?? "") ||
        left.event_id.localeCompare(right.event_id),
    );
}

export function getMarketBasisPositionRows(database: PrototypeDatabase, portfolioId: string): MarketBasisPositionRow[] {
  const groups = new Map<string, { event: HedgingEvent; details: EventDetail[] }>();
  for (const event of activeReadModelEvents(database, portfolioId)) {
    for (const detail of eventDetails(database, event)) {
      if (detail.leg_type !== "MARKET" || !MARKET_BASE_COMPONENT_PATTERN.test(detail.component_code)) {
        continue;
      }
      const key = `${event.event_id}|${detail.period}|${detail.price_area ?? ""}`;
      const group = groups.get(key) ?? { event, details: [] };
      group.details.push(detail);
      groups.set(key, group);
    }
  }

  return [...groups.values()].map(({ event, details }) => {
    const volume = details.reduce((sum, detail) => sum + detail.quantity, 0);
    const value = details.reduce((sum, detail) => sum + detail.quantity * (detail.price ?? 0), 0);
    return {
      calloff_id: calloffIdFromEvent(event.event_id),
      event_id: event.event_id,
      event_type: event.event_type,
      month: details[0].period,
      component: "market.base",
      component_concept: componentCodeConcept("market.base.sto"),
      price_area: details.find((detail) => detail.price_area)?.price_area ?? null,
      mwh: round(volume),
      price: Math.abs(volume) <= EPSILON ? null : roundPrice(value / volume),
      value: round(value),
      source_detail_count: details.length,
    };
  });
}

function projectModernGroupToClassic(database: PrototypeDatabase, rows: ModernCustomerCanonicalRow[]): ClassicCustomerProjectionRow[] {
  const [first] = rows;
  if (!first) {
    return [];
  }
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === first.month);
  if (!calendar) {
    throw new Error(`Missing calendar for ${first.month}`);
  }
  const totalHours = calendar.total_h;
  const peakHours = calendar.peak_h;
  const offpeakHours = totalHours - peakHours;
  const baseRows = rows.filter((row) => row.component === "modern.base");
  const peakRows = rows.filter((row) => row.component === "modern.peak");
  const baseMwh = sum(baseRows, "mwh");
  const peakMwh = sum(peakRows, "mwh");
  const baseValue = sum(baseRows, "value");
  const peakValue = sum(peakRows, "value");
  const baseMw = Math.abs(totalHours) <= EPSILON ? 0 : baseMwh / totalHours;
  const offpeakMwh = baseMw * offpeakHours;
  const peakBaseMwh = baseMw * peakHours;
  const basePrice = weightedPrice(baseValue, baseMwh);
  const offpeakValue = offpeakMwh * (basePrice ?? 0);
  const peakValueProjected = peakBaseMwh * (basePrice ?? 0) + peakValue;
  const sourceComponents = [...new Set(rows.map((row) => row.component))].sort().join("+");
  const sourceDetailIds = rows.map((row) => row.event_detail_id).sort().join("+");

  return [
    {
      calloff_id: first.calloff_id,
      event_id: first.event_id,
      month: first.month,
      component: "classic.offpeak",
      component_concept: "projected",
      mwh: round(offpeakMwh),
      price: weightedPrice(offpeakValue, offpeakMwh),
      value: round(offpeakValue),
      source_components: sourceComponents,
      source_event_detail_ids: sourceDetailIds,
    },
    {
      calloff_id: first.calloff_id,
      event_id: first.event_id,
      month: first.month,
      component: "classic.peak",
      component_concept: "projected",
      mwh: round(peakBaseMwh + peakMwh),
      price: weightedPrice(peakValueProjected, peakBaseMwh + peakMwh),
      value: round(peakValueProjected),
      source_components: sourceComponents,
      source_event_detail_ids: sourceDetailIds,
    },
  ];
}

function activeReadModelEvents(database: PrototypeDatabase, portfolioId: string): HedgingEvent[] {
  return [...database.events.values()]
    .filter((event) => event.portfolio_id === portfolioId && event.status === "active" && EVENT_TYPES.has(event.event_type))
    .sort((left, right) => left.created_order - right.created_order || left.event_id.localeCompare(right.event_id));
}

function eventDetails(database: PrototypeDatabase, event: HedgingEvent): EventDetail[] {
  return [...database.eventDetails.values()]
    .filter((detail) => detail.event_id === event.event_id)
    .sort((left, right) => left.event_detail_id.localeCompare(right.event_detail_id));
}

function calloffIdFromEvent(eventId: string): string {
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

function sum(rows: ModernCustomerCanonicalRow[], key: "mwh" | "value"): number {
  return rows.reduce((total, row) => total + row[key], 0);
}

function weightedPrice(value: number, volume: number): number | null {
  if (Math.abs(volume) <= EPSILON) {
    return null;
  }
  return roundPrice(value / volume);
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function roundPrice(value: number): number {
  return Number(value.toFixed(6));
}
