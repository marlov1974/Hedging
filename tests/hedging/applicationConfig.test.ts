import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import {
  defaultPerspectiveForPortfolio,
  getApplicationFeaturesForPortfolio,
  getDataViewerPerspectiveOptions,
  getPerspectiveOptions,
  isPeaksClassicPortfolio,
  isPeaksModernPortfolio,
  parsePerspectiveId,
  resolveActiveFeature,
} from "../../src/hedging/applicationConfig.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";

describe("application configuration", () => {
  it("returns one generic single-portfolio feature list", () => {
    const config = getApplicationFeaturesForPortfolio(createPocSeedData(), "CUS00-0");

    assert.equal(config.variant_id, "baseloads");
    assert.equal(config.perspective_id, "baseloads");
    assert.equal(config.title, "Universal model demo");
    assert.deepEqual(
      config.features.map((feature) => feature.feature_id),
      ["portfolio-details", "forecast", "forecast-hedge", "calloff-list", "position-report", "data-viewer", "buy-baseloads"],
    );
  });

  it("requested perspective does not change the global feature list", () => {
    const database = createPocSeedData();
    const baseloads = getApplicationFeaturesForPortfolio(database, "CUS00-0", "baseloads");
    const classic = getApplicationFeaturesForPortfolio(database, "CUS00-0", "classic");
    const modern = getApplicationFeaturesForPortfolio(database, "CUS00-0", "modern");

    assert.deepEqual(
      classic.features.map((feature) => feature.feature_id),
      baseloads.features.map((feature) => feature.feature_id),
    );
    assert.deepEqual(
      modern.features.map((feature) => feature.feature_id),
      baseloads.features.map((feature) => feature.feature_id),
    );
  });

  it("detects Peaks.Modern portfolio", () => {
    assert.equal(isPeaksModernPortfolio(createPocSeedData(), "CUS02-0"), true);
  });

  it("detects Peaks.Classic portfolio", () => {
    assert.equal(isPeaksClassicPortfolio(createPocSeedData(), "CUS01-0"), true);
  });

  it("global navigation uses generic labels without perspective suffixes", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS02-0", perspective_id: "modern" });

    assert.match(html, /Hedge Baseload/);
    assert.match(html, /Portfolio Details/);
    assert.match(html, /Forecast/);
    assert.doesNotMatch(html, /Calloff List - Baseloads/);
    assert.doesNotMatch(html, /Calloff List - Modern/);
  });

  it("legacy active feature aliases still resolve into the generic calloff list", () => {
    const database = createPocSeedData();

    assert.equal(resolveActiveFeature(database, "CUS00-0", "calloff-list"), "calloff-list");
    const html = renderHedgingTool(database, { portfolio_id: "CUS00-0", feature_id: "modern-calloff-transaction-list" });
    assert.match(html, /Calloff List/);
    assert.match(html, /selected/);
  });

  it("shared feature remains active when switching application variant", () => {
    assert.equal(resolveActiveFeature(createPocSeedData(), "CUS02-0", "portfolio-details"), "portfolio-details");
  });

  it("uses one visible application context across perspective choices", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS02-0" });

    assert.match(html, /variant-neutral/);
    assert.match(html, /one canonical portfolio/);
  });

  it("declares feature-level perspective options", () => {
    assert.deepEqual(
      getPerspectiveOptions().map((option) => option.label),
      ["Baseloads", "Classic", "Modern"],
    );
    assert.deepEqual(
      getDataViewerPerspectiveOptions().map((option) => option.label),
      ["Canonical", "Baseloads", "Classic", "Modern"],
    );
  });

  it("parses perspective ids with portfolio-derived fallback", () => {
    const database = createPocSeedData();

    assert.equal(defaultPerspectiveForPortfolio(database, "CUS02-0"), "modern");
    assert.equal(parsePerspectiveId("classic", "modern"), "classic");
    assert.equal(parsePerspectiveId("unknown", "modern"), "modern");
  });
});
