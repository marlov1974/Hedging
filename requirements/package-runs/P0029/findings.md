# P0029 Findings

## Result

Implemented.

## Notes

- Classic and Modern transaction lists now use `src/hedging/peaksCalloffTransactionList.ts` as the shared projection engine.
- Classic projects canonical rows to `Date`, `OffpeakMW`, `PeakMW`, `OffpeakPrice`, `PeakPrice`.
- Modern projects canonical rows to `Date`, `BaseMW`, `PeakMW`, `BasePrice`, `PeakPrice`.
- Modern `BaseMW` and `PeakMW` are projected customer values, not raw `base.sys.mw` or `peak.sys.mw`.
- Allocation and adjustment rows are not displayed directly in customer-facing transaction lists.
- Existing `legacyCalloffList` exports are compatibility wrappers over the shared projection engine.
- The P0029 worked example text states ModernPeakPrice is approximately `97.925`, but the package formula produces `97.537634`. Implementation and tests follow the formula and preserve `CanonicalTotalValue`.

## Verification

```text
npm test
219 tests, 20 suites, 219 pass, 0 fail
```
