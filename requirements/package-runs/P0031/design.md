# P0031 Design

## Implementation Structure

1. Extend `DataViewerTableId` with `modern-calloffs` and `modern-transactions`.
2. Add projection row types for Modern calloffs and Modern transactions.
3. Build projected rows from Peaks calloffs by calling `projectPeaksCalloffMonth`.
4. Aggregate per calloff:
   - Modern Calloffs: one row per calloff with canonical/projected total values.
   - Modern Transactions: two rows per calloff, `base` and `peak`, with MWh, price and value.
5. Render the two new table shapes in `HedgingToolView`.
6. Update docs, tests and file index.

## Data Rules

- Projection year is delivery start year.
- Allocation rows are not shown directly in Modern projected rows.
- Raw `Transactions` remains the source view for canonical MW rows.
- Projected values should preserve canonical total value.

## Test Strategy

- Assert table selector includes `Modern Calloffs` and `Modern Transactions`.
- Assert `modern-calloffs` projects a Peaks.Classic calloff to `Peaks.Modern`.
- Assert `modern-transactions` returns Base/Peak rows with MWh and hides allocation rows.
- Assert raw `Transactions` still shows canonical MW.
- Run full test suite.
