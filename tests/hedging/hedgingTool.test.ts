import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import { getAvailableFeaturesForPortfolio, getPortfolioOptions } from "../../src/hedging/features.ts";

describe("hedging tool shell", () => {
  it("renders portfolio selector", () => {
    const html = renderHedgingTool(createPocSeedData());

    assert.match(html, /Hedging Tool/);
    assert.match(html, /Select portfolio/);
    assert.match(html, /PORT_BASELOADS/);
  });

  it("selecting a portfolio exposes feature navigation", () => {
    const html = renderHedgingTool(createPocSeedData(), { portfolio_id: "PORT_BASELOADS" });

    assert.match(html, /Feature navigation/);
    assert.match(html, /Buy Baseloads/);
    assert.match(html, /Baseloads Calloff List/);
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

  it("Buy Baseloads feature is unavailable for non-Baseloads portfolio", () => {
    const features = getAvailableFeaturesForPortfolio(createPocSeedData(), "PORT_PEAKS_CLASSIC");

    const feature = features.find((candidate) => candidate.feature_id === "buy-baseloads");
    assert.equal(feature?.available, false);
    assert.match(feature?.unavailable_reason ?? "", /not linked to Baseloads/);
  });

  it("Baseloads Calloff List feature is available for Baseloads portfolio", () => {
    const features = getAvailableFeaturesForPortfolio(createPocSeedData(), "PORT_BASELOADS");

    assert.equal(features.find((feature) => feature.feature_id === "baseloads-calloff-list")?.available, true);
  });

  it("non-Baseloads selected portfolio shows clear unavailable message", () => {
    const html = renderHedgingTool(createPocSeedData(), {
      portfolio_id: "PORT_PEAKS_CLASSIC",
      feature_id: "buy-baseloads",
    });

    assert.match(html, /Selected portfolio is not linked to Baseloads/);
  });
});
