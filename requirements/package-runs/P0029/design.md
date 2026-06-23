# P0029 Design

## Package Interpretation

Build customer-facing calloff transaction lists as projections from canonical rows:

- Peaks.Classic: one calloff row with `Date`, `OffpeakMW`, `PeakMW`, `OffpeakPrice`, `PeakPrice`.
- Peaks.Modern: one calloff row with `Date`, `BaseMW`, `PeakMW`, `BasePrice`, `PeakPrice`.

Both preserve canonical total value and do not display allocation rows directly.

## Implementation Structure

1. Add a shared `peaksCalloffTransactionList` module.
2. Read effective canonical `B`, `A`, and `P` from sys/epad component pairs with warnings on mismatch.
3. Calculate canonical prices, canonical values, Classic projection and Modern projection per month.
4. Aggregate monthly projections to one row per calloff using hour/value weighting.
5. Wire Classic and Modern feature gating and rendering.
6. Keep the old `legacyCalloffList` exports as compatibility wrappers over the shared projection engine where practical.
7. Add docs for Classic, Modern and shared projection rules.

## Test Strategy

- Add focused projection tests for Classic and Modern formulas, value preservation, negative Modern Peak, mismatch warnings, alias reads and multi-month aggregation.
- Update UI tests for required columns and feature availability.
- Run the full `npm test`, `git diff --check`, and file-index verification.

## Deliberate Non-Goals

- No market projection changes.
- No settlement changes.
- No Profiles projection work.
- No pricing provider work.
