# P0039 Function Design

## Changed Functions

### `getDataViewerTables`

- Purpose: expose table metadata.
- Change: add view group metadata and include `market-projection`.
- Inputs/outputs: unchanged function signature; richer row objects.
- Side effects: none.
- Tests: supported table list and group metadata tests.

### `getDataViewerYears`

- Purpose: derive selectable delivery/data years for a table.
- Change: treat `transactions` and `market-projection` as transaction-month based tables.
- Side effects: none.
- Tests: existing data-derived years plus seed years coverage.

### `getRawTransactionsForPortfolioYear`

- Purpose: expose raw canonical transactions.
- Change: add canonical component code and component concept classification.
- Side effects: none.
- Tests: raw transaction column/concept assertions.

### `getDataViewerRows`

- Purpose: dispatch table id to Data Viewer rows.
- Change: dispatch `market-projection`.
- Side effects: none.
- Tests: market/internal view excludes allocation.

### `renderDataViewer`

- Purpose: render Data Viewer shell.
- Change: add short source-of-truth/projection explanation and group description.
- Side effects: none.
- Tests: HTML copy assertions.

### `renderRawTransactionsTable`

- Purpose: render raw transaction rows.
- Change: include component and component concept columns.
- Side effects: none.
- Tests: HTML/raw row assertions.

## New Functions

### `getMarketProjectionRowsForPortfolioYear`

- Purpose: return Data Viewer market/internal rows for one portfolio/year.
- Inputs: database, portfolio id, year.
- Output: rows with transaction id, month, component, component concept, market MW, market MWh and dimension note.
- Side effects: none.
- Tests: allocation exclusion and non-additive dimension note.

### `renderMarketProjectionTable`

- Purpose: render market/internal projection rows.
- Inputs: market projection rows.
- Output: HTML table.
- Side effects: none.
- Tests: covered through Data Viewer render tests and row tests.
