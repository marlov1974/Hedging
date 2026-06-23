# P0030 Function Design

## Changed Functions

### `getPeaksClassicCalloffTransactionRows`

- Change: return customer rows with `offpeak_mwh` and `peak_mwh` instead of customer-facing MW fields.
- Inputs: database, portfolio id.
- Outputs: calloff-level Classic customer rows.
- Side effects: none.
- Tests: Classic columns and one-month MWh example.

### `getPeaksModernCalloffTransactionRows`

- Change: return customer rows with `base_mwh` and `peak_mwh` instead of customer-facing MW fields.
- Inputs: database, portfolio id.
- Outputs: calloff-level Modern customer rows.
- Side effects: none.
- Tests: Modern columns, one-month MWh example and negative PeakMWh.

### `aggregateClassicProjection`

- Change: sum monthly Classic MWh and value-weight prices by MWh.
- Inputs: monthly projection rows.
- Outputs: aggregated Classic MWh and price values.
- Side effects: none.
- Tests: multi-month aggregation.

### `aggregateModernProjection`

- Change: sum monthly Modern MWh and value-weight prices by MWh.
- Inputs: monthly projection rows.
- Outputs: aggregated Modern MWh and price values.
- Side effects: none.
- Tests: multi-month aggregation and negative PeakMWh.

### `renderClassicCalloffTransactionList`

- Change: render `OffpeakMWh` and `PeakMWh`.
- Tests: UI column order tests.

### `renderModernCalloffTransactionList`

- Change: render `BaseMWh` and `PeakMWh`.
- Tests: UI column order tests.
