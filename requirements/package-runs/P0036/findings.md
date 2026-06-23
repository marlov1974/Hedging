# P0036 Findings

## Result

Implemented.

## Scope Delivered

- Added Classic Forecast UI fields for `Offpeak MWh` and `Peak MWh`.
- Added Classic Hedge Forecast proposal and accept flow.
- Kept forecast storage in the existing `mwh` and `peak_pct` shape.
- Kept hedge persistence canonical; no `classic.*` transactions are written.
- Classic Hedge Forecast accept writes `allocation.peak.*`, `base.*` and `peak.*` canonical rows.
- Classic calloff projection can display the accepted hedge as customer-facing MWh rows.

## Verification

```text
npm test
256 tests passed
```

## File Index

Tracked files were added for Classic projection source, tests, docs and P0036 package-run evidence. `REPOSITORY_FILES.md` was updated in this package.

## Knowhow

No knowhow promotion was created. This package did not include live debugging, production runtime anomalies or reusable operational discoveries outside the P0036 model conversion rules documented under `docs/hedging/`.
