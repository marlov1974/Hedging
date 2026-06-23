# P0031 Function Design

## Changed Functions

### `getDataViewerTables`

- Add Modern projection table options.

### `getDataViewerYears`

- Include delivery years for Modern projection views.

### `getDataViewerRows`

- Route Modern table ids to projection row builders.

### `parseDataViewerTableId`

- Accept `modern-calloffs` and `modern-transactions`.

### `renderDataViewerRows`

- Render the two new row types.

## New Functions

### `getModernCalloffsForPortfolioYear`

- Purpose: return calloff-scoped Modern projection rows for Peaks calloffs.
- Inputs: database, portfolio id, year.
- Outputs: Modern calloff projection rows.
- Side effects: none.

### `getModernTransactionsForPortfolioYear`

- Purpose: return Base/Peak projected transaction rows for Peaks calloffs.
- Inputs: database, portfolio id, year.
- Outputs: Modern transaction projection rows.
- Side effects: none.
