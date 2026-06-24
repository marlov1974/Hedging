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
    assert.equal(detail.component_code, "base.sto");
    assert.equal(detail.price_area, "STO");
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
