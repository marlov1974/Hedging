import type { PrototypeDatabase } from "./schema.ts";
import type {
  Calloff,
  CustomerForecast,
  CustomerTransaction,
  EventDetail,
  EventDetailPriceType,
  HedgingEvent,
  PriceComponent,
  ProductConfigurationComponent,
} from "./types.ts";
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

export type CustomerHedgePolicy = "derive_modern" | "none";

export type MarketBasisPolicy = "from_customer" | "from_baseloads_transactions" | "none";

export type ModernCustomerEventDetailInput = {
  month: string;
  price_area: string | null;
  modern_base_mwh: number;
  modern_peak_mwh: number;
  modern_base_price: number | null;
  modern_peak_price: number | null;
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
      leg_type: "MARKET",
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
      leg_type: "MARKET",
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

export function getCanonicalForecastForPriceArea(
  database: PrototypeDatabase,
  portfolioId: string,
  month: string,
  priceArea: SupportedPriceArea,
): CanonicalForecast | undefined {
  const event = getForecastEvent(database, portfolioId, month);
  if (!event) {
    return getCompatibilityForecastForPriceArea(database, portfolioId, month, priceArea);
  }

  const areaCode = priceArea.toLowerCase();
  const details = getEventDetails(database, event.event_id).filter((detail) => detail.period === month && detail.price_area === priceArea);
  let baseMwh = 0;
  let peakMwh = 0;
  try {
    baseMwh = details
      .filter((detail) => detail.component_code === `base.${areaCode}`)
      .reduce((sum, detail) => sum + forecastDetailMwh(database, detail), 0);
    peakMwh = details
      .filter((detail) => detail.component_code === `peak.${areaCode}`)
      .reduce((sum, detail) => sum + forecastDetailMwh(database, detail), 0);
  } catch (error) {
    if (error instanceof Error && /Missing calendar/.test(error.message)) {
      return getCompatibilityForecastForPriceArea(database, portfolioId, month, priceArea);
    }
    throw error;
  }

  if (baseMwh <= 0) {
    return getCompatibilityForecastForPriceArea(database, portfolioId, month, priceArea);
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
  input: {
    calloff: Calloff;
    transactions: CustomerTransaction[];
    source?: string;
    modern_customer_rows?: ModernCustomerEventDetailInput[];
    customer_hedge_policy?: CustomerHedgePolicy;
    market_basis_policy?: MarketBasisPolicy;
    commercial_add_ons?: boolean;
  },
): PurchaseEventResult {
  return createCalloffEvent(database, {
    ...input,
    event_type: "PURCHASE",
    event_id: purchaseEventId(input.calloff.calloff_id),
    source: input.source ?? "forecast_hedge",
  });
}

export function createRebalanceEventForCalloff(
  database: PrototypeDatabase,
  input: {
    calloff: Calloff;
    transactions: CustomerTransaction[];
    source?: string;
    modern_customer_rows?: ModernCustomerEventDetailInput[];
    customer_hedge_policy?: CustomerHedgePolicy;
    market_basis_policy?: MarketBasisPolicy;
    commercial_add_ons?: boolean;
  },
): PurchaseEventResult {
  return createCalloffEvent(database, {
    ...input,
    event_type: "REBALANCE",
    event_id: rebalanceEventId(input.calloff.calloff_id),
    source: input.source ?? "rebalance",
  });
}

function createCalloffEvent(
  database: PrototypeDatabase,
  input: {
    calloff: Calloff;
    transactions: CustomerTransaction[];
    event_type: "PURCHASE" | "REBALANCE";
    event_id: string;
    source: string;
    modern_customer_rows?: ModernCustomerEventDetailInput[];
    customer_hedge_policy?: CustomerHedgePolicy;
    market_basis_policy?: MarketBasisPolicy;
    commercial_add_ons?: boolean;
  },
): PurchaseEventResult {
  const event = upsertEvent(database, {
    event_id: input.event_id,
    portfolio_id: input.calloff.portfolio_id,
    event_type: input.event_type,
    version: 1,
    created_at: input.calloff.date,
    created_order: nextEventOrder(database, input.event_id),
    source: input.source,
    status: "active",
  });

  deleteEventDetails(database, input.event_id);
  const eventDetails: EventDetail[] = [];
  const customerHedgePolicy = input.customer_hedge_policy ?? "derive_modern";
  const customerDetails =
    customerHedgePolicy === "none"
      ? []
      : input.modern_customer_rows
        ? modernCustomerEventDetailsForRows(input.event_id, input.modern_customer_rows)
        : modernCustomerEventDetailsForTransactions(database, input.event_id, input.transactions);
  eventDetails.push(...customerDetails.map((detail) => insertEventDetail(database, detail)));
  const marketBasisPolicy = input.market_basis_policy ?? "from_customer";
  const marketBasisDetails =
    marketBasisPolicy === "from_customer"
      ? marketBasisEventDetailsForCustomerDetails(database, input.event_id, input.transactions, customerDetails)
      : marketBasisPolicy === "from_baseloads_transactions"
        ? marketBasisEventDetailsForBaseloadsTransactions(database, input.event_id, input.calloff, input.transactions)
        : [];
  eventDetails.push(...marketBasisDetails.map((detail) => insertEventDetail(database, detail)));
  if (input.commercial_add_ons) {
    eventDetails.push(
      ...commercialAddOnEventDetailsForCalloff(database, input.event_id, input.calloff, input.transactions, customerDetails).map((detail) =>
        insertEventDetail(database, detail),
      ),
    );
  }
  for (const transaction of input.transactions) {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id)?.component;
    if (!component) {
      continue;
    }
    const details = eventDetailsForTransaction(database, input.event_id, input.calloff, transaction, component);
    eventDetails.push(...details.map((detail) => insertEventDetail(database, detail)));
  }

  return { event, event_details: eventDetails };
}

function marketBasisEventDetailsForBaseloadsTransactions(
  database: PrototypeDatabase,
  eventId: string,
  calloff: Calloff,
  transactions: CustomerTransaction[],
): EventDetail[] {
  const groups = new Map<string, { month: string; price_area: SupportedPriceArea; transactions: CustomerTransaction[] }>();
  for (const transaction of transactions) {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id)?.component;
    if (component !== "base.sys" && component !== "base.epad") {
      continue;
    }
    const priceArea = normalizeMarketBasisPriceArea(transaction.price_area ?? null);
    const key = `${transaction.month}|${priceArea}`;
    const group = groups.get(key) ?? { month: transaction.month, price_area: priceArea, transactions: [] };
    group.transactions.push(transaction);
    groups.set(key, group);
  }

  return [...groups.values()].flatMap((group) => {
    const baseSys = transactionForComponent(database, group.transactions, "base.sys");
    if (!baseSys) {
      return [];
    }
    const calendar = [...database.calendars.values()].find((candidate) => candidate.month === group.month);
    const quantity = roundQuantity(transactionQuantity(baseSys) * (calendar?.total_h ?? 1));
    return [
      {
        event_detail_id: `${eventId}:MARKET:${group.month}:baseloads:market.base.${group.price_area.toLowerCase()}`,
        event_id: eventId,
        leg_type: "MARKET",
        component_code: `market.base.${group.price_area.toLowerCase()}`,
        period: group.month,
        price_area: group.price_area,
        quantity,
        quantity_type: "MWh",
        price: combinedComponentPrice(database, group.transactions, ["base.sys", "base.epad"]),
        price_type: "EUR_PER_MWH",
        factor: 1,
        factor_type: "Q_FACTOR",
        reason: null,
        linked_detail_id: null,
      },
    ];
  });
}

function commercialAddOnEventDetailsForCalloff(
  database: PrototypeDatabase,
  eventId: string,
  calloff: Calloff,
  transactions: CustomerTransaction[],
  customerDetails: EventDetail[],
): EventDetail[] {
  const details: EventDetail[] = [];
  const feeComponent = configuredCommercialComponent(database, calloff.product_id, "fee.calloff");
  if (feeComponent) {
    for (const [month, volume] of customerCalloffVolumesByMonth(database, transactions, customerDetails)) {
      details.push(commercialAddOnDetail(eventId, month, "fee.calloff", roundQuantity(Math.abs(volume)), feeComponent, null));
    }
  }

  for (const peakDetail of customerDetails.filter((detail) => detail.component_code === "modern.peak")) {
    for (const componentCode of ["premium.q_term", "premium.p_agent"] as const) {
      const premiumComponent = configuredCommercialComponent(database, calloff.product_id, componentCode);
      if (!premiumComponent) {
        continue;
      }
      details.push(
        commercialAddOnDetail(eventId, peakDetail.period, componentCode, roundQuantity(peakDetail.quantity), premiumComponent, peakDetail.event_detail_id),
      );
    }
  }

  return details;
}

function customerCalloffVolumesByMonth(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  customerDetails: EventDetail[],
): Map<string, number> {
  const volumes = new Map<string, number>();
  const hedgeCustomerDetails = customerDetails.filter(
    (detail) => detail.component_code === "modern.base" || detail.component_code === "modern.peak",
  );
  if (hedgeCustomerDetails.length > 0) {
    for (const detail of hedgeCustomerDetails) {
      volumes.set(detail.period, (volumes.get(detail.period) ?? 0) + Math.abs(detail.quantity));
    }
    return volumes;
  }

  for (const transaction of transactions) {
    const component = database.productConfigurationComponents.get(transaction.productcomponent_id)?.component;
    if (component !== "base.sys") {
      continue;
    }
    const calendar = [...database.calendars.values()].find((candidate) => candidate.month === transaction.month);
    const volume = transactionQuantity(transaction) * (calendar?.total_h ?? 1);
    volumes.set(transaction.month, (volumes.get(transaction.month) ?? 0) + Math.abs(volume));
  }
  return volumes;
}

function configuredCommercialComponent(
  database: PrototypeDatabase,
  productId: string,
  componentCode: "fee.calloff" | "premium.q_term" | "premium.p_agent",
): { component: ProductConfigurationComponent; price: PriceComponent } | null {
  const component = [...database.productConfigurationComponents.values()].find(
    (candidate) => candidate.product_id === productId && candidate.component === componentCode,
  );
  if (!component) {
    return null;
  }
  const price = [...database.priceComponents.values()].find((candidate) => candidate.productcomponent_id === component.productcomponent_id);
  return price ? { component, price } : null;
}

function commercialAddOnDetail(
  eventId: string,
  month: string,
  componentCode: "fee.calloff" | "premium.q_term" | "premium.p_agent",
  quantity: number,
  configured: { component: ProductConfigurationComponent; price: PriceComponent },
  linkedDetailId: string | null,
): EventDetail {
  return {
    event_detail_id: `${eventId}:CUSTOMER:${month}:${componentCode}`,
    event_id: eventId,
    leg_type: "CUSTOMER",
    component_code: componentCode,
    period: month,
    price_area: null,
    quantity,
    quantity_type: "MWh",
    price: configured.price.price,
    price_type: priceTypeForCurrency(configured.price.currency),
    price_component_id: configured.price.pricecomponent_id,
    price_source: configured.component.productcomponent_id,
    factor: null,
    factor_type: null,
    reason: null,
    linked_detail_id: linkedDetailId,
  };
}

function priceTypeForCurrency(currency: string): EventDetailPriceType {
  const normalized = currency.trim().toUpperCase();
  if (normalized === "EUR") {
    return "EUR_PER_MWH";
  }
  if (normalized === "SEK") {
    return "SEK_PER_MWH";
  }
  return "LOCAL_CCY_PER_MWH";
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

  if (transaction.price_area) {
    const priceArea = transaction.price_area as SupportedPriceArea;
    const detailComponent = eventDetailComponentForTransaction(componentCode, priceArea);
    return [
      eventDetailFromTransaction(
        eventId,
        transaction,
        detailComponent,
        priceArea,
        transaction.quantity ?? transaction.mw,
        transaction.quantity_type ?? "MW",
        0,
      ),
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

function modernCustomerEventDetailsForTransactions(
  database: PrototypeDatabase,
  eventId: string,
  transactions: CustomerTransaction[],
): EventDetail[] {
  const transactionsByMonth = new Map<string, CustomerTransaction[]>();
  for (const transaction of transactions) {
    if (transaction.quantity_type === "EUR") {
      continue;
    }
    const monthTransactions = transactionsByMonth.get(transaction.month) ?? [];
    monthTransactions.push(transaction);
    transactionsByMonth.set(transaction.month, monthTransactions);
  }

  return [...transactionsByMonth.entries()].flatMap(([month, monthTransactions]) => {
    const basis = deriveModernCustomerBasisForMonth(database, month, monthTransactions);
    if (!basis) {
      return [];
    }
    const priceArea = monthTransactions.find((transaction) => transaction.price_area)?.price_area ?? null;
    const details: EventDetail[] = [
      {
        event_detail_id: modernCustomerEventDetailId(eventId, month, "modern.base"),
        event_id: eventId,
        leg_type: "CUSTOMER",
        component_code: "modern.base",
        period: month,
        price_area: priceArea,
        quantity: basis.modern_base_mwh,
        quantity_type: "MWh",
        price: basis.modern_base_price,
        price_type: basis.modern_base_price === null ? null : "EUR_PER_MWH",
        factor: null,
        factor_type: null,
        reason: null,
        linked_detail_id: null,
      },
    ];
    if (Math.abs(basis.modern_peak_mwh) > 0.000001) {
      details.push({
        event_detail_id: modernCustomerEventDetailId(eventId, month, "modern.peak"),
        event_id: eventId,
        leg_type: "CUSTOMER",
        component_code: "modern.peak",
        period: month,
        price_area: priceArea,
        quantity: basis.modern_peak_mwh,
        quantity_type: "MWh",
        price: basis.modern_peak_price,
        price_type: basis.modern_peak_price === null ? null : "EUR_PER_MWH",
        factor: null,
        factor_type: null,
        reason: null,
        linked_detail_id: null,
      });
    }
    return details;
  });
}

function modernCustomerEventDetailsForRows(eventId: string, rows: ModernCustomerEventDetailInput[]): EventDetail[] {
  return rows.flatMap((row) => {
    const details: EventDetail[] = [
      {
        event_detail_id: modernCustomerEventDetailId(eventId, row.month, "modern.base"),
        event_id: eventId,
        leg_type: "CUSTOMER",
        component_code: "modern.base",
        period: row.month,
        price_area: row.price_area,
        quantity: roundQuantity(row.modern_base_mwh),
        quantity_type: "MWh",
        price: row.modern_base_price,
        price_type: row.modern_base_price === null ? null : "EUR_PER_MWH",
        factor: null,
        factor_type: null,
        reason: null,
        linked_detail_id: null,
      },
    ];
    if (Math.abs(row.modern_peak_mwh) > 0.000001) {
      details.push({
        event_detail_id: modernCustomerEventDetailId(eventId, row.month, "modern.peak"),
        event_id: eventId,
        leg_type: "CUSTOMER",
        component_code: "modern.peak",
        period: row.month,
        price_area: row.price_area,
        quantity: roundQuantity(row.modern_peak_mwh),
        quantity_type: "MWh",
        price: row.modern_peak_price,
        price_type: row.modern_peak_price === null ? null : "EUR_PER_MWH",
        factor: null,
        factor_type: null,
        reason: null,
        linked_detail_id: null,
      });
    }
    return details;
  });
}

function marketBasisEventDetailsForCustomerDetails(
  database: PrototypeDatabase,
  eventId: string,
  transactions: CustomerTransaction[],
  customerDetails: EventDetail[],
): EventDetail[] {
  return customerDetails
    .filter((detail) => detail.component_code === "modern.base" || detail.component_code === "modern.peak")
    .map((detail) => {
      const priceArea = normalizeMarketBasisPriceArea(detail.price_area ?? firstTransactionPriceArea(transactions));
      const factor = marketFactorForCustomerDetail(database, transactions, detail);
      return {
        event_detail_id: marketBasisEventDetailId(eventId, detail.period, detail.component_code, priceArea),
        event_id: eventId,
        leg_type: "MARKET",
        component_code: `market.base.${priceArea.toLowerCase()}`,
        period: detail.period,
        price_area: priceArea,
        quantity: roundQuantity(detail.quantity * factor),
        quantity_type: "MWh",
        price: detail.price === null ? null : roundPrice(detail.price / factor),
        price_type: detail.price_type,
        factor,
        factor_type: "Q_FACTOR",
        reason: null,
        linked_detail_id: detail.event_detail_id,
      };
    });
}

function firstTransactionPriceArea(transactions: CustomerTransaction[]): string | null {
  return transactions.find((transaction) => transaction.price_area)?.price_area ?? null;
}

function normalizeMarketBasisPriceArea(value: string | null): SupportedPriceArea {
  const normalized = String(value ?? "STO").trim().toUpperCase();
  return SUPPORTED_PRICE_AREAS.includes(normalized as SupportedPriceArea) ? (normalized as SupportedPriceArea) : "STO";
}

function marketFactorForCustomerDetail(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  detail: EventDetail,
): number {
  const componentCode = detail.component_code === "modern.peak" ? "peak.sys" : "base.sys";
  const transaction = transactionForComponent(database, transactions, componentCode);
  return transaction?.factor ?? transaction?.q_factor ?? 1;
}

function deriveModernCustomerBasisForMonth(
  database: PrototypeDatabase,
  month: string,
  transactions: CustomerTransaction[],
):
  | {
      modern_base_mwh: number;
      modern_peak_mwh: number;
      modern_base_price: number | null;
      modern_peak_price: number | null;
    }
  | undefined {
  const calendar = [...database.calendars.values()].find((candidate) => candidate.month === month);
  if (!calendar) {
    return undefined;
  }
  const baseSys = transactionForComponent(database, transactions, "base.sys");
  if (!baseSys) {
    return undefined;
  }
  const peakSys = transactionForComponent(database, transactions, "peak.sys");
  const allocationPeakSys = transactionForComponent(database, transactions, "allocation.peak.sys");
  const offpeakH = calendar.total_h - calendar.peak_h;
  if (offpeakH <= 0) {
    return undefined;
  }

  const baseMw = transactionQuantity(baseSys);
  const allocationPeakMw = allocationPeakSys ? transactionQuantity(allocationPeakSys) : baseMw + transactionQuantity(peakSys);
  const modernBaseMw = (baseMw * calendar.total_h - allocationPeakMw * calendar.peak_h) / offpeakH;
  const modernPeakMw = allocationPeakMw - modernBaseMw;
  const modernBaseMwh = roundQuantity(modernBaseMw * calendar.total_h);
  const modernPeakMwh = roundQuantity(modernPeakMw * calendar.peak_h);
  const modernBasePrice = combinedComponentPrice(database, transactions, ["base.sys", "base.epad"]);
  const totalValue = transactionValue(database, transactions, calendar.total_h, calendar.peak_h);
  const modernPeakPrice =
    modernBasePrice === null || Math.abs(modernPeakMwh) <= 0.000001
      ? null
      : roundPrice((totalValue - modernBaseMwh * modernBasePrice) / modernPeakMwh);

  return {
    modern_base_mwh: modernBaseMwh,
    modern_peak_mwh: modernPeakMwh,
    modern_base_price: modernBasePrice,
    modern_peak_price: modernPeakPrice,
  };
}

function transactionForComponent(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  componentCode: string,
): CustomerTransaction | undefined {
  return transactions.find((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component === componentCode);
}

function transactionQuantity(transaction: CustomerTransaction | undefined): number {
  return transaction?.quantity ?? transaction?.mw ?? 0;
}

function combinedComponentPrice(
  database: PrototypeDatabase,
  transactions: CustomerTransaction[],
  componentCodes: string[],
): number | null {
  let price = 0;
  for (const componentCode of componentCodes) {
    const transaction = transactionForComponent(database, transactions, componentCode);
    const componentPrice = transaction ? transactionPrice(database, transaction) : null;
    if (componentPrice === null) {
      return null;
    }
    price += componentPrice;
  }
  return roundPrice(price);
}

function transactionValue(database: PrototypeDatabase, transactions: CustomerTransaction[], totalH: number, peakH: number): number {
  return transactions.reduce((sum, transaction) => {
    const price = transactionPrice(database, transaction);
    if (price === null) {
      return sum;
    }
    const componentCode = database.productConfigurationComponents.get(transaction.productcomponent_id)?.component;
    const hours = componentCode?.startsWith("peak.") ? peakH : totalH;
    return sum + transactionQuantity(transaction) * hours * price;
  }, 0);
}

function transactionPrice(database: PrototypeDatabase, transaction: CustomerTransaction): number | null {
  if (transaction.price !== undefined) {
    return transaction.price;
  }
  const price = [...database.priceComponents.values()].find((candidate) => candidate.productcomponent_id === transaction.productcomponent_id);
  return price?.price ?? null;
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
    leg_type: "MARKET",
    component_code: componentCode,
    period: transaction.month,
    price_area: priceArea,
    quantity,
    quantity_type: quantityType,
    price: transaction.price ?? null,
    price_type: transaction.price_type ?? null,
    factor: transaction.factor ?? null,
    factor_type: transaction.factor_type ?? null,
    reason: null,
    linked_detail_id: null,
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

function getCompatibilityForecastForPriceArea(
  database: PrototypeDatabase,
  portfolioId: string,
  month: string,
  priceArea: SupportedPriceArea,
): CanonicalForecast | undefined {
  const forecast = getCompatibilityForecast(database, portfolioId, month);
  if (!forecast) {
    return undefined;
  }
  const share = PRICE_AREA_SHARES.find((candidate) => candidate.price_area === priceArea)?.share ?? 0;
  return {
    ...forecast,
    mwh: roundQuantity(forecast.mwh * share),
  };
}

function forecastEventId(portfolioId: string, month: string): string {
  return `EVT:FORECAST:${portfolioId}:${month}`;
}

function purchaseEventId(calloffId: string): string {
  return `EVT:PURCHASE:${calloffId}`;
}

function rebalanceEventId(calloffId: string): string {
  return `EVT:REBALANCE:${calloffId}`;
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

function modernCustomerEventDetailId(eventId: string, month: string, componentCode: string): string {
  return `${eventId}:CUSTOMER:${month}:${componentCode}`;
}

function marketBasisEventDetailId(eventId: string, month: string, customerComponentCode: string, priceArea: SupportedPriceArea): string {
  return `${eventId}:MARKET:${month}:${customerComponentCode}:market.base.${priceArea.toLowerCase()}`;
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

function roundPrice(value: number): number {
  return Number(value.toFixed(6));
}
