# P0028 Function Design

## Changed Functions

### `canonicalComponentCode`

- Purpose: normalize deprecated component aliases.
- Change: keep existing peak aliases; do not expand `allocation.peak` because a string function cannot return both split targets.
- Reason: split allocation compatibility is contextual and handled by readers/generators.

### `getComponentMetadata`

- Purpose: return category and hour basis for component codes.
- Change: add metadata for `allocation.peak.sys` and `allocation.peak.epad`.
- Tests: seed-data component category/hour-basis tests.

### `createPocSeedData`

- Purpose: create deterministic synthetic product configurations, prices and q-factors.
- Change: seed split allocation components for Peaks.Classic, Peaks.Modern and Profiles.Modern.
- Tests: seed-data tests for product components, price zero and q-factor zero.

### `createForecastHedgeTransactions`

- Purpose: create monthly forecast hedge transaction rows.
- Change: creates six rows per month by using split allocation components.
- Tests: Forecast Hedge accept tests.

### `transactionMwForComponent`

- Purpose: map forecast hedge profile rows to transaction MW by component.
- Change: returns `allocation_peak_mw` for both split allocation components and old unsuffixed allocation compatibility rows.
- Tests: Forecast Hedge MW/q-factor tests.

### `projectLegacyCalloffMonth`

- Purpose: project canonical monthly Peaks.Classic rows into legacy Peak/Offpeak rows.
- Change: reads split allocation rows, warns on sys/epad mismatch, and falls back to unsuffixed `allocation.peak` when no split rows exist.
- Tests: Legacy Calloff List split, mismatch and alias tests.

## New Helper Functions

### `selectAllocationPeakMw`

- Purpose: derive one effective customer allocation peak MW from split or legacy rows.
- Inputs: database, monthly transactions, warnings.
- Output: `{ mw: number | null }`.
- Side effects: appends data-quality warnings.
- Tests: Legacy Calloff List tests.

## Removed Functions

None.
