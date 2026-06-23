import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  defaultPerspectiveForPortfolio,
  getApplicationFeaturesForPortfolio,
  isPeaksClassicPortfolio,
  isPeaksModernPortfolio,
  parsePerspectiveId,
  resolveActiveFeature,
} from "../../src/hedging/applicationConfig.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("application configuration", () => {
  it("returns Baseloads perspective features for the selected portfolio", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS00-0");

    assert.equal(config.variant_id, "baseloads");
    assert.equal(config.perspective_id, "baseloads");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "forecast", "buy-baseloads", "baseloads-calloff-list", "position-report", "financial-settlement", "data-viewer"],
    );
  });

  it("returns Modern perspective features for the selected portfolio", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS02-0");

    assert.equal(config.variant_id, "peaks-modern");
    assert.equal(config.perspective_id, "modern");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "forecast", "forecast-hedge", "modern-calloff-transaction-list", "position-report", "data-viewer"],
    );
  });

  it("returns Classic perspective features for the selected portfolio", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS01-0");

    assert.equal(config.variant_id, "peaks-classic");
    assert.equal(config.perspective_id, "classic");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "forecast", "forecast-hedge", "legacy-calloff-list", "position-report", "data-viewer"],
    );
  });

  it("same selected portfolio can show Baseloads, Classic and Modern perspectives", () => {
    const database = createPocSeedData();

    assert.equal(getApplicationFeaturesForPortfolio(database, "CUS00-0", "baseloads").title, "Baseloads perspective");
    assert.equal(getApplicationFeaturesForPortfolio(database, "CUS00-0", "classic").title, "Classic perspective");
    assert.equal(getApplicationFeaturesForPortfolio(database, "CUS00-0", "modern").title, "Modern perspective");
  });

  it("detects Peaks.Modern portfolio", () => {
    assert.equal(isPeaksModernPortfolio(createPocSeedData(), "CUS02-0"), true);
  });

  it("detects Peaks.Classic portfolio", () => {
    assert.equal(isPeaksClassicPortfolio(createPocSeedData(), "CUS01-0"), true);
  });

  it("Modern perspective does not show Baseloads-only features", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS02-0", perspective_id: "modern" });

    assert.doesNotMatch(html, /Hedge Baseload/);
    assert.doesNotMatch(html, /Calloff List - Baseloads/);
    assert.match(html, /Portfolio Details/);
    assert.match(html, /Forecast/);
  });

  it("switching from Baseloads to Modern perspective resets unavailable active feature", () => {
    const database = createPocSeedData();

    assert.equal(resolveActiveFeature(database, "CUS00-0", "buy-baseloads", "modern"), "portfolio-details");
    const html = renderHedgingTool(database, { portfolio_id: "CUS00-0", perspective_id: "modern", feature_id: "buy-baseloads" });
    assert.match(html, /Portfolio Details/);
    assert.doesNotMatch(html, /Confirm purchase/);
    assert.match(html, /portfolio_id=CUS00-0&perspective_id=modern/);
  });

  it("shared feature remains active when switching application variant", () => {
    assert.equal(resolveActiveFeature(createPocSeedData(), "CUS02-0", "portfolio-details"), "portfolio-details");
  });

  it("changes visible application context text and appearance for Modern perspective", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS02-0" });

    assert.match(html, /variant-peaks-modern/);
    assert.match(html, /Modern perspective/);
    assert.match(html, /Modern projection over the selected portfolio/);
  });

  it("parses perspective ids with portfolio-derived fallback", () => {
    const database = createPocSeedData();

    assert.equal(defaultPerspectiveForPortfolio(database, "CUS02-0"), "modern");
    assert.equal(parsePerspectiveId("classic", "modern"), "classic");
    assert.equal(parsePerspectiveId("unknown", "modern"), "modern");
  });
});
