# P0043 function design

## New exported contracts

### `getClassicProjectedModelRowsForPortfolio`

Purpose: return Classic projected model transaction rows for all Peaks calloffs in a portfolio.
Inputs: database, portfolio id.
Outputs: projected transaction rows.
Side effects: none.
Reason: shared basis for Classic Data Viewer, Calloff List and Position Report.

### `getModernProjectedModelRowsForPortfolio`

Purpose: return Modern projected model transaction rows for all Peaks calloffs in a portfolio.
Inputs: database, portfolio id.
Outputs: projected transaction rows.
Side effects: none.
Reason: shared basis for Modern Data Viewer, Calloff List and Position Report.

### `getClassicProjectedModelRowsForPortfolioYear`

Purpose: year-filtered Classic projected model rows.
Inputs: database, portfolio id, delivery year.
Outputs: projected transaction rows.
Side effects: none.
Tests: Data Viewer and Position Report tests.

### `getModernProjectedModelRowsForPortfolioYear`

Purpose: year-filtered Modern projected model rows.
Inputs: database, portfolio id, delivery year.
Outputs: projected transaction rows.
Side effects: none.
Tests: Data Viewer and Position Report tests.

### `buildClassicPositionReportRowsFromProjectedModelRows`

Purpose: aggregate Classic projected model rows into monthly Position Report rows.
Inputs: projected rows.
Outputs: Classic position rows.
Side effects: none.
Tests: synthetic projected-row test proves the report can consume projected model rows.

### `buildModernPositionReportRowsFromProjectedModelRows`

Purpose: aggregate Modern projected model rows into monthly Position Report rows.
Inputs: projected rows.
Outputs: Modern position rows.
Side effects: none.
Tests: synthetic projected-row test proves the report can consume projected model rows.

## Changed functions

### `getPeaksClassicCalloffTransactionRows`

Change: aggregate Classic calloff rows from Classic projected model rows.

### `getPeaksModernCalloffTransactionRows`

Change: aggregate Modern calloff rows from Modern projected model rows.

### `getClassicProjectedTransactionsForPortfolioYear`

Change: delegate to shared Classic projected model rows.

### `getModernProjectedTransactionsForPortfolioYear`

Change: delegate to shared Modern projected model rows.

### `getClassicPositionReportRows`

Change: get Classic projected model rows and pass them to the report builder.

### `getModernPositionReportRows`

Change: get Modern projected model rows and pass them to the report builder.
