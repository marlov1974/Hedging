import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import { getAvailableFeaturesForPortfolio, getPortfolioOptions } from "../../src/hedging/features.ts";

describe("hedging tool shell", () => {
  it("renders one demo portfolio summary without a portfolio selector", () => {
    const html = renderHedgingTool(createPocSeedData());

    assert.match(html, /Baseloads Portfolio/);
    assert.match(html, /one canonical portfolio/);
    assert.doesNotMatch(html, /Select portfolio/);
    assert.doesNotMatch(html, /name="portfolio_id" onchange/);
  });

  it("large Hedging Tool heading and subtitle are no longer rendered", () => {
    const html = renderHedgingTool(createPocSeedData());

    assert.doesNotMatch(html, /<h1>Hedging Tool<\/h1>/);
    assert.doesNotMatch(html, /Portfolio based hedging workflow prototype/);
  });

  it("selecting a portfolio exposes feature navigation", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0" });

    assert.match(html, /Feature navigation/);
    assert.match(html, /Forecast/);
    assert.match(html, /Hedge Forecast/);
    assert.match(html, /Calloff List/);
    assert.match(html, /Position Report/);
    assert.match(html, /Position/);
    assert.match(html, /Data Viewer/);
    assert.match(html, /Hedge Baseload/);
    assert.doesNotMatch(html, /Calloff List - Baseloads/);
    assert.doesNotMatch(html, /<label>\s*Perspective/);
  });

  it("top area omits selectors and inline detail grid", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0", feature_id: "buy-baseloads" });

    assert.match(html, /class="demo-summary"/);
    assert.doesNotMatch(html, /<span>Customer<\/span>/);
    assert.doesNotMatch(html, /<span>Product<\/span>/);
    assert.doesNotMatch(html, /name="perspective_id" onchange/);
  });

  it("omits duplicated selected portfolio text and visual Open control", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0", feature_id: "portfolio-details" });

    assert.doesNotMatch(html, /class="selected-name"/);
    assert.doesNotMatch(html, />Open<\/button>/);
  });

  it("shows selected portfolio context", () => {
    const database = createPocSeedData();
    const portfolio = getPortfolioOptions(database).find((option) => option.portfolio_id === "CUS00-0");

    assert.equal(portfolio?.customer_number, "CUS00");
    assert.equal(portfolio?.price_area, "SE3");
    assert.equal(portfolio?.product_configuration_name, "Baseloads");
  });

  it("Buy Baseloads feature is available for Baseloads portfolio", () => {
    const features = getAvailableFeaturesForPortfolio(createPocSeedData(), "CUS00-0");

    assert.equal(features.find((feature) => feature.feature_id === "buy-baseloads")?.available, true);
  });

  it("Hedge Baseload remains a generic feature in the single demo application", () => {
    const features = getAvailableFeaturesForPortfolio(createPocSeedData(), "CUS02-0", "modern");

    const feature = features.find((candidate) => candidate.feature_id === "buy-baseloads");
    assert.equal(feature?.available, true);
  });

  it("generic Calloff List feature is available", () => {
    const features = getAvailableFeaturesForPortfolio(createPocSeedData(), "CUS00-0");

    assert.equal(features.find((feature) => feature.feature_id === "calloff-list")?.available, true);
  });

  it("feature menu excludes legacy Financial Settlement from the main P0035 list", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0" });

    assert.match(html, /Portfolio Details/);
    assert.match(html, /Position Report/);
    assert.doesNotMatch(html, /Financial Settlement/);
  });

  it("feature-level perspective tabs keep the single demo portfolio in links", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS00-0",
      feature_id: "forecast",
      perspective_id: "classic",
    });

    assert.match(html, /Feature perspective/);
    assert.match(html, /portfolio_id=CUS00-0&amp;feature_id=forecast&amp;perspective_id=classic/);
  });

  it("requested non-demo portfolio does not switch the shell dataset", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "CUS02-0",
      feature_id: "portfolio-details",
    });

    assert.match(html, /Baseloads Portfolio/);
    assert.doesNotMatch(html, /PeaksModern Portfolio/);
  });

  it("Forecast, Calloff List, Position Report and Position expose Baseloads, Classic and Modern tabs", () => {
    for (const feature_id of ["forecast", "calloff-list", "position-report", "position"] as const) {
      const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0", feature_id });

      assert.match(html, /Feature perspective/);
      assert.match(html, /Baseloads/);
      assert.match(html, /Classic/);
      assert.match(html, /Modern/);
    }
  });

  it("Hedge Forecast exposes Classic and Modern tabs only", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0", feature_id: "forecast-hedge" });

    assert.match(html, /Feature perspective/);
    assert.match(html, /Classic/);
    assert.match(html, /Modern/);
    assert.doesNotMatch(html, /<a class="tab[^"]*" href="[^"]*perspective_id=baseloads/);
  });

  it("Data Viewer exposes Canonical, Baseloads, Classic and Modern tabs", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0", feature_id: "data-viewer" });

    assert.match(html, /Data Viewer perspective/);
    assert.match(html, /Canonical/);
    assert.match(html, /Baseloads/);
    assert.match(html, /Classic/);
    assert.match(html, /Modern/);
  });

  it("Hedge Baseload has no feature-level perspective selector", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "CUS00-0", feature_id: "buy-baseloads" });

    assert.doesNotMatch(html, /Feature perspective/);
  });
});
