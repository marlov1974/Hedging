import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  getApplicationFeaturesForPortfolio,
  isPeaksModernPortfolio,
  resolveActiveFeature,
} from "../../src/hedging/applicationConfig.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("application configuration", () => {
  it("returns Baseloads features for Baseloads portfolio", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "PORT_BASELOADS");

    assert.equal(config.variant_id, "baseloads");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "buy-baseloads", "baseloads-calloff-list", "position-report", "financial-settlement"],
    );
  });

  it("returns PeaksModern features for PeaksModern portfolio", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "PORT_PEAKS_MODERN");

    assert.equal(config.variant_id, "peaks-modern");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "forecast", "forecast-hedge"],
    );
  });

  it("detects PeaksModern portfolio", () => {
    assert.equal(isPeaksModernPortfolio(createPocSeedData(), "PORT_PEAKS_MODERN"), true);
  });

  it("PeaksModern does not show Baseloads-only features", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "PORT_PEAKS_MODERN" });

    assert.doesNotMatch(html, /Buy Baseloads/);
    assert.doesNotMatch(html, /Baseloads Calloff List/);
    assert.match(html, /Portfolio Details/);
    assert.match(html, /Forecast/);
  });

  it("switching from Baseloads to PeaksModern resets unavailable active feature", () => {
    const database = createPocSeedData();

    assert.equal(resolveActiveFeature(database, "PORT_PEAKS_MODERN", "buy-baseloads"), "portfolio-details");
    const html = renderHedgingTool(database, { portfolio_id: "PORT_PEAKS_MODERN", feature_id: "buy-baseloads" });
    assert.match(html, /Portfolio Details/);
    assert.doesNotMatch(html, /Confirm purchase/);
  });

  it("shared feature remains active when switching application variant", () => {
    assert.equal(resolveActiveFeature(createPocSeedData(), "PORT_PEAKS_MODERN", "portfolio-details"), "portfolio-details");
  });

  it("changes visible application context text and appearance for PeaksModern", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "PORT_PEAKS_MODERN" });

    assert.match(html, /variant-peaks-modern/);
    assert.match(html, /PeaksModern application/);
    assert.match(html, /PeaksModern forecast workspace/);
  });
});
