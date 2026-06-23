import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPocSeedData } from "../../src/database/pocSeedData.ts";
import { renderHedgingTool } from "../../src/hedging/HedgingToolView.ts";
import { getPortfolioDetails } from "../../src/hedging/portfolioDetails.ts";

describe("Portfolio Details feature", () => {
  it("returns portfolio details", () => {
    const details = getPortfolioDetails(createPocSeedData(), "CUS00-0");

    assert.equal(details?.portfolio_name, "Baseloads Portfolio");
    assert.equal(details?.customer_number, "CUS00");
    assert.equal(details?.price_area, "SE3");
    assert.equal(details?.product_configuration_name, "Baseloads");
    assert.equal(details?.calendar_id, "CAL_SE_TRADING");
  });

  it("shows details only in Portfolio Details feature", () => {
    const database = createPocSeedData();
    const buyHtml = renderHedgingTool(database, { portfolio_id: "CUS00-0", feature_id: "buy-baseloads" });
    const detailsHtml = renderHedgingTool(database, { portfolio_id: "CUS00-0", feature_id: "portfolio-details" });

    assert.doesNotMatch(buyHtml, /<span>Calendar<\/span>/);
    assert.match(detailsHtml, /<h2>Portfolio Details<\/h2>/);
    assert.match(detailsHtml, /CAL_SE_TRADING/);
  });
});
