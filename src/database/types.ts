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
};

export type CustomerForecast = {
  forecast_id: string;
  portfolio_id: string;
  month: string;
  mwh: number;
  peak_pct: number;
};

export type ProductConfiguration = {
  product_id: string;
  name: string;
};

export type ProductConfigurationComponent = {
  productcomponent_id: string;
  product_id: string;
  name: string;
  component: string;
  productitem: string;
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
};

export type CustomerTransaction = {
  transaction_id: string;
  calloff_id: string;
  month: string;
  productcomponent_id: string;
  mw: number;
  q_factor: number;
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
