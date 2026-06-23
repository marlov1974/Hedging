import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import { getAvailableFeaturesForPortfolio, getPortfolioOptions } from "../../src/hedging/features.ts";

describe("hedging tool shell", () => {
  it("renders portfolio selector", () => {
    const html = renderHedgingTool(createPocSeedData());

    assert.match(html, /Select portfolio/);
    assert.match(html, /PORT_BASELOADS/);
  });

  it("large Hedging Tool heading and subtitle are no longer rendered", () => {
    const html = renderHedgingTool(createPocSeedData());

    assert.doesNotMatch(html, /<h1>Hedging Tool<\/h1>/);
    assert.doesNotMatch(html, /Portfolio based hedging workflow prototype/);
  });

  it("selecting a portfolio exposes feature navigation", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "PORT_BASELOADS" });

    assert.match(html, /Feature navigation/);
    assert.match(html, /Buy Baseloads/);
    assert.match(html, /Baseloads Calloff List/);
  });

  it("top portfolio selector stays compact and omits inline details", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "PORT_BASELOADS", feature_id: "buy-baseloads" });

    assert.match(html, /class="compact-selector"/);
    assert.doesNotMatch(html, /<span>Customer<\/span>/);
    assert.doesNotMatch(html, /<span>Product<\/span>/);
  });

  it("omits duplicated selected portfolio text and visual Open control", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "PORT_BASELOADS", feature_id: "portfolio-details" });

    assert.doesNotMatch(html, /class="selected-name"/);
    assert.doesNotMatch(html, />Open<\/button>/);
  });

  it("shows selected portfolio context", () => {
    const database = createPocSeedData();
    const portfolio = getPortfolioOptions(database).find((option) => option.portfolio_id === "PORT_BASELOADS");

    assert.equal(portfolio?.customer_number, "CN_BASELOADS");
    assert.equal(portfolio?.price_area, "SE3");
    assert.equal(portfolio?.product_configuration_name, "Baseloads");
  });

  it("Buy Baseloads feature is available for Baseloads portfolio", () => {
    const features = getAvailableFeaturesForPortfolio(createPocSeedData(), "PORT_BASELOADS");

    assert.equal(features.find((feature) => feature.feature_id === "buy-baseloads")?.available, true);
  });

  it("Buy Baseloads feature is not part of PeaksModern application", () => {
    const features = getAvailableFeaturesForPortfolio(createPocSeedData(), "PORT_PEAKS_MODERN");

    const feature = features.find((candidate) => candidate.feature_id === "buy-baseloads");
    assert.equal(feature, undefined);
  });

  it("Baseloads Calloff List feature is available for Baseloads portfolio", () => {
    const features = getAvailableFeaturesForPortfolio(createPocSeedData(), "PORT_BASELOADS");

    assert.equal(features.find((feature) => feature.feature_id === "baseloads-calloff-list")?.available, true);
  });

  it("feature menu includes Portfolio Details, Position Report and Financial Settlement", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "PORT_BASELOADS" });

    assert.match(html, /Portfolio Details/);
    assert.match(html, /Position Report/);
    assert.match(html, /Financial Settlement/);
  });

  it("unavailable active feature resets to a valid selected portfolio feature", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "PORT_PEAKS_MODERN",
      feature_id: "buy-baseloads",
    });

    assert.match(html, /Portfolio Details/);
    assert.doesNotMatch(html, /Confirm purchase/);
  });
});
