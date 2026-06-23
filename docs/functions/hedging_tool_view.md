# Hedging Tool View Functions

## `getDemoPortfolioId(database)`

Returns the fixed demo portfolio id used by the P0035 application shell.

- Preferred portfolio: `CUS00-0`
- Fallback: the first available portfolio id sorted lexically
- Side effects: none

The main UI uses this function so URL state cannot switch the visible application to a product-specific fixture portfolio.

## `getApplicationFeaturesForPortfolio(database, portfolioId, requestedPerspectiveId)`

Returns the generic single-portfolio feature matrix.

P0035 intentionally ignores the requested global perspective for shell feature selection. Perspective selection happens inside individual features.

Current generic feature list:

- Portfolio Details
- Forecast
- Hedge Forecast
- Calloff List
- Position Report
- Position
- Data Viewer
- Hedge Baseload

## `renderCalloffList(database, selectedPortfolio, perspectiveId)`

Renders the `Calloff List` feature for a selected feature-level perspective.

- `baseloads`: Baseloads customer calloff rows
- `classic`: Classic Peak/Offpeak projection
- `modern`: Modern Base/Peak projection

All projected customer rows are derived from canonical calloffs and canonical component transactions.

## `renderDataViewer(database, selectedPortfolio, state)`

Renders the Data Viewer with a view-level tab model:

- `canonical`
- `baseloads`
- `classic`
- `modern`

The selected view constrains the table selector so raw canonical rows and projected rows are visibly separated.

## `renderPosition(database, selectedPortfolio, state, perspectiveId)`

Renders the `Position` feature with feature-level perspective tabs. P0035 reuses the current monthly canonical aggregation while preserving the UI contract that Position can be viewed from Baseloads, Classic and Modern perspectives.

## `renderClassicForecastTable(rows)`

Renders the P0036 Classic Forecast edit table.

- Inputs: forecast display rows with derived `classic_offpeak_mwh` and `classic_peak_mwh`
- Output: HTML table with editable `Offpeak MWh` and `Peak MWh` fields
- Side effects: none
- Persistence: form submission converts Classic values back to stored forecast fields

## `renderClassicForecastHedgeProfile(selectedPortfolio, profile, perspectiveId)`

Renders the P0036 Classic Hedge Forecast profile.

- Inputs: selected portfolio, generated hedge profile and feature-level perspective
- Output: HTML form with editable Classic `Offpeak MWh` and `Peak MWh`
- Side effects: none
- Persistence: accept submission writes canonical transactions, not projected Classic rows
