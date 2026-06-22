import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSchema } from "../../src/database/schema.ts";
import {
  getCustomerPortfolioWithForecasts,
  getProductConfigurationWithComponents,
  insertCalendar,
  insertCustomer,
  insertCustomerForecast,
  insertCustomerPortfolio,
  insertPriceComponent,
  insertProductConfiguration,
  insertProductConfigurationComponent,
} from "../../src/database/repository.ts";
import { DatabaseError } from "../../src/database/types.ts";

describe("customer and product database structure", () => {
  it("creates schema successfully", () => {
    const database = createSchema();

    assert.equal(database.customers.size, 0);
    assert.equal(database.productConfigurations.size, 0);
  });

  it("inserts customer and portfolio", () => {
    const database = createSchema();
    seedCustomerAndCalendar(database);

    const portfolio = insertCustomerPortfolio(database, {
      portfolio_id: "portfolio-1",
      customer_id: "customer-1",
      name: "Synthetic Portfolio",
      customer_number: "C-1000",
      price_area: "STO",
      calendar_id: "calendar-1",
    });

    assert.equal(portfolio.portfolio_id, "portfolio-1");
    assert.equal(database.portfolios.size, 1);
  });

  it("rejects duplicate customer number", () => {
    const database = createSchema();
    insertCustomer(database, { customer_id: "customer-1", name: "Synthetic Customer", customer_number: "C-1000" });

    assert.throws(
      () => insertCustomer(database, { customer_id: "customer-2", name: "Other Synthetic Customer", customer_number: "C-1000" }),
      (error) => error instanceof DatabaseError && error.code === "duplicate_key",
    );
  });

  it("rejects portfolio for unknown customer", () => {
    const database = createSchema();
    insertCalendar(database, { calendar_id: "calendar-1", month: "2027-01", total_h: 744, peak_h: 352 });

    assert.throws(
      () =>
        insertCustomerPortfolio(database, {
          portfolio_id: "portfolio-1",
          customer_id: "missing-customer",
          name: "Synthetic Portfolio",
          customer_number: "C-1000",
          price_area: "STO",
          calendar_id: "calendar-1",
        }),
      (error) => error instanceof DatabaseError && error.code === "not_found",
    );
  });

  it("inserts calendar and forecast", () => {
    const database = createSchema();
    seedPortfolio(database);

    const forecast = insertCustomerForecast(database, {
      forecast_id: "forecast-1",
      portfolio_id: "portfolio-1",
      month: "2027-01",
      mwh: 1000,
      peak_pct: 0.45,
    });

    assert.equal(forecast.month, "2027-01");
    assert.equal(database.forecasts.size, 1);
  });

  it("rejects duplicate forecast month for same portfolio", () => {
    const database = createSchema();
    seedForecast(database);

    assert.throws(
      () =>
        insertCustomerForecast(database, {
          forecast_id: "forecast-2",
          portfolio_id: "portfolio-1",
          month: "2027-01",
          mwh: 1100,
          peak_pct: 0.5,
        }),
      (error) => error instanceof DatabaseError && error.code === "duplicate_key",
    );
  });

  it("rejects calendar with peak_h greater than total_h", () => {
    const database = createSchema();

    assert.throws(
      () => insertCalendar(database, { calendar_id: "calendar-1", month: "2027-01", total_h: 100, peak_h: 101 }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });

  it("inserts product configuration with components", () => {
    const database = createSchema();
    insertProductConfiguration(database, { product_id: "product-1", name: "Profiles" });

    const component = insertProductConfigurationComponent(database, {
      productcomponent_id: "product-component-1",
      product_id: "product-1",
      name: "Base system component",
      component: "base.sys",
      productitem: "base",
    });

    assert.equal(component.component, "base.sys");
    assert.equal(database.productConfigurationComponents.size, 1);
  });

  it("inserts price components", () => {
    const database = createSchema();
    seedProductComponent(database);

    const priceComponent = insertPriceComponent(database, {
      pricecomponent_id: "price-component-1",
      productcomponent_id: "product-component-1",
      price: 50,
      currency: "EUR",
    });

    assert.equal(priceComponent.currency, "EUR");
    assert.equal(database.priceComponents.size, 1);
  });

  it("queries portfolio with forecasts", () => {
    const database = createSchema();
    seedForecast(database);

    const result = getCustomerPortfolioWithForecasts(database, "portfolio-1");

    assert.equal(result?.customer.customer_number, "C-1000");
    assert.equal(result?.calendar.month, "2027-01");
    assert.equal(result?.forecasts.length, 1);
    assert.equal(result?.forecasts[0].mwh, 1000);
  });

  it("queries product configuration with components and price components", () => {
    const database = createSchema();
    seedProductPriceComponent(database);

    const result = getProductConfigurationWithComponents(database, "product-1");

    assert.equal(result?.product.name, "Profiles");
    assert.equal(result?.components.length, 1);
    assert.equal(result?.components[0].component.component, "base.sys");
    assert.equal(result?.components[0].price_components[0].price, 50);
  });

  it("rejects unknown product component code when validation is available", () => {
    const database = createSchema();
    insertProductConfiguration(database, { product_id: "product-1", name: "Profiles" });

    assert.throws(
      () =>
        insertProductConfigurationComponent(database, {
          productcomponent_id: "product-component-1",
          product_id: "product-1",
          name: "Unknown component",
          component: "unknown.component",
          productitem: "unknown",
        }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });

  it("rejects missing price currency", () => {
    const database = createSchema();
    seedProductComponent(database);

    assert.throws(
      () =>
        insertPriceComponent(database, {
          pricecomponent_id: "price-component-1",
          productcomponent_id: "product-component-1",
          price: 50,
          currency: "",
        }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });
});

function seedCustomerAndCalendar(database: ReturnType<typeof createSchema>): void {
  insertCustomer(database, { customer_id: "customer-1", name: "Synthetic Customer", customer_number: "C-1000" });
  insertCalendar(database, { calendar_id: "calendar-1", month: "2027-01", total_h: 744, peak_h: 352 });
}

function seedPortfolio(database: ReturnType<typeof createSchema>): void {
  seedCustomerAndCalendar(database);
  insertCustomerPortfolio(database, {
    portfolio_id: "portfolio-1",
    customer_id: "customer-1",
    name: "Synthetic Portfolio",
    customer_number: "C-1000",
    price_area: "STO",
    calendar_id: "calendar-1",
  });
}

function seedForecast(database: ReturnType<typeof createSchema>): void {
  seedPortfolio(database);
  insertCustomerForecast(database, {
    forecast_id: "forecast-1",
    portfolio_id: "portfolio-1",
    month: "2027-01",
    mwh: 1000,
    peak_pct: 0.45,
  });
}

function seedProductComponent(database: ReturnType<typeof createSchema>): void {
  insertProductConfiguration(database, { product_id: "product-1", name: "Profiles" });
  insertProductConfigurationComponent(database, {
    productcomponent_id: "product-component-1",
    product_id: "product-1",
    name: "Base system component",
    component: "base.sys",
    productitem: "base",
  });
}

function seedProductPriceComponent(database: ReturnType<typeof createSchema>): void {
  seedProductComponent(database);
  insertPriceComponent(database, {
    pricecomponent_id: "price-component-1",
    productcomponent_id: "product-component-1",
    price: 50,
    currency: "EUR",
  });
}
