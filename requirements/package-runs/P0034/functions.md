# P0034 Function Design

## New or changed functions

- `getPerspectiveOptions`
  - Purpose: returns the visible demo perspectives.
  - Inputs: none.
  - Outputs: perspective option list.
  - Side effects: none.
  - Tests: application configuration and shell tests.

- `parsePerspectiveId`
  - Purpose: normalize URL/form perspective input.
  - Inputs: raw string.
  - Outputs: `PerspectiveId`.
  - Side effects: none.
  - Tests: application configuration tests.

- `defaultPerspectiveForPortfolio`
  - Purpose: preserve compatibility by choosing a default perspective from the portfolio product package.
  - Inputs: database, optional portfolio id.
  - Outputs: `PerspectiveId`.
  - Side effects: none.
  - Tests: application configuration tests.

- `getApplicationFeaturesForPortfolio`
  - Purpose: changed from product-package feature locking to perspective-driven feature matrix.
  - Inputs: database, optional portfolio id, optional perspective id.
  - Outputs: application config.
  - Side effects: none.
  - Tests: application configuration and hedging tool tests.

- `resolveActiveFeature`
  - Purpose: changed to resolve active feature within selected perspective.
  - Inputs: database, optional portfolio id, requested feature id, optional perspective id.
  - Outputs: feature id.
  - Side effects: none.
  - Tests: application configuration tests.

- `getDataViewerTables`
  - Purpose: extended with canonical/raw and projected perspective table choices.
  - Inputs: none.
  - Outputs: table options.
  - Side effects: none.
  - Tests: Data Viewer tests.

- `getBaseloadsProjectedTransactionsForPortfolioYear`
  - Purpose: derived base-only transaction view for Baseloads perspective.
  - Inputs: database, portfolio id, year.
  - Outputs: projected rows.
  - Side effects: none.
  - Tests: Data Viewer tests.

- `getClassicProjectedTransactionsForPortfolioYear`
  - Purpose: derived Classic offpeak/peak transaction view from canonical rows.
  - Inputs: database, portfolio id, year.
  - Outputs: projected rows.
  - Side effects: none.
  - Tests: Data Viewer tests.

- `getPeaksClassicCalloffTransactionRows` and `getPeaksModernCalloffTransactionRows`
  - Purpose: changed to project compatible canonical calloffs by calloff product package, not portfolio product package.
  - Inputs: database, portfolio id.
  - Outputs: projection rows.
  - Side effects: none.
  - Tests: calloff projection tests.

## Removed functions

None.
