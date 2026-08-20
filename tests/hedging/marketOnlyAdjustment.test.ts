import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEventDetails } from "../../src/database/eventForecasts.ts";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { getBaseloadsMarketProjectionRows } from "../../src/hedging/baseloadsProjection.ts";
import { createMarketOnlyFactorAdjustment, MarketOnlyAdjustmentError } from "../../src/hedging/marketOnlyAdjustment.ts";
import { createExplicitModernHedgePurchase } from "../../src/hedging/forecastHedge.ts";

describe("market-only factor adjustments", () => {
  it("Q-factor change creates no customer leg", () => {
    const { database, customerBaseDetailId } = createDatabaseWithModernCustomerLeg();

    createMarketOnlyFactorAdjustment(database, {
      portfolio_id: "CUS02-0",
      customer_event_detail_id: customerBaseDetailId,
      factor: 1.2,
      reason: "Q_FACTOR_UPDATE",
      date: "2027-01-16",
      event_id: "EVT:ADJUSTMENT:Q_ONLY",
    });

    const details = getEventDetails(database, "EVT:ADJUSTMENT:Q_ONLY");

    assert.equal(details.length, 1);
    assert.equal(details.every((detail) => detail.leg_type === "MARKET"), true);
  });

  it("Q-factor change creates a market leg only when market delta exists", () => {
    const { database, customerBaseDetailId } = createDatabaseWithModernCustomerLeg();
    const noDelta = createMarketOnlyFactorAdjustment(database, {
      portfolio_id: "CUS02-0",
      customer_event_detail_id: customerBaseDetailId,
      factor: 1,
      reason: "Q_FACTOR_UPDATE",
      date: "2027-01-16",
      event_id: "EVT:ADJUSTMENT:NO_DELTA",
    });

    assert.equal(noDelta.event, null);
    assert.equal(noDelta.market_delta, 0);
    assert.equal(database.events.has("EVT:ADJUSTMENT:NO_DELTA"), false);

    const result = createMarketOnlyFactorAdjustment(database, {
      portfolio_id: "CUS02-0",
      customer_event_detail_id: customerBaseDetailId,
      factor: 1.2,
      reason: "Q_FACTOR_UPDATE",
      date: "2027-01-16",
      event_id: "EVT:ADJUSTMENT:HAS_DELTA",
    });

    assert.equal(result.current_market_quantity, 100);
    assert.equal(result.target_market_quantity, 120);
    assert.equal(result.market_delta, 20);
    assert.equal(result.event_details[0].component_code, "market.base.sto");
    assert.equal(result.event_details[0].quantity, 20);
  });

  it("adjustment reason and factor are stored on the market detail", () => {
    const { database, customerBaseDetailId } = createDatabaseWithModernCustomerLeg();

    const result = createMarketOnlyFactorAdjustment(database, {
      portfolio_id: "CUS02-0",
      customer_event_detail_id: customerBaseDetailId,
      factor: 1.15,
      reason: "Q_FACTOR_UPDATE",
      date: "2027-01-16",
      event_id: "EVT:ADJUSTMENT:REASON",
    });

    assert.equal(result.event_details[0].reason, "Q_FACTOR_UPDATE");
    assert.equal(result.event_details[0].factor, 1.15);
    assert.equal(result.event_details[0].factor_type, "Q_FACTOR");
    assert.equal(result.event_details[0].linked_detail_id, customerBaseDetailId);
  });

  it("profile-factor changes store profile reason and factor type", () => {
    const { database, customerPeakDetailId } = createDatabaseWithModernCustomerLeg();

    const result = createMarketOnlyFactorAdjustment(database, {
      portfolio_id: "CUS02-0",
      customer_event_detail_id: customerPeakDetailId,
      factor: 1.35,
      reason: "PROFILE_FACTOR_UPDATE",
      date: "2027-01-16",
      event_id: "EVT:ADJUSTMENT:PROFILE",
    });

    assert.equal(result.event_details[0].reason, "PROFILE_FACTOR_UPDATE");
    assert.equal(result.event_details[0].factor, 1.35);
    assert.equal(result.event_details[0].factor_type, "PROFILE_FACTOR");
  });

  it("repeated factor update creates no market leg when target is already reached", () => {
    const { database, customerBaseDetailId } = createDatabaseWithModernCustomerLeg();

    createMarketOnlyFactorAdjustment(database, {
      portfolio_id: "CUS02-0",
      customer_event_detail_id: customerBaseDetailId,
      factor: 1.2,
      reason: "Q_FACTOR_UPDATE",
      date: "2027-01-16",
      event_id: "EVT:ADJUSTMENT:FIRST",
    });
    const second = createMarketOnlyFactorAdjustment(database, {
      portfolio_id: "CUS02-0",
      customer_event_detail_id: customerBaseDetailId,
      factor: 1.2,
      reason: "Q_FACTOR_UPDATE",
      date: "2027-01-17",
      event_id: "EVT:ADJUSTMENT:SECOND",
    });

    assert.equal(second.event, null);
    assert.equal(second.current_market_quantity, 120);
    assert.equal(second.market_delta, 0);
    assert.equal(database.events.has("EVT:ADJUSTMENT:SECOND"), false);
  });

  it("downgrade projection includes open market-only adjustments by default", () => {
    const { database, customerBaseDetailId } = createDatabaseWithModernCustomerLeg();
    createMarketOnlyFactorAdjustment(database, {
      portfolio_id: "CUS02-0",
      customer_event_detail_id: customerBaseDetailId,
      factor: 1.2,
      reason: "Q_FACTOR_UPDATE",
      date: "2027-01-16",
      event_id: "EVT:ADJUSTMENT:DOWNGRADE_INCLUDED",
    });

    const rows = getBaseloadsMarketProjectionRows(database, "CUS02-0");
    const adjustmentRow = rows.find((row) => row.calloff_id === "DOWNGRADE_INCLUDED");

    assert.ok(adjustmentRow);
    assert.equal(adjustmentRow.mwh, 20);
    assert.equal(adjustmentRow.source_detail_count, 1);
  });

  it("rejects non-customer details", () => {
    const { database } = createDatabaseWithModernCustomerLeg();
    const marketDetail = getEventDetails(database, "EVT:PURCHASE:CAL_P0052").find((detail) => detail.leg_type === "MARKET");
    assert.ok(marketDetail);

    assert.throws(
      () =>
        createMarketOnlyFactorAdjustment(database, {
          portfolio_id: "CUS02-0",
          customer_event_detail_id: marketDetail.event_detail_id,
          factor: 1.2,
          reason: "Q_FACTOR_UPDATE",
        }),
      (error) => error instanceof MarketOnlyAdjustmentError && /CUSTOMER/.test(error.message),
    );
  });
});

function createDatabaseWithModernCustomerLeg() {
  const database = createPocSeedData();
  createExplicitModernHedgePurchase(database, {
    portfolio_id: "CUS02-0",
    month: "2027-01",
    base_mwh: 100,
    peak_mwh: 10,
    base_price_eur_per_mwh: 45,
    peak_price_eur_per_mwh: 12,
    date: "2027-01-15",
    calloff_id: "CAL_P0052",
  });
  const details = getEventDetails(database, "EVT:PURCHASE:CAL_P0052");
  const customerBase = details.find((detail) => detail.leg_type === "CUSTOMER" && detail.component_code === "modern.base");
  const customerPeak = details.find((detail) => detail.leg_type === "CUSTOMER" && detail.component_code === "modern.peak");
  assert.ok(customerBase);
  assert.ok(customerPeak);
  return {
    database,
    customerBaseDetailId: customerBase.event_detail_id,
    customerPeakDetailId: customerPeak.event_detail_id,
  };
}
