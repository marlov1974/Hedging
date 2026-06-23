import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  getApplicationFeaturesForPortfolio,
  isPeaksClassicPortfolio,
  isPeaksModernPortfolio,
  resolveActiveFeature,
} from "../../src/hedging/applicationConfig.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("application configuration", () => {
  it("returns Baseloads features for Baseloads portfolio", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS00-0");

    assert.equal(config.variant_id, "baseloads");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "buy-baseloads", "baseloads-calloff-list", "position-report", "financial-settlement", "data-viewer"],
    );
  });

  it("returns Peaks.Modern features for Peaks.Modern portfolio", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS02-0");

    assert.equal(config.variant_id, "peaks-modern");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "forecast", "forecast-hedge", "modern-calloff-transaction-list", "data-viewer"],
    );
  });

  it("returns Peaks.Classic features for Peaks.Classic portfolio", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS01-0");

    assert.equal(config.variant_id, "peaks-classic");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "legacy-calloff-list", "data-viewer"],
    );
  });

  it("detects Peaks.Modern portfolio", () => {
    assert.equal(isPeaksModernPortfolio(createPocSeedData(), "CUS02-0"), true);
  });

  it("detects Peaks.Classic portfolio", () => {
    assert.equal(isPeaksClassicPortfolio(createPocSeedData(), "CUS01-0"), true);
  });

  it("Peaks.Modern does not show Baseloads-only features", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS02-0" });

    assert.doesNotMatch(html, /Buy Baseloads/);
    assert.doesNotMatch(html, /Baseloads Calloff List/);
    assert.match(html, /Portfolio Details/);
    assert.match(html, /Forecast/);
  });

  it("switching from Baseloads to Peaks.Modern resets unavailable active feature", () => {
    const database = createPocSeedData();

    assert.equal(resolveActiveFeature(database, "CUS02-0", "buy-baseloads"), "portfolio-details");
    const html = renderHedgingTool(database, { portfolio_id: "CUS02-0", feature_id: "buy-baseloads" });
    assert.match(html, /Portfolio Details/);
    assert.doesNotMatch(html, /Confirm purchase/);
  });

  it("shared feature remains active when switching application variant", () => {
    assert.equal(resolveActiveFeature(createPocSeedData(), "CUS02-0", "portfolio-details"), "portfolio-details");
  });

  it("changes visible application context text and appearance for Peaks.Modern", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS02-0" });

    assert.match(html, /variant-peaks-modern/);
    assert.match(html, /Peaks\.Modern application/);
    assert.match(html, /Peaks\.Modern workspace for modern base and peak forecast hedging/);
  });
});
