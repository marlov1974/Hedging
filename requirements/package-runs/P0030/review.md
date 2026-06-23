# P0030 Review

## Consistency Result

PASS.

## Evidence

- `src/hedging/peaksCalloffTransactionList.ts` already calculates monthly Classic and Modern MWh values and value-preserving prices.
- Aggregated P0029 rows currently expose `offpeak_mw`, `peak_mw`, `base_mw` and `peak_mw` as customer row fields.
- `src/hedging/HedgingToolView.ts` currently renders `OffpeakMW`, `PeakMW`, `BaseMW` and `PeakMW`.
- P0030 only changes customer-facing calloff transaction list units and column names; canonical transactions and internal MW calculations remain valid.

## Assumptions

- Compatibility `legacyCalloffList` rows can continue exposing block-level MW/MWh fields for older tests because the active customer list no longer renders that legacy block table.
- `Data Viewer` remains raw and can continue showing canonical transaction MW.
