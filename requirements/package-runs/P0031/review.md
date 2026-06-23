# P0031 Review

## Consistency Result

PASS.

## Evidence

- `Data Viewer` currently has raw `calloffs` and `transactions` table ids only.
- P0029/P0030 added shared Peaks projection logic in `peaksCalloffTransactionList.ts`.
- The raw `Transactions` view intentionally shows canonical MW rows, so the new Modern projection views should be additive.

## Assumptions

- Modern projection views apply to Peaks canonical calloffs, including both Peaks.Classic and Peaks.Modern portfolios.
- Non-Peaks portfolios can select the new views but will see no projection rows.
- `Modern Transactions` is shown as projected Base/Peak rows with MWh, price and value.
