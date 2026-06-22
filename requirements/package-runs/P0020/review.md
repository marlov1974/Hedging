# P0020 consistency review

Package: `P0020-minimal-ui-and-financial-settlement`

Result: `PASS`

## Evidence

- The hedging tool already has compact portfolio selection and feature navigation in `src/hedging/HedgingToolView.ts`.
- P0019 added `src/settlement/spotActuals.ts` with monthly static spot actual helpers.
- Baseloads purchases create paired `base.sys` and `base.epad` transactions with shared month and MW.
- Existing calloff and position report code already uses calendar `total_h` for MWh conversion.

## Scope checks

- UI cleanup is limited to the hedging tool shell.
- Financial settlement can be implemented as a new hedging feature with business logic isolated in `src/hedging/financialSettlement.ts`.
- Static spot actuals expose only `STO`, while seed portfolios use `SE3`; P0019 documented `STO` as the PoC bridge. P0020 should use that bridge for now.

## Conclusion

The package is consistent and implementable.
