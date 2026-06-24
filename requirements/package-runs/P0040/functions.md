# P0040 Function Design

## Changed Functions

### `getApplicationFeaturesForPortfolio`

- Change: remove `Position` from visible feature list.
- Side effects: feature navigation no longer contains duplicate position feature.
- Tests: hedging tool shell feature menu tests.

### `normalizeFeatureId`

- Change: map legacy `position` to `position-report`.
- Side effects: old links remain usable.
- Tests: legacy position request renders Position Report.

### `getPositionReportRows`

- Change: accept perspective id and return one row per month with perspective-specific fields.
- Side effects: normal report stops exposing raw component rows.
- Tests: perspective row-shape tests.

### `renderPositionReport`

- Change: render perspective-specific columns.
- Side effects: UI becomes report-oriented rather than component dump.
- Tests: HTML column and raw component absence tests.

### `getBaseloadsCalloffListRows`

- Change: expose `synthetic_derivative_name` and `mw` and keep two rows per calloff.
- Side effects: calloff list shows both MWh and MW.
- Tests: calloff list row-shape tests.

### `formatDerivativeName`

- Change: generate public-market-style synthetic Nordic power derivative names.
- Side effects: calloff rows become clearer and less internal-code-like.
- Tests: monthly SYS and EPAD naming tests plus quarter/year coverage.

## New Functions

### `getBaseloadsPositionReportRows`

- Purpose: produce monthly Baseloads report rows.
- Inputs: database, portfolio id, year.
- Output: rows with base sys/epad MWh and prices.

### `getClassicPositionReportRows`

- Purpose: produce monthly Classic report rows from existing projection helpers.
- Inputs: database, portfolio id, year.
- Output: rows with offpeak/peak MWh and prices.

### `getModernPositionReportRows`

- Purpose: produce monthly Modern report rows from existing projection helpers.
- Inputs: database, portfolio id, year.
- Output: rows with base/peak MWh and prices.
