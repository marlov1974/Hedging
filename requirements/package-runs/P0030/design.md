# P0030 Design

## Package Interpretation

Fix Peaks customer-facing calloff transaction lists to display MWh columns instead of MW columns.

Classic list:

```text
Date | OffpeakMWh | PeakMWh | OffpeakPrice | PeakPrice
```

Modern list:

```text
Date | BaseMWh | PeakMWh | BasePrice | PeakPrice
```

## Implementation Structure

1. Keep `projectPeaksCalloffMonth` internal MW calculations unchanged.
2. Change aggregated Classic and Modern row output types to expose aggregated MWh fields for customer list rendering.
3. Aggregate MWh by summing monthly MWh, not by averaging MW.
4. Keep price aggregation value-weighted by MWh.
5. Update UI column labels and cells.
6. Update P0029/P0030 docs to state that customer calloff lists show MWh while MW is internal support.
7. Update tests for columns, one-month examples, negative Modern PeakMWh and multi-month MWh aggregation.

## Test Strategy

- Update P0029 transaction list tests to assert MWh column names and values.
- Keep value-preservation assertions.
- Keep raw Data Viewer and hidden allocation/adjustment assertions.
- Run full `npm test`, `git diff --check` and file-index verification.

## Risks

- Modern has both canonical `peak_mw` and projected `peak_mwh` concepts. Field names must make customer-facing MWh unambiguous.
- The P0030 worked example repeats the P0029 ModernPeakPrice approximation; implementation should continue following the residual formula.
