# P0026 Function Design

## New Functions

- `isPeaksClassicPortfolio(database, portfolioId)`
  - Purpose: gate Classic Feature Set features.
  - Inputs: database and portfolio id.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: application configuration tests.

- `getLegacyCalloffListRows(database, portfolioId)`
  - Purpose: project canonical Peaks.Classic calloff transactions into customer-facing Peak/Offpeak rows.
  - Inputs: database and portfolio id.
  - Outputs: projected legacy rows.
  - Side effects: none.
  - Tests: legacy calloff list tests.

- `projectLegacyCalloffMonth(database, calloff, monthTransactions)`
  - Purpose: calculate monthly Peak/Offpeak projection and warnings.
  - Inputs: database, calloff and monthly canonical transactions.
  - Outputs: two projected rows or incomplete/error rows with warnings.
  - Side effects: none.
  - Tests: formula and edge case tests.

## Changed Functions

- `getApplicationFeaturesForPortfolio`
  - Adds Peaks.Classic application variant and `Legacy Calloff List`.

- `renderHedgingTool`
  - Renders Legacy Calloff List when selected.

- `createPocSeedData`
  - Moves Peaks.Classic seed components to the canonical model.

## Removed Functions

None.
