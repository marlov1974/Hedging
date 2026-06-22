import { createSchema, type PrototypeDatabase } from "./schema.ts";
import {
  insertCalendar,
  insertCustomer,
  insertCustomerForecast,
  insertCustomerPortfolio,
  insertPriceComponent,
  insertProductConfiguration,
  insertProductConfigurationComponent,
} from "./repository.ts";

export function createSyntheticCustomerProductFixture(): PrototypeDatabase {
  const database = createSchema();

  insertCustomer(database, {
    customer_id: "customer-1",
    name: "Synthetic Customer",
    customer_number: "C-1000",
  });

  insertCalendar(database, {
    calendar_id: "calendar-2027-01",
    month: "2027-01",
    total_h: 744,
    peak_h: 352,
  });

  insertCustomerPortfolio(database, {
    portfolio_id: "portfolio-1",
    customer_id: "customer-1",
    name: "Synthetic Portfolio",
    customer_number: "C-1000",
    price_area: "STO",
    calendar_id: "calendar-2027-01",
  });

  insertCustomerForecast(database, {
    forecast_id: "forecast-1",
    portfolio_id: "portfolio-1",
    month: "2027-01",
    mwh: 1000,
    peak_pct: 0.45,
  });

  insertProductConfiguration(database, {
    product_id: "product-1",
    name: "Profiles",
  });

  insertProductConfigurationComponent(database, {
    productcomponent_id: "product-component-1",
    product_id: "product-1",
    name: "Base system component",
    component: "base.sys",
    productitem: "base",
  });

  insertPriceComponent(database, {
    pricecomponent_id: "price-component-1",
    productcomponent_id: "product-component-1",
    price: 50,
    currency: "EUR",
  });

  return database;
}
