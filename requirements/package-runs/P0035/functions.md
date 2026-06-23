# P0035 Function Design

## New or changed functions

- `getDemoPortfolioId`
  - Purpose: centralizes the single demo portfolio id.
  - Inputs: database.
  - Outputs: portfolio id.
  - Side effects: none.
  - Tests: hedging tool shell tests.

- `getApplicationFeaturesForPortfolio`
  - Purpose: changed to return one generic feature list independent of global perspective.
  - Inputs: database, optional portfolio id.
  - Outputs: application config.
  - Side effects: none.
  - Tests: application configuration tests.

- `resolveActiveFeature`
  - Purpose: resolves generic feature ids.
  - Inputs: database, portfolio id, requested feature id.
  - Outputs: feature id.
  - Side effects: none.
  - Tests: application configuration tests.

- `renderFeaturePerspectiveTabs`
  - Purpose: renders feature-local perspective links.
  - Inputs: selected portfolio, feature id, selected perspective, allowed perspectives.
  - Outputs: HTML.
  - Side effects: none.
  - Tests: hedging tool tests.

- `renderCalloffList`
  - Purpose: changed to choose Baseloads, Classic or Modern projection inside one feature.
  - Inputs: database, selected portfolio, perspective id.
  - Outputs: HTML.
  - Side effects: none.
  - Tests: hedging tool and projection tests.

- `renderPosition`
  - Purpose: new Position feature that shares current position aggregation and feature-local perspective tabs.
  - Inputs: database, selected portfolio, state, perspective id.
  - Outputs: HTML.
  - Side effects: none.
  - Tests: hedging tool tests.

- `renderDataViewer`
  - Purpose: changed from table-first to view-first Canonical/Baseloads/Classic/Modern selector.
  - Inputs: database, selected portfolio, state.
  - Outputs: HTML.
  - Side effects: none.
  - Tests: Data Viewer and shell tests.

## Removed functions

None.
