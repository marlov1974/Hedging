# P0021 - PeaksModern application and Forecast feature

## Purpose

Add application-configuration-specific feature sets and create the first PeaksModern application page with a Forecast feature.

This is a coding package.

## Context

The application must show different features depending on the selected portfolio's product/application configuration.

The current UI has mainly evolved as a minimal Baseloads application page.

Now add a PeaksModern application page. It should share the Portfolio Details feature, but all other Baseloads-specific features should be replaced by PeaksModern-specific features.

## Application configuration rule

The UI feature set is determined by the selected portfolio's product configuration.

At minimum implement two feature sets:

```text
Baseloads application
PeaksModern application
```

### Baseloads application

Existing Baseloads features remain available for Baseloads portfolios, for example:

```text
Buy Baseloads
Baseloads Calloff List
Position Report
Financial Settlement
Portfolio Details
```

Exact Baseloads feature list should follow current implementation.

### PeaksModern application

For PeaksModern portfolios, the feature list should be different.

For this package, PeaksModern should expose:

```text
Portfolio Details
Forecast
```

Do not show Baseloads-only features for PeaksModern portfolios.

## Portfolio Details

Portfolio Details is shared across application configurations.

For PeaksModern, it should show the same basic portfolio information as for Baseloads:

```text
portfolio name
customer name
customer number
price area
product configuration
calendar id
```

## New feature: Forecast

Add a Forecast feature for PeaksModern portfolios.

Purpose:

```text
The user can view and edit the portfolio's monthly forecast.
```

The Forecast feature works against the selected portfolio.

## Forecast data model

Use existing Customer Forecast data:

```text
portfolio_id
month
mwh
peak_pct
```

Semantics:

```text
mwh = total monthly customer consumption forecast
peak_pct = share of monthly volume/profile allocated to peak information
```

For PeaksModern, the forecast supports the modern model where total consumption remains a base exposure while peak information is used for peak-modern exposure logic later.

This package only edits and stores forecast values. It does not need to recalculate hedge positions yet unless existing functions make that trivial.

## Forecast UI

The Forecast feature should show monthly rows.

Minimum columns:

```text
Month
MWh
Peak %
```

The user should be able to edit:

```text
MWh
Peak %
```

Use simple professional UI controls:

```text
numeric input for MWh
numeric input or percentage input for Peak %
save button
reset/cancel if simple to add
```

## Year filter

Include a year dropdown to keep the view compact.

For current seed data, support:

```text
2027
2028
2029
```

The table should show the 12 months for the selected year.

If no forecast exists for a selected year, show an empty state.

## Save behavior

On save, update the underlying forecast rows for the selected portfolio and year.

Support saving one edited row at a time or saving all edited rows at once. Choose the simpler implementation that fits existing architecture.

After save:

```text
updated values should be visible in the UI
repository/database state should reflect the change
```

## Validation rules

Reject:

- non-PeaksModern portfolio using the PeaksModern Forecast feature,
- invalid month format,
- missing MWh,
- non-numeric MWh,
- MWh less than zero,
- missing Peak %,
- non-numeric Peak %,
- Peak % less than 0,
- Peak % greater than 100 if displayed as percent,
- Peak % less than 0 or greater than 1 if stored as decimal.

Use the storage convention already used by Customer Forecast.

If current data stores `peak_pct` as decimal, display as percent but persist as decimal.

Document the convention.

## Required implementation

Use existing TypeScript and UI conventions.

Suggested modules, adapt to current structure:

```text
src/hedging/applicationConfig.ts
src/hedging/forecastFeature.ts
src/hedging/ForecastFeatureView.*
tests/hedging/applicationConfig.test.ts
tests/hedging/forecastFeature.test.ts
```

## Required functions

Add business logic functions separate from UI where practical:

```text
getApplicationFeaturesForPortfolio
isPeaksModernPortfolio
getForecastYears
getForecastRowsForYear
updateForecastRow
updateForecastRows
validateForecastUpdate
```

## Feature selection behavior

When the selected portfolio changes:

```text
feature list should update
active feature should reset if it is not available for the new portfolio
shared features may remain active if still available
```

Example:

```text
Baseloads portfolio -> shows Baseloads feature set
PeaksModern portfolio -> shows Portfolio Details and Forecast
```

## Tests

Add tests for:

1. application config returns Baseloads features for Baseloads portfolio,
2. application config returns PeaksModern features for PeaksModern portfolio,
3. PeaksModern does not show Buy Baseloads,
4. PeaksModern does not show Baseloads Calloff List,
5. PeaksModern shows Portfolio Details,
6. PeaksModern shows Forecast,
7. Forecast feature renders year dropdown,
8. Forecast feature renders Month, MWh and Peak % columns,
9. Forecast feature shows 12 rows for a populated year,
10. editing MWh updates forecast data,
11. editing Peak % updates forecast data,
12. invalid MWh is rejected,
13. invalid Peak % is rejected,
14. switching from Baseloads to PeaksModern resets unavailable active feature.

## Documentation

Create or update:

```text
docs/hedging/application_configurations.md
docs/hedging/peaks_modern_forecast_feature.md
```

Document:

```text
application configuration concept
shared features
Baseloads feature set
PeaksModern feature set
Forecast feature purpose
forecast field semantics
Peak % display/storage convention
known PoC limitations
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files changed,
- application configuration logic added,
- PeaksModern feature set implemented,
- Forecast feature status,
- forecast edit/save behavior,
- tests added or updated,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
