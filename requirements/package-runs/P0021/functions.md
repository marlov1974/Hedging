# P0021 function design

## New functions

- `getApplicationFeaturesForPortfolio(database, portfolioId)`
  - Purpose: return feature definitions for the selected portfolio's application variant.
  - Inputs: database and optional portfolio id.
  - Outputs: application config with variant id, label, copy and features.
  - Side effects: none.
  - Tests: application config tests.

- `isPeaksModernPortfolio(database, portfolioId)`
  - Purpose: detect PeaksModern product configuration.
  - Inputs: database and portfolio id.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: application config tests.

- `resolveActiveFeature(database, portfolioId, requestedFeatureId)`
  - Purpose: keep shared active features or reset unavailable features after portfolio changes.
  - Inputs: database, portfolio id and requested feature id.
  - Outputs: valid feature id.
  - Side effects: none.
  - Tests: portfolio switching tests.

- `getForecastYears(database, portfolioId)`
  - Purpose: list forecast years for the selected portfolio.
  - Inputs: database and portfolio id.
  - Outputs: sorted year strings.
  - Side effects: none.
  - Tests: forecast feature tests.

- `getForecastRowsForYear(database, portfolioId, year)`
  - Purpose: return monthly forecast rows for one year.
  - Inputs: database, portfolio id and year.
  - Outputs: display rows with MWh and Peak %.
  - Side effects: none.
  - Tests: forecast feature tests.

- `validateForecastUpdate(input)`
  - Purpose: validate one forecast row update.
  - Inputs: portfolio id, month, MWh and peak percent text.
  - Outputs: normalized update.
  - Side effects: throws validation errors.
  - Tests: invalid MWh and Peak % tests.

- `updateForecastRow(database, input)`
  - Purpose: update one forecast row.
  - Inputs: database and normalized/display update input.
  - Outputs: updated forecast row.
  - Side effects: mutates the in-memory forecast row.
  - Tests: MWh and Peak % update tests.

- `updateForecastRows(database, input)`
  - Purpose: update multiple forecast rows in one save action.
  - Inputs: database, portfolio id and row updates.
  - Outputs: updated forecast rows.
  - Side effects: mutates the in-memory forecast rows.
  - Tests: form save route and helper tests.

## Changed functions

- `renderHedgingTool`
  - Change: applies product-specific app config and renders Forecast.
  - Tests: shell and forecast tests.

- `createHedgingToolServer`
  - Change: handles Forecast save POST.
  - Tests: covered by forecast logic and render tests.
