import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { insertCalloff, insertTransaction } from "../../src/database/repository.ts";
import {
  deriveCurrencyTransactionEconomics,
  derivePowerTransactionEconomics,
  normalizeSekCommercialPowerLeg,
} from "../../src/hedging/currencyModel.ts";

describe("currency component model", () => {
  it("normalizes a SEK commercial power leg into EUR power and EUR/SEK currency legs", () => {
    const normalized = normalizeSekCommercialPowerLeg({
      mwh: 1200,
      sek_amount: 100000,
      fx_rate: 11.25,
      total_h: 744,
      q_factor: 1,
    });

    assert.deepEqual(normalized.power, {
      quantity: 1.612903,
      quantity_type: "MW",
      price: 7.407407,
      price_type: "EUR_PER_MWH",
      factor: 1,
      factor_type: "Q_FACTOR",
    });
    assert.deepEqual(normalized.currency, {
      quantity: 8888.888889,
      quantity_type: "EUR",
      price: 11.25,
      price_type: "SEK_PER_EUR",
      factor: null,
      factor_type: null,
    });
  });

  it("derives power MWh and EUR value without stored MWh source fields", () => {
    const database = createPocSeedData();
    insertCalloff(database, {
      calloff_id: "CALX",
      product_id: "PRO02",
      portfolio_id: "CUS02-0",
      date: "2027-01-10",
      delivery_start_month: "2027-01",
      delivery_end_month: "2027-01",
    });
    const transaction = insertTransaction(database, {
      transaction_id: "CALX-000",
      calloff_id: "CALX",
      month: "2027-01",
      productcomponent_id: "PRO02:base.sys",
      mw: 2,
      q_factor: 1,
      quantity: 2,
      quantity_type: "MW",
      price: 45.73,
      price_type: "EUR_PER_MWH",
      factor: 1,
      factor_type: "Q_FACTOR",
    });

    assert.deepEqual(derivePowerTransactionEconomics(database, transaction), {
      quantity_mw: 2,
      hours: 744,
      mwh: 1488,
      price_eur_per_mwh: 45.73,
      factor: 1,
      raw_value_eur: 68046.24,
      q_value_eur: 68046.24,
    });
  });

  it("derives currency SEK value from EUR quantity and SEK_PER_EUR price", () => {
    const economics = deriveCurrencyTransactionEconomics({
      transaction_id: "CALX-006",
      calloff_id: "CALX",
      month: "2027-01",
      productcomponent_id: "PRO02:currency.eursek",
      mw: 0,
      q_factor: 0,
      quantity: 5000,
      quantity_type: "EUR",
      price: 11.25,
      price_type: "SEK_PER_EUR",
      factor: null,
      factor_type: null,
    });

    assert.deepEqual(economics, {
      quantity_eur: 5000,
      sek_per_eur: 11.25,
      currency_value_sek: 56250,
    });
  });
});
