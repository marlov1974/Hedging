# P0017 function design

## New functions

### `getPortfolioOptions(database)`

- Purpose: return portfolio choices with customer and product context.
- Inputs: database.
- Output: `PortfolioOption[]`.
- Side effects: none.
- Test coverage: portfolio selector rendering.

### `getAvailableFeaturesForPortfolio(database, portfolioId)`

- Purpose: return feature availability for the active portfolio.
- Inputs: database and optional portfolio id.
- Output: feature descriptors.
- Side effects: none.
- Test coverage: Baseloads and non-Baseloads availability.

### `getBaseloadsCalloffListRows(database, portfolioId)`

- Purpose: return component-split Baseloads calloff rows.
- Inputs: database and portfolio id.
- Output: `BaseloadsCalloffListRow[]`.
- Side effects: none.
- Test coverage: empty state and quarter calloff row aggregation.

### `formatDerivativeName(component, months, priceArea)`

- Purpose: format deterministic market-style instrument names.
- Inputs: component code, contiguous months and price area.
- Output: display string.
- Side effects: none.
- Test coverage: monthly, quarterly and yearly names.

### `calculateComponentMwh(database, transactions)`

- Purpose: aggregate transaction MW to MWh using monthly total hours.
- Inputs: database and transactions for one component/calloff.
- Output: MWh number.
- Side effects: none.
- Test coverage: quarter calloff MWh.

### `calculateWeightedAveragePrice(database, transactions)`

- Purpose: calculate weighted average price using linked Price Component prices.
- Inputs: database and transactions for one component/calloff.
- Output: price number.
- Side effects: none.
- Test coverage: weighted price calculation.

### `renderHedgingTool(database, state)`

- Purpose: render portfolio selector, feature navigation and active feature panel.
- Inputs: database and UI state.
- Output: HTML string.
- Side effects: none.
- Test coverage: selector, feature navigation, not-available and column rendering.

### `createHedgingToolServer(database)`

- Purpose: serve the hedging tool shell and handle Baseloads purchases.
- Inputs: optional database.
- Output: Node HTTP server.
- Side effects: network listener when caller starts it.
- Test coverage: renderer and business logic are tested directly.

## Changed functions

None.

## Removed functions

None.
