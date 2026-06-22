# P0018 function design

## New functions

### `getPortfolioDetails(database, portfolioId)`

- Purpose: return selected portfolio details for display.
- Inputs: database and portfolio id.
- Output: portfolio detail object or undefined.
- Side effects: none.
- Test coverage: portfolio detail feature tests.

### `getPositionReportYears(database, portfolioId)`

- Purpose: return years available for the selected portfolio position report.
- Inputs: database and portfolio id.
- Output: sorted year strings.
- Side effects: none.
- Test coverage: year dropdown tests.

### `getPositionReportRows(database, portfolioId, year)`

- Purpose: aggregate monthly component position rows.
- Inputs: database, portfolio id and selected year.
- Output: sorted rows.
- Side effects: none.
- Test coverage: month/component aggregation, empty state, volume and price.

### `calculateMonthlyComponentPosition(database, transactions)`

- Purpose: calculate one monthly component position row from transactions.
- Inputs: database and same-month/same-component transactions.
- Output: volume and weighted price.
- Side effects: none.
- Test coverage: position report row tests.

## Changed functions

### `getAvailableFeaturesForPortfolio(database, portfolioId)`

- Change: add `Portfolio Details` and `Position Report`.

### `renderHedgingTool(database, state)`

- Change: compact layout, new features, year dropdown and calloff-list column update.

## Removed functions

None.
