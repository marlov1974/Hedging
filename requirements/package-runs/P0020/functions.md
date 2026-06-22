# P0020 function design

## New functions

- `getFinancialSettlementMonths(database, portfolioId)`
  - Purpose: return available settlement months for the selected portfolio.
  - Inputs: database and portfolio id.
  - Outputs: sorted month strings.
  - Side effects: none.
  - Tests: month dropdown and helper tests.

- `calculateFinancialSettlementForMonth(database, portfolioId, month)`
  - Purpose: calculate monthly Baseloads financial settlement rows.
  - Inputs: database, portfolio id and month.
  - Outputs: settlement rows plus spot actual metadata.
  - Side effects: throws clear errors for missing spot actuals or calendar/price data.
  - Tests: formula, spot usage, empty-state and error tests.

- `combineSysAndEpadHedgePrice(database, transactions)`
  - Purpose: combine paired `base.sys` and `base.epad` transaction prices into one hedge exposure.
  - Inputs: database and customer transactions.
  - Outputs: hedge volume MWh, combined hedge price, component ids and derivative name.
  - Side effects: throws clear errors for missing calendar or price data.
  - Tests: volume and hedge-price tests.

- `getMonthlySpotActualForSettlement(month)`
  - Purpose: return monthly average spot actual for settlement.
  - Inputs: month.
  - Outputs: spot price and source row.
  - Side effects: throws clear error when missing.
  - Tests: monthly average and missing actual tests.

## Changed functions

- `getAvailableFeaturesForPortfolio`
  - Change: includes `financial-settlement`.
  - Tests: feature menu includes Financial Settlement.

- `renderHedgingTool`
  - Change: renders the new feature and removes duplicated/visual UI objects.
  - Tests: shell and Financial Settlement UI tests.

- `readStateFromUrl`
  - Change: reads `selected_month`.
  - Tests: covered through rendered links/forms.
