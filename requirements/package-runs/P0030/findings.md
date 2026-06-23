# P0030 Findings

## Result

Implemented.

## Notes

- Peaks.Classic customer list now renders `Date`, `OffpeakMWh`, `PeakMWh`, `OffpeakPrice`, `PeakPrice`.
- Peaks.Modern customer list now renders `Date`, `BaseMWh`, `PeakMWh`, `BasePrice`, `PeakPrice`.
- Internal MW calculations remain in `projectPeaksCalloffMonth` and are used only to derive MWh and residual prices.
- Multi-month calloffs sum projected MWh and value-weight prices.
- Negative Modern `PeakMWh` is allowed and displayed.
- Data Viewer remains raw and can still show canonical transaction MW.
- The P0030 worked example repeats the ModernPeakPrice approximation from P0029, but the residual formula produces `97.537634`. Implementation and tests follow the value-preserving formula.

## Verification

```text
npm test
219 tests, 20 suites, 219 pass, 0 fail
```
