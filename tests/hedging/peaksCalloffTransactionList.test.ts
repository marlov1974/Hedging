import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  insertCalloff,
  insertPriceComponent,
  insertProductConfigurationComponent,
  insertTransaction,
} from "../../src/database/repository.ts";
import type { PrototypeDatabase } from "../../src/database/schema.ts";
import { getApplicationFeaturesForPortfolio } from "../../src/hedging/applicationConfig.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import {
  getPeaksClassicCalloffTransactionRows,
  getPeaksModernCalloffTransactionRows,
  projectPeaksCalloffMonth,
} from "../../src/hedging/peaksCalloffTransactionList.ts";

describe("Peaks calloff transaction lists", () => {
  it("Classic and Modern list features are available for their product packages", () => {
    const database = createPocSeedData();
    const classicFeatures = getApplicationFeaturesForPortfolio(database, "CUS01-0").features;
    const modernFeatures = getApplicationFeaturesForPortfolio(database, "CUS02-0").features;

    assert.equal(classicFeatures.some((feature) => feature.feature_id === "legacy-calloff-list" && feature.available), true);
    assert.equal(modernFeatures.some((feature) => feature.feature_id === "modern-calloff-transaction-list" && feature.available), true);
  });

  it("renders Classic required columns in order", () => {
    const database = createWorkedExampleDatabase("classic");
    const html = renderHedgingTool(database, { portfolio_id: "CUS01-0", feature_id: "legacy-calloff-list" });

    assert.match(html, /Date[\s\S]*OffpeakMWh[\s\S]*PeakMWh[\s\S]*OffpeakPrice[\s\S]*PeakPrice/);
    assert.doesNotMatch(html, /<th>OffpeakMW<\/th>/);
    assert.doesNotMatch(html, /<th>PeakMW<\/th>/);
  });

  it("renders Modern required columns in order", () => {
    const database = createWorkedExampleDatabase("modern");
    const html = renderHedgingTool(database, { portfolio_id: "CUS02-0", feature_id: "modern-calloff-transaction-list" });

    assert.match(html, /Date[\s\S]*BaseMWh[\s\S]*PeakMWh[\s\S]*BasePrice[\s\S]*PeakPrice/);
    assert.doesNotMatch(html, /<th>BaseMW<\/th>/);
    assert.doesNotMatch(html, /<th>PeakMW<\/th>/);
  });

  it("calculates Classic and Modern customer MWh values from projected MW values", () => {
    const database = createWorkedExampleDatabase("modern");
    const modern = getPeaksModernCalloffTransactionRows(database, "CUS02-0")[0];
    const classic = getPeaksClassicCalloffTransactionRows(createWorkedExampleDatabase("classic"), "CUS01-0")[0];

    assert.equal(classic.offpeak_mwh, 50);
    assert.equal(classic.peak_mwh, 50);
    assert.equal(modern.base_mwh, 87.735849);
    assert.equal(modern.peak_mwh, 12.264151);

    assert.notEqual(modern.base_mwh, 100);
    assert.notEqual(modern.peak_mwh, round(0.0218413978 * 320));
  });

  it("calculates Classic and Modern value-preserving prices", () => {
    const classic = getPeaksClassicCalloffTransactionRows(createWorkedExampleDatabase("classic"), "CUS01-0")[0];
    const modern = getPeaksModernCalloffTransactionRows(createWorkedExampleDatabase("modern"), "CUS02-0")[0];

    assert.equal(classic.offpeak_price, 85);
    assert.equal(classic.peak_price, 88.075269);
    assert.equal(modern.base_price, 85);
    assert.equal(modern.peak_price, 97.537634);
    assert.equal(classic.projected_total_value, classic.canonical_total_value);
    assert.equal(modern.projected_total_value, modern.canonical_total_value);
    assertApprox(classic.canonical_total_value, 8653.763441);
    assertApprox(modern.canonical_total_value, 8653.763441);
  });

  it("allows negative Modern PeakMWh and preserves value", () => {
    const database = createWorkedExampleDatabase("modern", {
      allocation_peak_mw: 0.109375,
      peak_mw: -0.0250336022,
    });
    const modern = getPeaksModernCalloffTransactionRows(database, "CUS02-0")[0];

    assert.ok(modern.peak_mwh < 0);
    assert.equal(modern.projected_total_value, modern.canonical_total_value);
  });

  it("does not display allocation rows or adjustment rows in customer-facing lists", () => {
    const database = createWorkedExampleDatabase("modern");
    addAdjustmentTransaction(database, "PRO02", "CAL20");
    const html = renderHedgingTool(database, { portfolio_id: "CUS02-0", feature_id: "modern-calloff-transaction-list" });

    assert.doesNotMatch(html, /allocation\.peak\.sys/);
    assert.doesNotMatch(html, /allocation\.peak\.epad/);
    assert.doesNotMatch(html, /fixed adjustment/);
  });

  it("aggregates multi-month calloffs by summing MWh and value-weighting prices", () => {
    const database = createWorkedExampleDatabase("modern");
    createCanonicalCalloff(database, "modern", {
      calloff_id: "CAL21",
      month: "2027-02",
      base_mw: 100 / 672,
      allocation_peak_mw: 60 / 320,
      peak_mw: 60 / 320 - 100 / 672,
    });
    const calloff = database.calloffs.get("CAL20");
    assert.ok(calloff);
    calloff.delivery_end_month = "2027-02";
    for (const transaction of [...database.transactions.values()].filter((row) => row.calloff_id === "CAL21")) {
      transaction.calloff_id = "CAL20";
    }
    database.calloffs.delete("CAL21");

    const row = getPeaksModernCalloffTransactionRows(database, "CUS02-0")[0];
    const monthRows = ["2027-01", "2027-02"].map((month) =>
      projectPeaksCalloffMonth(
        database,
        database.calloffs.get("CAL20")!,
        [...database.transactions.values()].filter((transaction) => transaction.calloff_id === "CAL20" && transaction.month === month),
      ),
    );
    const arithmeticPeakPrice = round(((monthRows[0].modern_peak_price ?? 0) + (monthRows[1].modern_peak_price ?? 0)) / 2);

    assert.equal(row.base_mwh, round(monthRows[0].modern_base_mwh + monthRows[1].modern_base_mwh));
    assert.equal(row.peak_mwh, round(monthRows[0].modern_peak_mwh + monthRows[1].modern_peak_mwh));
    assert.equal(row.peak_price, round((monthRows[0].modern_peak_value + monthRows[1].modern_peak_value) / row.peak_mwh));
    assert.notEqual(row.peak_price, arithmeticPeakPrice);
    assert.equal(row.projected_total_value, row.canonical_total_value);
  });

  it("warns instead of dividing by zero", () => {
    const database = createWorkedExampleDatabase("modern");
    const calendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
    assert.ok(calendar);
    calendar.peak_h = calendar.total_h;

    const row = getPeaksModernCalloffTransactionRows(database, "CUS02-0")[0];

    assert.equal(row.base_price, null);
    assert.match(row.warnings.join("; "), /zero peak or offpeak hours/);
  });

  it("warns for mismatched sys and epad MW values and reads compatibility aliases", () => {
    const database = createWorkedExampleDatabase("classic", {
      base_epad_mw: 0.2,
      allocation_peak_epad_mw: 0.2,
      peak_epad_mw: 0.3,
      use_legacy_allocation_peak_component: true,
      use_legacy_peak_premium_components: true,
    });
    const row = getPeaksClassicCalloffTransactionRows(database, "CUS01-0")[0];

    assert.equal(row.peak_mwh, 50);
    assert.match(row.warnings.join("; "), /mismatched base MW/);
    assert.match(row.warnings.join("; "), /mismatched peak MW/);
    assert.match(row.warnings.join("; "), /legacy allocation\.peak alias/);
  });
});

type ProductKind = "classic" | "modern";

function createWorkedExampleDatabase(
  kind: ProductKind,
  overrides: Partial<{
    base_mw: number;
    base_epad_mw: number;
    allocation_peak_mw: number;
    allocation_peak_epad_mw: number;
    peak_mw: number;
    peak_epad_mw: number;
    use_legacy_allocation_peak_component: boolean;
    use_legacy_peak_premium_components: boolean;
  }> = {},
): PrototypeDatabase {
  const database = createPocSeedData();
  const calendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
  assert.ok(calendar);
  calendar.total_h = 744;
  calendar.peak_h = 320;
  setPrices(database, productIdFor(kind));
  createCanonicalCalloff(database, kind, {
    calloff_id: "CAL20",
    month: "2027-01",
    base_mw: overrides.base_mw ?? 100 / 744,
    base_epad_mw: overrides.base_epad_mw,
    allocation_peak_mw: overrides.allocation_peak_mw ?? 0.15625,
    allocation_peak_epad_mw: overrides.allocation_peak_epad_mw,
    peak_mw: overrides.peak_mw ?? 0.0218413978,
    peak_epad_mw: overrides.peak_epad_mw,
    use_legacy_allocation_peak_component: overrides.use_legacy_allocation_peak_component,
    use_legacy_peak_premium_components: overrides.use_legacy_peak_premium_components,
  });
  return database;
}

function createCanonicalCalloff(
  database: PrototypeDatabase,
  kind: ProductKind,
  input: {
    calloff_id: string;
    month: string;
    base_mw: number;
    base_epad_mw?: number;
    allocation_peak_mw: number;
    allocation_peak_epad_mw?: number;
    peak_mw: number;
    peak_epad_mw?: number;
    use_legacy_allocation_peak_component?: boolean;
    use_legacy_peak_premium_components?: boolean;
  },
): void {
  const productId = productIdFor(kind);
  insertCalloff(database, {
    calloff_id: input.calloff_id,
    product_id: productId,
    portfolio_id: portfolioIdFor(kind),
    date: "2027-01-10",
    delivery_start_month: input.month,
    delivery_end_month: input.month,
  });

  const allocationComponents = input.use_legacy_allocation_peak_component
    ? ([["allocation.peak", input.allocation_peak_mw]] as const)
    : ([
        ["allocation.peak.sys", input.allocation_peak_mw],
        ["allocation.peak.epad", input.allocation_peak_epad_mw ?? input.allocation_peak_mw],
      ] as const);
  const peakComponents = input.use_legacy_peak_premium_components
    ? ([
        ["peak.premium.sys", input.peak_mw],
        ["peak.premium.epad", input.peak_epad_mw ?? input.peak_mw],
      ] as const)
    : ([
        ["peak.sys", input.peak_mw],
        ["peak.epad", input.peak_epad_mw ?? input.peak_mw],
      ] as const);

  ensureLegacyAllocationComponent(database, productId, input.use_legacy_allocation_peak_component ?? false);
  ensureLegacyPeakComponents(database, productId, input.use_legacy_peak_premium_components ?? false);

  const rows = [
    ...allocationComponents,
    ["base.sys", input.base_mw],
    ["base.epad", input.base_epad_mw ?? input.base_mw],
    ...peakComponents,
  ] as const;

  rows.forEach(([component, mw], index) => {
    insertTransaction(database, {
      transaction_id: `${input.calloff_id}-${String(index).padStart(3, "0")}`,
      calloff_id: input.calloff_id,
      month: input.month,
      productcomponent_id: `${productId}:${component}`,
      mw,
      q_factor: component.startsWith("allocation.peak") ? 0 : 1,
    });
  });
}

function setPrices(database: PrototypeDatabase, productId: string): void {
  const prices = new Map([
    ["base.sys", 70],
    ["base.epad", 15],
    ["peak.sys", 20],
    ["peak.epad", 2],
    ["peak.premium.sys", 20],
    ["peak.premium.epad", 2],
  ]);

  for (const component of database.productConfigurationComponents.values()) {
    if (component.product_id !== productId) {
      continue;
    }
    const price = prices.get(component.component);
    if (price === undefined) {
      continue;
    }
    const priceComponent = [...database.priceComponents.values()].find(
      (candidate) => candidate.productcomponent_id === component.productcomponent_id,
    );
    assert.ok(priceComponent);
    priceComponent.price = price;
  }
}

function ensureLegacyAllocationComponent(database: PrototypeDatabase, productId: string, enabled: boolean): void {
  if (!enabled) {
    return;
  }
  const component = "allocation.peak";
  const productcomponent_id = `${productId}:${component}`;
  if (database.productConfigurationComponents.has(productcomponent_id)) {
    return;
  }
  insertProductConfigurationComponent(database, {
    productcomponent_id,
    product_id: productId,
    name: `${productId} ${component}`,
    component,
    productitem: "allocation",
  });
  insertPriceComponent(database, {
    pricecomponent_id: `PRI:${productId}:${component}`,
    productcomponent_id,
    price: 0,
    currency: "EUR",
  });
}

function ensureLegacyPeakComponents(database: PrototypeDatabase, productId: string, enabled: boolean): void {
  if (!enabled) {
    return;
  }
  for (const component of ["peak.premium.sys", "peak.premium.epad"]) {
    const productcomponent_id = `${productId}:${component}`;
    if (database.productConfigurationComponents.has(productcomponent_id)) {
      continue;
    }
    insertProductConfigurationComponent(database, {
      productcomponent_id,
      product_id: productId,
      name: `${productId} ${component}`,
      component,
      productitem: "peak",
    });
    insertPriceComponent(database, {
      pricecomponent_id: `PRI:${productId}:${component}`,
      productcomponent_id,
      price: component.endsWith(".sys") ? 20 : 2,
      currency: "EUR",
    });
  }
}

function addAdjustmentTransaction(database: PrototypeDatabase, productId: string, calloffId: string): void {
  insertProductConfigurationComponent(database, {
    productcomponent_id: `${productId}:fixed`,
    product_id: productId,
    name: `${productId} fixed adjustment`,
    component: "fixed",
    productitem: "adjustment",
  });
  insertPriceComponent(database, {
    pricecomponent_id: `PRI:${productId}:fixed`,
    productcomponent_id: `${productId}:fixed`,
    price: 999,
    currency: "EUR",
  });
  insertTransaction(database, {
    transaction_id: `${calloffId}-999`,
    calloff_id: calloffId,
    month: "2027-01",
    productcomponent_id: `${productId}:fixed`,
    mw: 999,
    q_factor: 1,
  });
}

function productIdFor(kind: ProductKind): string {
  return kind === "classic" ? "PRO01" : "PRO02";
}

function portfolioIdFor(kind: ProductKind): string {
  return kind === "classic" ? "CUS01-0" : "CUS02-0";
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function assertApprox(actual: number | undefined, expected: number): void {
  assert.ok(actual !== undefined);
  assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} !== ${expected}`);
}
