# P0042 value unit views functions

## New functions

### `getTransactionViewEconomics`

- File: `src/hedging/viewEconomics.ts`
- Purpose: Return normalized stored fields plus derived power/currency economics for one transaction.
- Inputs: database and customer transaction.
- Outputs: component metadata, period, quantity/price/factor fields, hours, MWh, EUR/SEK values.
- Side effects: None.
- Test coverage: Data Viewer tests.

### `getCalloffCurrencyCoverage`

- File: `src/hedging/viewEconomics.ts`
- Purpose: Calculate FX coverage for a calloff/month or whole calloff from `currency.eursek` rows.
- Inputs: database, calloff, scoped transactions and power EUR value.
- Outputs: FX rate, covered EUR, SEK value, coverage percentage and warnings.
- Side effects: None.
- Test coverage: calloff-list and position-report tests.

### `applyDisplayCurrency`

- File: `src/hedging/viewEconomics.ts`
- Purpose: Convert value/price display fields to SEK for SEK portfolios when currency coverage exists.
- Inputs: database, calloff, scoped transactions, value EUR and MWh denominator.
- Outputs: display currency, display value, display price, FX/coverage details and warnings.
- Side effects: None.
- Test coverage: calloff-list and position-report tests.

## Changed functions

### `getRawTransactionsForPortfolioYear`

- File: `src/hedging/dataViewer.ts`
- Change: Include normalized source fields and derived fields with explicit units.

### `getModernProjectedTransactionsForPortfolioYear`

- File: `src/hedging/dataViewer.ts`
- Change: Include `currency.eursek` rows as currency rows, not projected modern power rows.

### `getDataViewerTables`

- File: `src/hedging/dataViewer.ts`
- Change: Add Classic Projected Transactions table.

### `projectPeaksCalloffMonth`

- File: `src/hedging/peaksCalloffTransactionList.ts`
- Change: Carry calloff display currency values and coverage warnings from scoped currency rows.

### `getClassicPositionReportRows` / `getModernPositionReportRows`

- File: `src/hedging/positionReport.ts`
- Change: Aggregate projected values with currency coverage and display SEK values for SEK portfolios.

### `renderDataViewerRows`, calloff-list renderers and position report renderers

- File: `src/hedging/HedgingToolView.ts`
- Change: Render normalized/unit fields, display currency fields and coverage warnings.

## Removed functions

None.
