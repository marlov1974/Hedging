# P0029 Function Design

## New Functions

### `getPeaksClassicCalloffTransactionRows`

- Purpose: return calloff-level Classic Peak/Offpeak projection rows for a Peaks.Classic portfolio.
- Inputs: database, portfolio id.
- Outputs: Classic row list.
- Side effects: none.
- Tests: Classic feature/list tests.

### `getPeaksModernCalloffTransactionRows`

- Purpose: return calloff-level Modern Base/Peak projection rows for a Peaks.Modern portfolio.
- Inputs: database, portfolio id.
- Outputs: Modern row list.
- Side effects: none.
- Tests: Modern feature/list tests.

### `projectPeaksCalloffMonth`

- Purpose: calculate canonical values and both Classic and Modern monthly projection values.
- Inputs: database, calloff, monthly transactions.
- Outputs: monthly projection object.
- Side effects: none.
- Tests: formula and value-preservation tests.

### `aggregateClassicProjection` and `aggregateModernProjection`

- Purpose: aggregate monthly projection rows to one calloff-level row using hours and values.
- Inputs: monthly projection rows.
- Outputs: aggregated Classic and Modern calloff row values.
- Side effects: none.
- Tests: multi-month aggregation tests.

## Changed Functions

### `getApplicationFeaturesForPortfolio`

- Change: add Modern calloff transaction list feature and align Classic visible label.
- Tests: feature gating tests.

### `renderHedgingTool`

- Change: route Classic and Modern transaction list features to new renderers.
- Tests: UI column tests.

### `getLegacyCalloffListRows`

- Change: retained as a compatibility projection adapter backed by the shared projection logic.
- Tests: existing Classic compatibility tests updated for P0029 behavior.

### `projectLegacyCalloffMonth`

- Change: retained as a compatibility monthly adapter over `projectPeaksCalloffMonth`.
- Tests: existing monthly aggregation and alias tests.
