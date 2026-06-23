# P0032 Function Design

## Changed Functions

### `getDataViewerTables`

- Rename P0031 projection entries to explicit Modern Projected labels.

### `getDataViewerYears`

- Use calloff delivery start year for Modern Projected views.

### `getDataViewerRows`

- Route Modern Projected ids to the corrected projected model builders.

### `renderDataViewerRows`

- Render Modern Projected calloff and transaction tables with P0032 columns.

## New Or Reworked Functions

### `getModernProjectedTransactionsForPortfolioYear`

- Purpose: derive four Modern projected transaction rows per calloff/month from canonical component rows.
- Inputs: database, portfolio id, year.
- Outputs: projected rows with `calloff_id`, `month`, `component`, `mw`, `price`, optional value/source/warnings.
- Side effects: none.

### `getModernProjectedCalloffsForPortfolioYear`

- Purpose: aggregate Modern projected transaction rows to calloff summary rows.
- Inputs: database, portfolio id, year.
- Outputs: calloff rows with MWh, price and value fields.
- Side effects: none.

### `projectModernMonth`

- Purpose: calculate one calloff/month projection from canonical sys and epad rows.
- Inputs: database, calloff, month transactions.
- Outputs: four projected transaction rows plus warnings.
- Side effects: none.
