# P0022 function design

## New functions

### `getForecastHedgeMonthRange`

Purpose: Return inclusive `YYYY-MM` month range after validating start and end month.
Inputs: start month, end month.
Outputs: ordered month strings.
Side effects: none.
Tests: range generation and invalid month/end-before-start through profile tests.

### `buildForecastHedgeProfile`

Purpose: Build monthly hedge rows from forecast MWh, selected percentage and calendar total hours.
Inputs: database, portfolio id, start month, end month, percentage.
Outputs: profile input summary and rows.
Side effects: none.
Tests: row count, hedge MWh formula, hedge MW formula, missing forecast/calendar, invalid percentage and non-PeaksModern portfolio.

### `updateForecastHedgeProfileRow`

Purpose: Recalculate a single row after Hedge MWh editing.
Inputs: month, forecast MWh, calendar total hours, Hedge MWh.
Outputs: derived Hedge MW and Hedge % values.
Side effects: none.
Tests: editing Hedge MWh recalculates Hedge MW and Hedge %.

### `acceptForecastHedgeProfile`

Purpose: Validate posted profile rows and create one calloff plus base transactions.
Inputs: database, portfolio id, start month, end month, percentage, rows and optional deterministic date/calloff id.
Outputs: calloff and transactions.
Side effects: inserts calloff and transactions.
Tests: creates exactly one calloff, two transactions per month, q_factor values, validation failures.

### `createForecastHedgeCalloff`

Purpose: Insert one PeaksModern calloff.
Inputs: database, portfolio id, date and optional calloff id.
Outputs: calloff.
Side effects: inserts calloff.
Tests: covered by accept behavior.

### `createForecastHedgeTransactions`

Purpose: Insert base.sys and base.epad transactions for each profile row.
Inputs: database, calloff and profile rows.
Outputs: transactions.
Side effects: inserts transactions.
Tests: covered by accept transaction count and q_factor assertions.
