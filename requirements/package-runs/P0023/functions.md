# P0023 function design

## New functions

### `getDataViewerTables`

Purpose: Return supported raw table choices.
Inputs: none.
Outputs: table id/label list.
Side effects: none.
Tests: table selector rendering and supported table behavior.

### `getDataViewerYears`

Purpose: Return selectable years for a portfolio and table.
Inputs: database, portfolio id, table id.
Outputs: sorted years.
Side effects: none.
Tests: year selector rendering and data-derived years.

### `getRawCalloffsForPortfolioYear`

Purpose: Return calloffs scoped to selected portfolio and calloff date year.
Inputs: database, portfolio id, year.
Outputs: raw calloff rows.
Side effects: none.
Tests: portfolio scoping and date-year filtering.

### `getRawTransactionsForPortfolioYear`

Purpose: Return transactions scoped through selected portfolio calloffs and transaction month year.
Inputs: database, portfolio id, year.
Outputs: raw transaction rows.
Side effects: none.
Tests: calloff-linked portfolio scoping, month-year filtering and raw columns.

### `getDataViewerRows`

Purpose: Dispatch to the selected raw table function.
Inputs: database, portfolio id, table id, year.
Outputs: typed row list.
Side effects: none.
Tests: unknown table handling and UI rows.
