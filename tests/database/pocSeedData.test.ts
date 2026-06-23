import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CALENDAR_SET_ID,
  COMPONENTS_BY_PRODUCT,
  Q_FACTOR_RANGES,
  calculateSwedishTradingHours,
  createPocSeedData,
  listSeedMonths,
} from "../../src/database/pocSeedData.ts";
import { getPortfolioProductComponents, getQFactorValuesBySet } from "../../src/database/repository.ts";
import {
  canonicalComponentCode,
  canonicalProductPackageName,
  isCustomerProjectionComponent,
  isInternalProjectionComponent,
  isMarketProjectionComponent,
} from "../../src/database/canonicalComponents.ts";

describe("P0015 PoC seed data", () => {
  it("creates five customers, five portfolios and five product configurations", () => {
    const database = createPocSeedData();

    assert.equal(database.customers.size, 5);
    assert.equal(database.portfolios.size, 5);
    assert.equal(database.productConfigurations.size, 5);
  });

  it("creates all expected product components for each product configuration", () => {
    const database = createPocSeedData();

    for (const [productName, expectedComponents] of COMPONENTS_BY_PRODUCT.entries()) {
      const product = [...database.productConfigurations.values()].find((candidate) => candidate.name === productName);
      assert.ok(product, `missing product ${productName}`);

      const actualComponents = [...database.productConfigurationComponents.values()]
        .filter((component) => component.product_id === product.product_id)
        .map((component) => component.component)
        .sort();

      assert.deepEqual(actualComponents, [...expectedComponents].sort());
    }
  });

  it("creates 36 calendar rows for 2027-01 through 2029-12", () => {
    const database = createPocSeedData();
    const months = listSeedMonths();

    assert.equal(database.calendars.size, 36);
    assert.deepEqual(
      [...database.calendars.values()].map((calendar) => calendar.month).sort(),
      months,
    );
    assert.ok([...database.portfolios.values()].every((portfolio) => portfolio.calendar_id === CALENDAR_SET_ID));
  });

  it("calculates Swedish trading peak hours as weekdays 06:00-22:00", () => {
    const database = createPocSeedData();

    for (const calendar of database.calendars.values()) {
      const expectedPeakH = expectedWeekdays(calendar.month) * 16;
      assert.equal(calendar.peak_h, expectedPeakH);
      assert.equal(calendar.total_h, daysInMonth(calendar.month) * 24);
      assert.equal(calculateSwedishTradingHours(calendar.month).offpeak_h, calendar.total_h - calendar.peak_h);
    }
  });

  it("creates 36 forecast rows per portfolio with total consumption mwh", () => {
    const database = createPocSeedData();
    const months = listSeedMonths();

    for (const portfolio of database.portfolios.values()) {
      const forecasts = [...database.forecasts.values()].filter((forecast) => forecast.portfolio_id === portfolio.portfolio_id);

      assert.equal(forecasts.length, 36);
      assert.deepEqual(
        forecasts.map((forecast) => forecast.month).sort(),
        months,
      );
      assert.ok(forecasts.every((forecast) => forecast.mwh > 0));
      assert.ok(forecasts.every((forecast) => forecast.peak_pct > 0 && forecast.peak_pct < 1));
    }
  });

  it("uses realistic small-industry seasonal forecast profile", () => {
    const database = createPocSeedData();
    const forecasts = [...database.forecasts.values()].filter((forecast) => forecast.portfolio_id === "CUS02-0");
    const byMonth = new Map(forecasts.map((forecast) => [forecast.month, forecast]));

    assert.equal(byMonth.get("2027-01")?.mwh, 1230);
    assert.equal(byMonth.get("2027-07")?.mwh, 760);
    assert.equal(byMonth.get("2027-12")?.mwh, 840);
    assert.ok(forecasts.every((forecast) => forecast.mwh >= 750 && forecast.mwh <= 1250));

    assert.equal(byMonth.get("2027-06")?.peak_pct, 0.6);
    assert.equal(byMonth.get("2027-07")?.peak_pct, 0.52);
    assert.equal(byMonth.get("2027-12")?.peak_pct, 0.42);
    assert.ok(forecasts.every((forecast) => forecast.peak_pct >= 0.4 && forecast.peak_pct <= 0.6));
  });

  it("creates one portfolio product component with qfactor_set_id for every product component", () => {
    const database = createPocSeedData();

    for (const portfolio of database.portfolios.values()) {
      const instances = getPortfolioProductComponents(database, portfolio.portfolio_id);

      assert.ok(instances.length > 0);
      assert.ok(instances.every((instance) => instance.qfactor_set_id.trim() !== ""));
      assert.ok(instances.every((instance) => database.qFactorSets.has(instance.qfactor_set_id)));
    }

    assert.equal(database.portfolioProductComponents.size, database.productConfigurationComponents.size);
  });

  it("creates 36 monthly qfactor values for every qfactor set", () => {
    const database = createPocSeedData();
    const months = listSeedMonths();

    for (const qFactorSet of database.qFactorSets.values()) {
      const values = getQFactorValuesBySet(database, qFactorSet.qfactor_set_id);

      assert.equal(values.length, 36);
      assert.deepEqual(
        values.map((value) => value.month),
        months,
      );
    }
  });

  it("keeps qfactor set component aligned with linked product component component", () => {
    const database = createPocSeedData();

    for (const instance of database.portfolioProductComponents.values()) {
      const productComponent = database.productConfigurationComponents.get(instance.productcomponent_id);
      const qFactorSet = database.qFactorSets.get(instance.qfactor_set_id);

      assert.equal(qFactorSet?.component, productComponent?.component);
    }
  });

  it("keeps qfactor values inside allowed component ranges", () => {
    const database = createPocSeedData();

    for (const qFactorSet of database.qFactorSets.values()) {
      const [min, max] = Q_FACTOR_RANGES.get(qFactorSet.component) ?? [0, 0];
      const values = getQFactorValuesBySet(database, qFactorSet.qfactor_set_id);

      assert.ok(values.every((value) => value.value >= min && value.value <= max));
    }
  });

  it("uses qfactor 1.0 for base components", () => {
    const database = createPocSeedData();
    const baseComponents = new Set(["base.sys", "base.epad", "base.classic.sys", "base.classic.epad"]);

    for (const qFactorSet of database.qFactorSets.values()) {
      if (!baseComponents.has(qFactorSet.component)) {
        continue;
      }

      assert.ok(getQFactorValuesBySet(database, qFactorSet.qfactor_set_id).every((value) => value.value === 1));
    }
  });

  it("uses qfactor 0 for volume components", () => {
    const database = createPocSeedData();

    for (const qFactorSet of database.qFactorSets.values()) {
      if (qFactorSet.component !== "volume") {
        continue;
      }

      assert.ok(getQFactorValuesBySet(database, qFactorSet.qfactor_set_id).every((value) => value.value === 0));
    }
  });

  it("uses qfactor 0 and price 0 for allocation peak components", () => {
    const database = createPocSeedData();
    const allocationComponents = [...database.productConfigurationComponents.values()].filter(
      (component) => component.component === "allocation.peak.sys" || component.component === "allocation.peak.epad",
    );

    assert.ok(allocationComponents.length > 0);
    for (const component of allocationComponents) {
      assert.equal(component.component_category, "allocation");
      assert.equal(component.hour_basis, "peak_h");
      assert.equal(isMarketProjectionComponent(component), false);
      assert.equal(isCustomerProjectionComponent(component), true);
      assert.equal(isInternalProjectionComponent(component), true);

      const price = [...database.priceComponents.values()].find(
        (candidate) => candidate.productcomponent_id === component.productcomponent_id,
      );
      assert.equal(price?.price, 0);

      const portfolioComponent = [...database.portfolioProductComponents.values()].find(
        (candidate) => candidate.productcomponent_id === component.productcomponent_id,
      );
      assert.ok(portfolioComponent);
      assert.ok(
        getQFactorValuesBySet(database, portfolioComponent.qfactor_set_id).every((value) => value.value === 0),
      );
    }
  });

  it("stores canonical component categories and hour basis", () => {
    const database = createPocSeedData();
    const byComponent = new Map([...database.productConfigurationComponents.values()].map((component) => [component.component, component]));

    assert.equal(byComponent.get("base.sys")?.component_category, "base");
    assert.equal(byComponent.get("base.sys")?.hour_basis, "total_h");
    assert.equal(byComponent.get("allocation.peak.sys")?.component_category, "allocation");
    assert.equal(byComponent.get("allocation.peak.sys")?.hour_basis, "peak_h");
    assert.equal(byComponent.get("allocation.peak.epad")?.component_category, "allocation");
    assert.equal(byComponent.get("allocation.peak.epad")?.hour_basis, "peak_h");
    assert.equal(byComponent.get("peak.sys")?.component_category, "peak");
    assert.equal(byComponent.get("peak.sys")?.hour_basis, "peak_h");
    assert.equal(byComponent.get("profile.sys")?.component_category, "profile");
    assert.equal(byComponent.get("volume")?.component_category, "volume");
  });

  it("uses canonical peak components for Peaks packages and reserves profile extensions", () => {
    const database = createPocSeedData();
    const peaksClassic = productComponentsByProductName(database, "Peaks.Classic");
    const peaksModern = productComponentsByProductName(database, "Peaks.Modern");
    const profilesClassic = productComponentsByProductName(database, "Profiles.Classic");
    const profilesModern = productComponentsByProductName(database, "Profiles.Modern");

    assert.ok(peaksClassic.has("allocation.peak.sys"));
    assert.ok(peaksClassic.has("allocation.peak.epad"));
    assert.ok(!peaksClassic.has("allocation.peak"));
    assert.ok(peaksClassic.has("base.sys"));
    assert.ok(peaksClassic.has("base.epad"));
    assert.ok(peaksClassic.has("peak.sys"));
    assert.ok(peaksClassic.has("peak.epad"));
    assert.ok(!peaksClassic.has("peak.premium.sys"));
    assert.ok(!peaksClassic.has("peak.modern.sys"));
    assert.ok(peaksModern.has("allocation.peak.sys"));
    assert.ok(peaksModern.has("allocation.peak.epad"));
    assert.ok(!peaksModern.has("allocation.peak"));
    assert.ok(peaksModern.has("peak.sys"));
    assert.ok(peaksModern.has("peak.epad"));
    assert.ok(!peaksModern.has("peak.premium.sys"));
    assert.ok(!peaksModern.has("peak.modern.sys"));
    assert.ok(profilesClassic.has("profile.sys"));
    assert.ok(profilesClassic.has("profile.epad"));
    assert.ok(profilesModern.has("profile.sys"));
    assert.ok(profilesModern.has("profile.epad"));
  });

  it("normalizes deprecated product package aliases", () => {
    assert.equal(canonicalProductPackageName("PeaksModern"), "Peaks.Modern");
    assert.equal(canonicalProductPackageName("PeaksClassic"), "Peaks.Classic");
  });

  it("normalizes deprecated peak component aliases", () => {
    assert.equal(canonicalComponentCode("peak.premium.sys"), "peak.sys");
    assert.equal(canonicalComponentCode("peak.premium.epad"), "peak.epad");
    assert.equal(canonicalComponentCode("peak.modern.sys"), "peak.sys");
    assert.equal(canonicalComponentCode("peak.modern.epad"), "peak.epad");
    assert.equal(isMarketProjectionComponent("peak.sys"), true);
    assert.equal(isCustomerProjectionComponent("peak.sys"), true);
    assert.equal(isInternalProjectionComponent("peak.sys"), true);
  });

  it("creates deterministic price components for all product components", () => {
    const database = createPocSeedData();

    assert.equal(database.priceComponents.size, database.productConfigurationComponents.size);
    assert.ok([...database.priceComponents.values()].every((priceComponent) => priceComponent.currency === "EUR"));
  });
});

function productComponentsByProductName(database: ReturnType<typeof createPocSeedData>, productName: string): Set<string> {
  const product = [...database.productConfigurations.values()].find((candidate) => candidate.name === productName);
  assert.ok(product, `missing product ${productName}`);

  return new Set(
    [...database.productConfigurationComponents.values()]
      .filter((component) => component.product_id === product.product_id)
      .map((component) => component.component),
  );
}

function daysInMonth(month: string): number {
  const [yearText, monthText] = month.split("-");
  return new Date(Date.UTC(Number(yearText), Number(monthText), 0)).getUTCDate();
}

function expectedWeekdays(month: string): number {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  let weekdays = 0;

  for (let day = 1; day <= daysInMonth(month); day += 1) {
    const dayOfWeek = new Date(Date.UTC(year, monthNumber - 1, day)).getUTCDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays += 1;
    }
  }

  return weekdays;
}
