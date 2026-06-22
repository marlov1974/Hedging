import type {
  Calendar,
  Calloff,
  Customer,
  CustomerForecast,
  CustomerPortfolio,
  CustomerTransaction,
  PriceComponent,
  PortfolioProductComponent,
  ProductConfiguration,
  ProductConfigurationComponent,
  QFactorSet,
  QFactorValue,
} from "./types.ts";

export type PrototypeDatabase = {
  customers: Map<string, Customer>;
  customersByNumber: Map<string, string>;
  calendars: Map<string, Calendar>;
  portfolios: Map<string, CustomerPortfolio>;
  forecasts: Map<string, CustomerForecast>;
  forecastsByPortfolioMonth: Map<string, string>;
  productConfigurations: Map<string, ProductConfiguration>;
  productConfigurationComponents: Map<string, ProductConfigurationComponent>;
  priceComponents: Map<string, PriceComponent>;
  portfolioProductComponents: Map<string, PortfolioProductComponent>;
  qFactorSets: Map<string, QFactorSet>;
  qFactorValues: Map<string, QFactorValue>;
  qFactorValuesBySetMonth: Map<string, string>;
  calloffs: Map<string, Calloff>;
  transactions: Map<string, CustomerTransaction>;
};

export function createSchema(): PrototypeDatabase {
  return {
    customers: new Map(),
    customersByNumber: new Map(),
    calendars: new Map(),
    portfolios: new Map(),
    forecasts: new Map(),
    forecastsByPortfolioMonth: new Map(),
    productConfigurations: new Map(),
    productConfigurationComponents: new Map(),
    priceComponents: new Map(),
    portfolioProductComponents: new Map(),
    qFactorSets: new Map(),
    qFactorValues: new Map(),
    qFactorValuesBySetMonth: new Map(),
    calloffs: new Map(),
    transactions: new Map(),
  };
}
