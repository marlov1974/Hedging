import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPurchaseEventForCalloff, getEventDetails } from "../../src/database/eventForecasts.ts";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { getCalloffWithTransactions, getProductConfigurationWithComponents, insertCalloff } from "../../src/database/repository.ts";
import { createExplicitModernHedgePurchase } from "../../src/hedging/forecastHedge.ts";
import { renderBaseloadsPurchaseForm } from "../../src/purchase/BaseloadsPurchaseView.ts";
import {
  PurchaseError,
  purchaseBaseloads,
  rebalanceBaseloadsToForecast,
  upgradeBaseloadsToPeaksModern,
} from "../../src/purchase/baseloadsPurchase.ts";
import { expandPeriodMonths, getBaseloadsPurchasePeriods } from "../../src/purchase/periodOptions.ts";

describe("Baseloads purchase flow", () => {
  it("period dropdown contains 4 years, 11 quarters and 6 months", () => {
    const periods = getBaseloadsPurchasePeriods();

    assert.equal(periods.filter((period) => period.period_type === "year").length, 4);
    assert.equal(periods.filter((period) => period.period_type === "quarter").length, 11);
    assert.equal(periods.filter((period) => period.period_type === "month").length, 6);
    assert.equal(periods[0].label, "Year 2027");
    assert.equal(periods.at(-1)?.label, "Jun 2027");
  });

  it("expands month, quarter and year periods to expected month counts", () => {
    const periods = getBaseloadsPurchasePeriods();

    assert.equal(expandPeriodMonths(requiredPeriod(periods, "month-2027-01")).length, 1);
    assert.equal(expandPeriodMonths(requiredPeriod(periods, "quarter-2027-q1")).length, 3);
    assert.equal(expandPeriodMonths(requiredPeriod(periods, "year-2027")).length, 12);
  });

  it("month purchase creates one calloff and two transactions", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 15,
      period_id: "month-2027-01",
      date: "2027-01-15",
    });

    assert.equal(result.calloff.calloff_id, "CAL00");
    assert.equal(database.calloffs.size, 1);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-01");
    assert.equal(result.transactions.length, 2);
    assert.deepEqual(
      result.transactions.map((transaction) => transaction.transaction_id),
      ["CAL00-000", "CAL00-001"],
    );
  });

  it("purchase stores Baseloads fee as separate customer add-on, not a Baseloads customer hedge leg", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 10,
      period_id: "month-2027-01",
      date: "2027-01-15",
      calloff_id: "CAL_BASELOADS_CUSTOMER_LEG",
    });

    const customerDetails = getEventDetails(database, "EVT:PURCHASE:CAL_BASELOADS_CUSTOMER_LEG").filter(
      (detail) => detail.leg_type === "CUSTOMER",
    );

    assert.deepEqual(
      customerDetails.map((detail) => [detail.component_code, detail.quantity, detail.quantity_type]),
      [["fee.calloff", 7440, "MWh"]],
    );
    assert.equal(customerDetails[0].price, 0.75);
    assert.equal(customerDetails[0].price_type, "EUR_PER_MWH");
    assert.equal(customerDetails[0].price_component_id, "PRI:PRO00:fee.calloff");
  });

  it("purchase creates market base rows with factor 1", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 10,
      period_id: "month-2027-01",
      date: "2027-01-15",
      calloff_id: "CAL_BASELOADS_MARKET_BASE",
    });

    const marketDetails = getEventDetails(database, "EVT:PURCHASE:CAL_BASELOADS_MARKET_BASE").filter(
      (detail) => detail.leg_type === "MARKET" && detail.component_code.startsWith("market.base."),
    );

    assert.deepEqual(
      marketDetails.map((detail) => [detail.component_code, detail.quantity, detail.quantity_type, detail.factor, detail.factor_type]),
      [["market.base.sto", 7440, "MWh", 1, "Q_FACTOR"]],
    );
    assert.equal(marketDetails[0].price, 43.53);
  });

  it("product configuration defines commercial add-on price components", () => {
    const database = createPocSeedData();
    const baseloads = getProductConfigurationWithComponents(database, "PRO00");
    const modern = getProductConfigurationWithComponents(database, "PRO02");

    assert.ok(baseloads);
    assert.ok(modern);
    assert.deepEqual(
      baseloads.components
        .filter((row) => row.component.component === "fee.calloff")
        .map((row) => [row.component.component, row.price_components[0]?.price, row.price_components[0]?.currency]),
      [["fee.calloff", 0.75, "EUR"]],
    );
    assert.deepEqual(
      modern.components
        .filter((row) => row.component.component.startsWith("premium.") || row.component.component === "fee.calloff")
        .map((row) => [row.component.component, row.price_components[0]?.price, row.price_components[0]?.currency])
        .sort(),
      [
        ["fee.calloff", 0.75, "EUR"],
        ["premium.p_agent", 0.5, "EUR"],
        ["premium.q_term", 1.25, "EUR"],
      ],
    );
  });

  it("fee does not double count paired SYS and area legs inside one Baseloads calloff", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 10,
      period_id: "month-2027-01",
      date: "2027-01-15",
      calloff_id: "CAL_BASELOADS_FEE_SINGLE",
    });

    const fee = getEventDetails(database, "EVT:PURCHASE:CAL_BASELOADS_FEE_SINGLE").find((detail) => detail.component_code === "fee.calloff");

    assert.equal(fee?.quantity, 7440);
  });

  it("separate Baseloads calloffs each generate a fee", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 1,
      period_id: "month-2027-01",
      date: "2027-01-15",
      calloff_id: "CAL_BASELOADS_FEE_ONE",
    });
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 1,
      period_id: "month-2027-01",
      date: "2027-01-16",
      calloff_id: "CAL_BASELOADS_FEE_TWO",
    });

    const feeQuantity = ["EVT:PURCHASE:CAL_BASELOADS_FEE_ONE", "EVT:PURCHASE:CAL_BASELOADS_FEE_TWO"].reduce((sum, eventId) => {
      const fee = getEventDetails(database, eventId).find((detail) => detail.component_code === "fee.calloff");
      return sum + (fee?.quantity ?? 0);
    }, 0);

    assert.equal(feeQuantity, 1488);
  });

  it("quarter purchase creates one calloff and six transactions", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 20,
      period_id: "quarter-2027-q1",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_QUARTER",
    });

    assert.equal(database.calloffs.size, 1);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-03");
    assert.equal(result.transactions.length, 6);
  });

  it("year purchase creates one calloff and twenty-four transactions", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 25,
      period_id: "year-2027",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_YEAR",
    });

    assert.equal(database.calloffs.size, 1);
    assert.equal(result.calloff.delivery_start_month, "2027-01");
    assert.equal(result.calloff.delivery_end_month, "2027-12");
    assert.equal(result.transactions.length, 24);
  });

  it("purchases both base.sys and base.epad together", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 15,
      period_id: "month-2027-01",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_COMPONENTS",
    });

    const components = result.transactions
      .map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component)
      .sort();

    assert.deepEqual(components, ["base.epad", "base.sys"]);
  });

  it("sets transaction MW equal to input MW", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 17.5,
      period_id: "quarter-2027-q1",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_MW",
    });

    assert.ok(result.transactions.every((transaction) => transaction.mw === 17.5));
  });

  it("reads q_factor from linked portfolio Q-factor values", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 15,
      period_id: "quarter-2027-q1",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_QFACTOR",
    });

    assert.ok(result.transactions.every((transaction) => transaction.q_factor === 1));
  });

  it("returns calloff with transactions through database repository", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 15,
      period_id: "month-2027-01",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_LOOKUP",
    });

    const result = getCalloffWithTransactions(database, "CALLOFF_TEST_LOOKUP");

    assert.equal(result?.transactions.length, 2);
  });

  it("missing q_factor gives a clear error", () => {
    const database = createPocSeedData();
    const baseSet = [...database.qFactorSets.values()].find((set) => set.component === "base.sys");
    assert.ok(baseSet);
    for (const [id, value] of database.qFactorValues.entries()) {
      if (value.qfactor_set_id === baseSet.qfactor_set_id && value.month === "2027-01") {
        database.qFactorValues.delete(id);
      }
    }

    assert.throws(
      () =>
        purchaseBaseloads(database, {
          portfolio_id: "CUS00-0",
          mw: 15,
          period_id: "month-2027-01",
          date: "2027-01-15",
          calloff_id: "CALLOFF_TEST_MISSING_Q",
        }),
      (error) => error instanceof PurchaseError && error.message.includes("missing Q-factor value"),
    );
  });

  it("rejects invalid MW", () => {
    const database = createPocSeedData();

    assert.throws(
      () =>
        purchaseBaseloads(database, {
          portfolio_id: "CUS00-0",
          mw: 0,
          period_id: "month-2027-01",
          date: "2027-01-15",
        }),
      (error) => error instanceof PurchaseError && error.code === "invalid_input",
    );
  });

  it("rejects portfolio outside the Baseloads flow", () => {
    const database = createPocSeedData();

    assert.throws(
      () =>
        purchaseBaseloads(database, {
          portfolio_id: "CUS01-0",
          mw: 15,
          period_id: "month-2027-01",
          date: "2027-01-15",
        }),
      (error) => error instanceof PurchaseError && error.message.includes("not linked"),
    );
  });

  it("renders a professional Baseloads purchase form", () => {
    const html = renderBaseloadsPurchaseForm(createPocSeedData());

    assert.match(html, /Baseloads Purchase/);
    assert.match(html, /MW quantity/);
    assert.match(html, /Confirm purchase/);
    assert.match(html, /Components: base\.sys \+ base\.epad/);
    assert.match(html, /class="panel summary"/);
  });

  it("successful purchase view shows calloff id and transaction count", () => {
    const database = createPocSeedData();
    const result = purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 20,
      period_id: "quarter-2027-q1",
      date: "2027-01-15",
      calloff_id: "CALLOFF_TEST_RESULT",
    });

    const html = renderBaseloadsPurchaseForm(database, { result });

    assert.match(html, /CALLOFF_TEST_RESULT/);
    assert.match(html, /6 transactions/);
  });

  it("rebalance requires target percentage and price area", () => {
    const database = createPocSeedData();

    assert.throws(
      () =>
        rebalanceBaseloadsToForecast(database, {
          portfolio_id: "CUS00-0",
          period_id: "month-2027-01",
          price_area: "STO",
        }),
      (error) => error instanceof PurchaseError && /target_percentage_of_forecast/.test(error.message),
    );
    assert.throws(
      () =>
        rebalanceBaseloadsToForecast(database, {
          portfolio_id: "CUS00-0",
          period_id: "month-2027-01",
          target_percentage_of_forecast: "50",
        }),
      (error) => error instanceof PurchaseError && /price_area/.test(error.message),
    );
  });

  it("rebalance uses selected-area base forecast only and creates positive signed details", () => {
    const database = createPocSeedData();
    const result = rebalanceBaseloadsToForecast(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-15",
      calloff_id: "CAL_REBALANCE_POSITIVE",
    });

    assert.equal(result.calloff?.calloff_id, "CAL_REBALANCE_POSITIVE");
    assert.deepEqual(result.rows, [
      {
        month: "2027-01",
        target_base_mwh: 246,
        current_base_mwh: 0,
        rebalance_delta_mwh: 246,
        derivative_name: "Baseloads Rebalance Month 2027-01 STO",
      },
    ]);
    assert.equal(result.transactions.length, 2);
    assert.equal(result.transactions.every((transaction) => transaction.price_area === "STO"), true);
    assert.equal(result.transactions.every((transaction) => transaction.synthetic_derivative_name === "Baseloads Rebalance Month 2027-01 STO"), true);
    assert.deepEqual(
      result.transactions.map((transaction) => database.productConfigurationComponents.get(transaction.productcomponent_id)?.component),
      ["base.sys", "base.epad"],
    );
    assert.equal(result.transactions[0].mw, 0.330645);
  });

  it("rebalance creates a REBALANCE event instead of rewriting purchase history", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 1,
      period_id: "month-2027-01",
      date: "2027-01-10",
      calloff_id: "CAL_HISTORY_PURCHASE",
    });
    const historicalDetailsBefore = getEventDetails(database, "EVT:PURCHASE:CAL_HISTORY_PURCHASE").map((detail) => ({ ...detail }));

    rebalanceBaseloadsToForecast(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-15",
      calloff_id: "CAL_HISTORY_REBALANCE",
    });

    const rebalanceEvent = database.events.get("EVT:REBALANCE:CAL_HISTORY_REBALANCE");
    assert.equal(rebalanceEvent?.event_type, "REBALANCE");
    assert.equal(rebalanceEvent?.source, "baseloads_rebalance");
    assert.equal(database.events.has("EVT:PURCHASE:CAL_HISTORY_REBALANCE"), false);
    assert.deepEqual(getEventDetails(database, "EVT:PURCHASE:CAL_HISTORY_PURCHASE"), historicalDetailsBefore);
  });

  it("rebalance creates only the needed market difference from open market basis", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 1,
      period_id: "month-2027-01",
      date: "2027-01-10",
      calloff_id: "CAL_EXISTING_MARKET_BASE",
    });

    const result = rebalanceBaseloadsToForecast(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-15",
      calloff_id: "CAL_MARKET_DELTA_ONLY",
    });
    const marketDetails = getEventDetails(database, "EVT:REBALANCE:CAL_MARKET_DELTA_ONLY").filter(
      (detail) => detail.leg_type === "MARKET" && detail.component_code === "market.base.sto",
    );

    assert.equal(result.rows[0].current_base_mwh, 744);
    assert.equal(result.rows[0].target_base_mwh, 246);
    assert.equal(result.rows[0].rebalance_delta_mwh, -498);
    assert.equal(marketDetails.length, 1);
    assert.equal(marketDetails[0].quantity, -498);
  });

  it("rebalance can represent a product change with both customer and market legs", () => {
    const database = createPocSeedData();
    rebalanceBaseloadsToForecast(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-15",
      calloff_id: "CAL_PRODUCT_CHANGE_REBALANCE",
    });

    const details = getEventDetails(database, "EVT:REBALANCE:CAL_PRODUCT_CHANGE_REBALANCE");

    assert.ok(details.some((detail) => detail.leg_type === "CUSTOMER" && detail.component_code === "modern.base"));
    assert.ok(details.some((detail) => detail.leg_type === "MARKET" && detail.component_code === "market.base.sto"));
  });

  it("rebalance uses prior rebalance market basis and does not trade when target is already reached", () => {
    const database = createPocSeedData();
    rebalanceBaseloadsToForecast(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-15",
      calloff_id: "CAL_INITIAL_REBALANCE",
    });

    const second = rebalanceBaseloadsToForecast(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-16",
      calloff_id: "CAL_NO_DELTA_REBALANCE",
    });

    assert.equal(second.calloff, null);
    assert.equal(second.transactions.length, 0);
    assert.equal(second.rows[0].current_base_mwh, 246);
    assert.equal(second.rows[0].rebalance_delta_mwh, 0);
    assert.equal(database.events.has("EVT:REBALANCE:CAL_NO_DELTA_REBALANCE"), false);
  });

  it("rebalance can create negative signed details when current base exceeds target", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 1,
      period_id: "month-2027-01",
      date: "2027-01-10",
      calloff_id: "CAL_EXISTING_BASE",
    });
    const result = rebalanceBaseloadsToForecast(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-15",
      calloff_id: "CAL_REBALANCE_NEGATIVE",
    });

    assert.equal(result.rows[0].current_base_mwh, 744);
    assert.equal(result.rows[0].target_base_mwh, 246);
    assert.equal(result.rows[0].rebalance_delta_mwh, -498);
    assert.equal(result.transactions.length, 2);
    assert.equal(result.transactions.every((transaction) => transaction.mw === -0.669355), true);
  });

  it("Modern purchase creates customer hedge, market basis and commercial add-on details", () => {
    const database = createPocSeedData();
    createExplicitModernHedgePurchase(database, {
      portfolio_id: "CUS02-0",
      month: "2027-01",
      base_mwh: 60,
      peak_mwh: 40,
      base_price_eur_per_mwh: 45,
      peak_price_eur_per_mwh: 80,
      date: "2027-01-15",
      calloff_id: "CAL_MODERN_ADDONS",
    });

    const details = getEventDetails(database, "EVT:PURCHASE:CAL_MODERN_ADDONS");

    assert.ok(details.some((detail) => detail.leg_type === "CUSTOMER" && detail.component_code === "modern.base"));
    assert.ok(details.some((detail) => detail.leg_type === "MARKET" && detail.component_code === "market.base.sto"));
    assert.deepEqual(
      details
        .filter((detail) => detail.component_code === "fee.calloff" || detail.component_code.startsWith("premium."))
        .map((detail) => [detail.component_code, detail.quantity, detail.price, detail.price_type])
        .sort(),
      [
        ["fee.calloff", 100, 0.75, "EUR_PER_MWH"],
        ["premium.p_agent", 40, 0.5, "EUR_PER_MWH"],
        ["premium.q_term", 40, 1.25, "EUR_PER_MWH"],
      ],
    );
  });

  it("fee stays positive while Q-term and P-agent follow signed modern peak", () => {
    const database = createPocSeedData();
    const calloff = insertCalloff(database, {
      calloff_id: "CAL_SIGNED_ADDONS",
      product_id: "PRO02",
      portfolio_id: "CUS02-0",
      date: "2027-01-15",
      delivery_start_month: "2027-01",
      delivery_end_month: "2027-01",
    });
    createPurchaseEventForCalloff(database, {
      calloff,
      transactions: [],
      source: "signed_addon_test",
      modern_customer_rows: [
        {
          month: "2027-01",
          price_area: "STO",
          modern_base_mwh: -30,
          modern_peak_mwh: -20,
          modern_base_price: 45,
          modern_peak_price: 80,
        },
      ],
      market_basis_policy: "none",
      commercial_add_ons: true,
    });

    const details = getEventDetails(database, "EVT:PURCHASE:CAL_SIGNED_ADDONS");

    assert.equal(details.find((detail) => detail.component_code === "fee.calloff")?.quantity, 50);
    assert.equal(details.find((detail) => detail.component_code === "premium.q_term")?.quantity, -20);
    assert.equal(details.find((detail) => detail.component_code === "premium.p_agent")?.quantity, -20);
  });

  it("Baseloads-to-Modern upgrade uses market rebalance then customer conversion calloffs", () => {
    const database = createPocSeedData();
    purchaseBaseloads(database, {
      portfolio_id: "CUS00-0",
      mw: 1,
      period_id: "month-2027-01",
      date: "2027-01-10",
      calloff_id: "CAL_UPGRADE_EXISTING_BASE",
    });

    const result = upgradeBaseloadsToPeaksModern(database, {
      portfolio_id: "CUS00-0",
      period_id: "month-2027-01",
      price_area: "STO",
      target_percentage_of_forecast: "50",
      date: "2027-01-15",
      calloff_id: "CAL_UPGRADE",
    });
    const marketDetails = getEventDetails(database, "EVT:REBALANCE:CAL_UPGRADE-MARKET_REBALANCE");
    const conversionDetails = getEventDetails(database, "EVT:PURCHASE:CAL_UPGRADE-CUSTOMER_CONVERSION");

    assert.equal(result.market_rebalance.calloff.calloff_id, "CAL_UPGRADE-MARKET_REBALANCE");
    assert.equal(result.customer_conversion.calloff.calloff_id, "CAL_UPGRADE-CUSTOMER_CONVERSION");
    assert.equal(marketDetails.some((detail) => detail.leg_type === "CUSTOMER" && detail.component_code === "modern.base"), false);
    assert.equal(marketDetails.find((detail) => detail.component_code === "market.base.sto")?.quantity, -493.65888);
    assert.equal(conversionDetails.some((detail) => detail.leg_type === "MARKET" && detail.component_code === "market.base.sto"), false);
    assert.equal(conversionDetails.find((detail) => detail.component_code === "modern.base")?.price, 43.53);
    assert.equal(conversionDetails.find((detail) => detail.component_code === "modern.peak")?.price, 43.53);
    assert.equal(conversionDetails.find((detail) => detail.component_code === "fee.calloff")?.quantity, 246);
  });
});

function requiredPeriod(periods: ReturnType<typeof getBaseloadsPurchasePeriods>, periodId: string) {
  const period = periods.find((candidate) => candidate.period_id === periodId);
  assert.ok(period, `missing period ${periodId}`);
  return period;
}
