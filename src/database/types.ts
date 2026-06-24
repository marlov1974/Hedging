export type Customer = {
  customer_id: string;
  name: string;
  customer_number: string;
};

export type Calendar = {
  calendar_id: string;
  month: string;
  total_h: number;
  peak_h: number;
};

export type CustomerPortfolio = {
  portfolio_id: string;
  customer_id: string;
  name: string;
  customer_number: string;
  price_area: string;
  calendar_id: string;
  currency?: string;
};

export type CustomerForecast = {
  forecast_id: string;
  portfolio_id: string;
  month: string;
  mwh: number;
  peak_pct: number;
};

export type EventType = "FORECAST" | "PURCHASE" | "ADJUSTMENT" | "CORRECTION" | "CANCELLATION" | "SETTLEMENT";

export type EventStatus = "active" | "cancelled";

export type HedgingEvent = {
  event_id: string;
  portfolio_id: string;
  event_type: EventType;
  version: number;
  created_at: string;
  created_order: number;
  source: string;
  status: EventStatus;
};

export type EventDetailQuantityType = "MW" | "MWh" | "EUR";

export type EventDetail = {
  event_detail_id: string;
  event_id: string;
  component_code: string;
  period: string;
  price_area: string | null;
  quantity: number;
  quantity_type: EventDetailQuantityType;
  price: number | null;
  price_type: "EUR_PER_MWH" | "SEK_PER_EUR" | null;
  factor: number | null;
  factor_type: "Q_FACTOR" | null;
};

export type ProductConfiguration = {
  product_id: string;
  name: string;
};

export type ComponentCategory = "allocation" | "base" | "peak" | "profile" | "volume" | "currency" | "adjustment";

export type ComponentHourBasis = "total_h" | "peak_h" | "offpeak_h" | "none";

export type ProductConfigurationComponent = {
  productcomponent_id: string;
  product_id: string;
  name: string;
  component: string;
  productitem: string;
  component_category?: ComponentCategory;
  hour_basis?: ComponentHourBasis;
};

export type PriceComponent = {
  pricecomponent_id: string;
  productcomponent_id: string;
  price: number;
  currency: string;
};

export type PortfolioProductComponent = {
  portfolio_productcomponent_id: string;
  portfolio_id: string;
  productcomponent_id: string;
  qfactor_set_id: string;
};

export type QFactorSet = {
  qfactor_set_id: string;
  name: string;
  component: string;
  description: string;
};

export type QFactorValue = {
  qfactor_value_id: string;
  qfactor_set_id: string;
  month: string;
  value: number;
};

export type Calloff = {
  calloff_id: string;
  product_id: string;
  portfolio_id: string;
  date: string;
  delivery_start_month: string;
  delivery_end_month: string;
};

export type CustomerTransaction = {
  transaction_id: string;
  calloff_id: string;
  month: string;
  productcomponent_id: string;
  mw: number;
  q_factor: number;
  quantity?: number;
  quantity_type?: "MW" | "EUR";
  price?: number;
  price_type?: "EUR_PER_MWH" | "SEK_PER_EUR";
  factor?: number | null;
  factor_type?: "Q_FACTOR" | null;
};

export type CustomerPortfolioWithForecasts = {
  portfolio: CustomerPortfolio;
  customer: Customer;
  calendar: Calendar;
  forecasts: CustomerForecast[];
};

export type ProductConfigurationComponentWithPrices = {
  component: ProductConfigurationComponent;
  price_components: PriceComponent[];
};

export type ProductConfigurationWithComponents = {
  product: ProductConfiguration;
  components: ProductConfigurationComponentWithPrices[];
};

export type CalloffWithTransactions = {
  calloff: Calloff;
  transactions: CustomerTransaction[];
};

export class DatabaseError extends Error {
  readonly code: "invalid_input" | "duplicate_key" | "not_found";

  constructor(code: "invalid_input" | "duplicate_key" | "not_found", message: string) {
    super(message);
    this.code = code;
    this.name = "DatabaseError";
  }
}
