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
import { getRawTransactionsForPortfolioYear } from "../../src/hedging/dataViewer.ts";
import { getLegacyCalloffListRows, projectLegacyCalloffMonth } from "../../src/hedging/legacyCalloffList.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("Peaks.Classic Legacy Calloff List", () => {
  it("is available through the generic Calloff List feature", () => {
    const features = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS01-0").features;

    assert.equal(features.some((feature) => feature.feature_id === "calloff-list" && feature.available), true);
  });

  it("does not expose the legacy feature id in the main feature list", () => {
    const features = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS02-0").features;

    assert.equal(features.some((feature) => feature.feature_id === "legacy-calloff-list"), false);
  });

  it("projects one-month calloff into Offpeak and Peak customer rows", () => {
    const database = createWorkedExampleDatabase();

    const rows = getLegacyCalloffListRows(database, "CUS01-0");

    assert.deepEqual(
      rows.map((row) => row.block),
      ["Offpeak", "Peak"],
    );
    assert.equal(rows.some((row) => row.block === "allocation.peak.sys" as never), false);
    assert.equal(rows.some((row) => row.block === "allocation.peak.epad" as never), false);
  });

  it("matches positive example volumes and projected prices", () => {
    const database = createWorkedExampleDatabase();
    const rows = getLegacyCalloffListRows(database, "CUS01-0");
    const offpeak = rows.find((row) => row.block === "Offpeak");
    const peak = rows.find((row) => row.block === "Peak");

    assert.equal(offpeak?.mw, 0.117925);
    assert.equal(offpeak?.mwh, 50);
    assert.equal(offpeak?.price, 85);
    assert.equal(offpeak?.value, 4250);
    assert.equal(peak?.mw, 0.15625);
    assert.equal(peak?.mwh, 50);
    assert.equal(peak?.price, 96.88172);
    assertApprox(peak?.value, 4844.08602);
  });

  it("preserves canonical total value", () => {
    const database = createWorkedExampleDatabase();
    const rows = getLegacyCalloffListRows(database, "CUS01-0");

    const projectedValue = rows.reduce((sum, row) => sum + row.value, 0);
    assertApprox(projectedValue, 9094.08602);
  });

  it("allows negative peak MW and can project peak price below base price", () => {
    const database = createWorkedExampleDatabase({ allocation_peak_mw: 0.109375, peak_mw: -0.0250336022 });
    const peak = getLegacyCalloffListRows(database, "CUS01-0").find((row) => row.block === "Peak");

    assert.ok(peak);
    assert.equal(peak.mwh, 35);
    assert.ok((peak.price ?? 0) < 85);
  });

  it("keeps allocation rows out of customer projection but visible in Data Viewer", () => {
    const database = createWorkedExampleDatabase();
    const html = renderHedgingTool(database, { portfolio_id: "CUS01-0", feature_id: "legacy-calloff-list" });
    const rawComponents = getRawTransactionsForPortfolioYear(database, "CUS01-0", "2027").map(
      (row) => database.productConfigurationComponents.get(row.productcomponent_id)?.component,
    );

    assert.doesNotMatch(html, /allocation\.peak\.sys/);
    assert.doesNotMatch(html, /allocation\.peak\.epad/);
    assert.ok(rawComponents.includes("allocation.peak.sys"));
    assert.ok(rawComponents.includes("allocation.peak.epad"));
    assert.ok(rawComponents.includes("peak.sys"));
    assert.ok(rawComponents.includes("peak.epad"));
  });

  it("ignores adjustment/internal-only rows in the customer legacy projection", () => {
    const database = createWorkedExampleDatabase();
    addAdjustmentTransaction(database);

    const rows = getLegacyCalloffListRows(database, "CUS01-0");

    assert.deepEqual(
      rows.map((row) => row.block),
      ["Offpeak", "Peak"],
    );
  });

  it("aggregates multi-month calloffs with value-weighted prices", () => {
    const database = createWorkedExampleDatabase();
    createClassicCanonicalCalloff(database, {
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

    const peak = getLegacyCalloffListRows(database, "CUS01-0").find((row) => row.block === "Peak");
    const monthlyPeakPrices = projectLegacyCalloffMonth(
      database,
      database.calloffs.get("CAL20")!,
      [...database.transactions.values()].filter((row) => row.calloff_id === "CAL20" && row.month === "2027-01"),
    )
      .filter((row) => row.block === "Peak")
      .concat(
        projectLegacyCalloffMonth(
          database,
          database.calloffs.get("CAL20")!,
          [...database.transactions.values()].filter((row) => row.calloff_id === "CAL20" && row.month === "2027-02"),
        ).filter((row) => row.block === "Peak"),
      )
      .map((row) => row.price ?? 0);

    assert.ok(peak);
    assert.equal(peak.price, round(peak.value / peak.mwh));
    assert.notEqual(peak.price, round((monthlyPeakPrices[0] + monthlyPeakPrices[1]) / 2));
  });

  it("zero peak/offpeak hours does not divide by zero", () => {
    const database = createWorkedExampleDatabase();
    const calendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
    assert.ok(calendar);
    calendar.peak_h = 0;

    const rows = getLegacyCalloffListRows(database, "CUS01-0");

    assert.equal(rows.every((row) => row.mw === null), true);
    assert.match(rows[0].warnings.join("; "), /zero peak or offpeak hours/);
  });

  it("mismatched base sys and epad MW creates a warning", () => {
    const database = createWorkedExampleDatabase({ base_epad_mw: 0.2 });
    const rows = getLegacyCalloffListRows(database, "CUS01-0");

    assert.match(rows[0].warnings.join("; "), /mismatched base MW/);
  });

  it("mismatched allocation sys and epad MW creates a warning and uses sys volume", () => {
    const database = createWorkedExampleDatabase({ allocation_peak_epad_mw: 0.2 });
    const rows = getLegacyCalloffListRows(database, "CUS01-0");
    const peak = rows.find((row) => row.block === "Peak");

    assert.equal(peak?.mw, 0.15625);
    assert.match(rows[0].warnings.join("; "), /mismatched allocation peak MW/);
  });

  it("reads old allocation.peak alias when split rows are absent", () => {
    const database = createWorkedExampleDatabase({ use_legacy_allocation_peak_component: true });
    const rows = getLegacyCalloffListRows(database, "CUS01-0");
    const peak = rows.find((row) => row.block === "Peak");

    assert.equal(peak?.mw, 0.15625);
    assert.match(rows[0].warnings.join("; "), /legacy allocation\.peak alias/);
  });

  it("reads old peak.premium aliases", () => {
    const database = createWorkedExampleDatabase({ use_legacy_peak_premium_components: true });
    const peak = getLegacyCalloffListRows(database, "CUS01-0").find((row) => row.block === "Peak");

    assert.equal(peak?.price, 96.88172);
  });
});

function createWorkedExampleDatabase(
  overrides: Partial<{
    base_mw: number;
    base_epad_mw: number;
    allocation_peak_mw: number;
    allocation_peak_epad_mw: number;
    peak_mw: number;
    use_legacy_allocation_peak_component: boolean;
    use_legacy_peak_premium_components: boolean;
  }> = {},
): PrototypeDatabase {
  const database = createPocSeedData();
  const calendar = [...database.calendars.values()].find((row) => row.month === "2027-01");
  assert.ok(calendar);
  calendar.total_h = 744;
  calendar.peak_h = 320;
  setClassicPrices(database);
  createClassicCanonicalCalloff(database, {
    calloff_id: "CAL20",
    month: "2027-01",
    base_mw: overrides.base_mw ?? 100 / 744,
    base_epad_mw: overrides.base_epad_mw,
    allocation_peak_mw: overrides.allocation_peak_mw ?? 0.15625,
    allocation_peak_epad_mw: overrides.allocation_peak_epad_mw,
    peak_mw: overrides.peak_mw ?? 0.0218413978,
    use_legacy_allocation_peak_component: overrides.use_legacy_allocation_peak_component,
    use_legacy_peak_premium_components: overrides.use_legacy_peak_premium_components,
  });
  return database;
}

function createClassicCanonicalCalloff(
  database: PrototypeDatabase,
  input: {
    calloff_id: string;
    month: string;
    base_mw: number;
    base_epad_mw?: number;
    allocation_peak_mw: number;
    allocation_peak_epad_mw?: number;
    peak_mw: number;
    use_legacy_allocation_peak_component?: boolean;
    use_legacy_peak_premium_components?: boolean;
  },
): void {
  insertCalloff(database, {
    calloff_id: input.calloff_id,
    product_id: "PRO01",
    portfolio_id: "CUS01-0",
    date: "2027-01-15",
    delivery_start_month: input.month,
    delivery_end_month: input.month,
  });

  const peakComponents = input.use_legacy_peak_premium_components
    ? (["peak.premium.sys", "peak.premium.epad"] as const)
    : (["peak.sys", "peak.epad"] as const);
  const allocationComponents = input.use_legacy_allocation_peak_component
    ? ([["allocation.peak", input.allocation_peak_mw]] as const)
    : ([
        ["allocation.peak.sys", input.allocation_peak_mw],
        ["allocation.peak.epad", input.allocation_peak_epad_mw ?? input.allocation_peak_mw],
      ] as const);
  ensureLegacyAllocationComponent(database, input.use_legacy_allocation_peak_component ?? false);
  ensureLegacyPeakComponents(database, input.use_legacy_peak_premium_components ?? false);

  const rows = [
    ...allocationComponents,
    ["base.sys", input.base_mw],
    ["base.epad", input.base_epad_mw ?? input.base_mw],
    [peakComponents[0], input.peak_mw],
    [peakComponents[1], input.peak_mw],
  ] as const;

  rows.forEach(([component, mw], index) => {
    insertTransaction(database, {
      transaction_id: `${input.calloff_id}-${String(index).padStart(3, "0")}`,
      calloff_id: input.calloff_id,
      month: input.month,
      productcomponent_id: `PRO01:${component}`,
      mw,
      q_factor: component.startsWith("allocation.peak") ? 0 : 1,
    });
  });
}

function ensureLegacyAllocationComponent(database: PrototypeDatabase, enabled: boolean): void {
  if (!enabled) {
    return;
  }

  const component = "allocation.peak";
  const productcomponent_id = `PRO01:${component}`;
  if (database.productConfigurationComponents.has(productcomponent_id)) {
    return;
  }
  insertProductConfigurationComponent(database, {
    productcomponent_id,
    product_id: "PRO01",
    name: `Peaks.Classic ${component}`,
    component,
    productitem: "allocation",
  });
  insertPriceComponent(database, {
    pricecomponent_id: `PRI:PRO01:${component}`,
    productcomponent_id,
    price: 0,
    currency: "EUR",
  });
}

function setClassicPrices(database: PrototypeDatabase): void {
  const prices = new Map([
    ["base.sys", 70],
    ["base.epad", 15],
    ["peak.sys", 20],
    ["peak.epad", 2],
    ["peak.premium.sys", 20],
    ["peak.premium.epad", 2],
  ]);

  for (const component of database.productConfigurationComponents.values()) {
    if (component.product_id !== "PRO01") {
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

function ensureLegacyPeakComponents(database: PrototypeDatabase, enabled: boolean): void {
  if (!enabled) {
    return;
  }

  for (const component of ["peak.premium.sys", "peak.premium.epad"]) {
    const productcomponent_id = `PRO01:${component}`;
    if (database.productConfigurationComponents.has(productcomponent_id)) {
      continue;
    }
    insertProductConfigurationComponent(database, {
      productcomponent_id,
      product_id: "PRO01",
      name: `Peaks.Classic ${component}`,
      component,
      productitem: "peak",
    });
    insertPriceComponent(database, {
      pricecomponent_id: `PRI:PRO01:${component}`,
      productcomponent_id,
      price: component.endsWith(".sys") ? 20 : 2,
      currency: "EUR",
    });
  }
}

function addAdjustmentTransaction(database: PrototypeDatabase): void {
  insertProductConfigurationComponent(database, {
    productcomponent_id: "PRO01:fixed",
    product_id: "PRO01",
    name: "Peaks.Classic fixed adjustment",
    component: "fixed",
    productitem: "adjustment",
  });
  insertPriceComponent(database, {
    pricecomponent_id: "PRI:PRO01:fixed",
    productcomponent_id: "PRO01:fixed",
    price: 999,
    currency: "EUR",
  });
  insertTransaction(database, {
    transaction_id: "CAL20-999",
    calloff_id: "CAL20",
    month: "2027-01",
    productcomponent_id: "PRO01:fixed",
    mw: 999,
    q_factor: 1,
  });
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function assertApprox(actual: number | undefined, expected: number): void {
  assert.ok(actual !== undefined);
  assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} !== ${expected}`);
}
