import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSchema } from "../../src/database/schema.ts";
import { insertCustomer, insertCustomerPortfolio, insertCalendar, insertEvent, insertEventDetail } from "../../src/database/repository.ts";
import { DatabaseError } from "../../src/database/types.ts";

describe("event and event_detail model", () => {
  it("stores generic forecast event details with price_area", () => {
    const database = createEventDatabase();
    const event = insertEvent(database, {
      event_id: "EVT01",
      portfolio_id: "CUS00-0",
      event_type: "FORECAST",
      version: 1,
      created_at: "2027-01-01",
      created_order: 1,
      source: "test",
      status: "active",
    });
    const detail = insertEventDetail(database, {
      event_detail_id: "EVD01",
      event_id: event.event_id,
      component_code: "base.sto",
      period: "2027-01",
      price_area: "STO",
      quantity: 1.25,
      quantity_type: "MW",
      price: null,
      price_type: null,
      factor: null,
      factor_type: null,
    });

    assert.equal(database.events.get("EVT01"), event);
    assert.equal(database.eventDetails.get("EVD01"), detail);
    assert.equal(detail.leg_type, "MARKET");
    assert.equal(detail.component_code, "base.sto");
    assert.equal(detail.price_area, "STO");
    assert.equal(detail.linked_detail_id, null);
  });

  it("stores customer leg event details", () => {
    const database = createEventDatabase();
    const event = insertPurchaseEvent(database);

    const detail = insertEventDetail(database, {
      event_detail_id: "EVD_CUSTOMER",
      event_id: event.event_id,
      leg_type: "CUSTOMER",
      component_code: "modern.base",
      period: "2027-01",
      price_area: "STO",
      quantity: 1200,
      quantity_type: "MWh",
      price: 74,
      price_type: "EUR_PER_MWH",
      factor: null,
      factor_type: null,
    });

    assert.equal(detail.leg_type, "CUSTOMER");
    assert.equal(detail.component_code, "modern.base");
    assert.equal(detail.quantity_type, "MWh");
    assert.equal(detail.linked_detail_id, null);
  });

  it("stores market leg event details", () => {
    const database = createEventDatabase();
    const event = insertPurchaseEvent(database);

    const detail = insertEventDetail(database, {
      event_detail_id: "EVD_MARKET",
      event_id: event.event_id,
      leg_type: "MARKET",
      component_code: "peak.sto",
      period: "2027-01",
      price_area: "STO",
      quantity: 14.4,
      quantity_type: "MW",
      price: 61.666667,
      price_type: "EUR_PER_MWH",
      factor: 1.2,
      factor_type: "Q_FACTOR",
    });

    assert.equal(detail.leg_type, "MARKET");
  });

  it("stores rebalance events", () => {
    const database = createEventDatabase();
    const event = insertEvent(database, {
      event_id: "EVT_REBALANCE",
      portfolio_id: "CUS00-0",
      event_type: "REBALANCE",
      version: 1,
      created_at: "2027-01-03",
      created_order: 3,
      source: "test",
      status: "active",
    });

    assert.equal(event.event_type, "REBALANCE");
  });

  it("stores customer and market legs on one event with different component, quantity and price", () => {
    const database = createEventDatabase();
    const event = insertPurchaseEvent(database);

    const customerLeg = insertEventDetail(database, {
      event_detail_id: "EVD_CUSTOMER",
      event_id: event.event_id,
      leg_type: "CUSTOMER",
      component_code: "peak.sys",
      period: "2027-01",
      price_area: "STO",
      quantity: 10,
      quantity_type: "MW",
      price: 120,
      price_type: "EUR_PER_MWH",
      factor: null,
      factor_type: null,
    });
    const marketLeg = insertEventDetail(database, {
      event_detail_id: "EVD_MARKET",
      event_id: event.event_id,
      leg_type: "MARKET",
      component_code: "base.sto",
      period: "2027-01",
      price_area: "STO",
      quantity: 12,
      quantity_type: "MW",
      price: 100,
      price_type: "EUR_PER_MWH",
      factor: 1.2,
      factor_type: "Q_FACTOR",
      linked_detail_id: customerLeg.event_detail_id,
    });

    assert.equal(marketLeg.linked_detail_id, customerLeg.event_detail_id);
    assert.notEqual(customerLeg.leg_type, marketLeg.leg_type);
    assert.notEqual(customerLeg.component_code, marketLeg.component_code);
    assert.notEqual(customerLeg.quantity, marketLeg.quantity);
    assert.notEqual(customerLeg.price, marketLeg.price);
  });

  it("accepts signed quantities for legged event details", () => {
    const database = createEventDatabase();
    const event = insertPurchaseEvent(database);

    const detail = insertEventDetail(database, {
      event_detail_id: "EVD_SIGNED",
      event_id: event.event_id,
      leg_type: "MARKET",
      component_code: "base.sto",
      period: "2027-01",
      price_area: "STO",
      quantity: -3.5,
      quantity_type: "MW",
      price: 88,
      price_type: "EUR_PER_MWH",
      factor: null,
      factor_type: null,
    });

    assert.equal(detail.quantity, -3.5);
  });

  it("rejects unknown event detail leg types", () => {
    const database = createEventDatabase();
    insertPurchaseEvent(database);

    assert.throws(
      () =>
        insertEventDetail(database, {
          event_detail_id: "EVD_BAD_LEG",
          event_id: "EVT_PURCHASE",
          leg_type: "BROKER" as "MARKET",
          component_code: "base.sys",
          period: "2027-01",
          price_area: "STO",
          quantity: 10,
          quantity_type: "MW",
          price: 90,
          price_type: "EUR_PER_MWH",
          factor: null,
          factor_type: null,
        }),
      (error) => error instanceof DatabaseError && error.message.includes("leg_type"),
    );
  });

  it("requires price_area for area components", () => {
    const database = createEventDatabase();
    insertEvent(database, {
      event_id: "EVT01",
      portfolio_id: "CUS00-0",
      event_type: "FORECAST",
      version: 1,
      created_at: "2027-01-01",
      created_order: 1,
      source: "test",
      status: "active",
    });

    assert.throws(
      () =>
        insertEventDetail(database, {
          event_detail_id: "EVD01",
          event_id: "EVT01",
          component_code: "peak.sun",
          period: "2027-01",
          price_area: null,
          quantity: 10,
          quantity_type: "MW",
          price: null,
          price_type: null,
          factor: null,
          factor_type: null,
        }),
      (error) => error instanceof DatabaseError && error.message.includes("price_area"),
    );
  });
});

function createEventDatabase() {
  const database = createSchema();
  insertCalendar(database, {
    calendar_id: "CAL:2027-01",
    month: "2027-01",
    total_h: 744,
    peak_h: 336,
  });
  insertCustomer(database, {
    customer_id: "CUS00",
    customer_number: "CUS00",
    name: "Synthetic Customer",
  });
  insertCustomerPortfolio(database, {
    portfolio_id: "CUS00-0",
    customer_id: "CUS00",
    customer_number: "CUS00",
    name: "Synthetic Portfolio",
    price_area: "SE3",
    calendar_id: "CAL",
  });
  return database;
}

function insertPurchaseEvent(database: ReturnType<typeof createEventDatabase>) {
  return insertEvent(database, {
    event_id: "EVT_PURCHASE",
    portfolio_id: "CUS00-0",
    event_type: "PURCHASE",
    version: 1,
    created_at: "2027-01-02",
    created_order: 2,
    source: "test",
    status: "active",
  });
}
