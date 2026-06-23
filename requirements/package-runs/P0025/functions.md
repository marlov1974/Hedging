# P0025 Function Design

## New Functions

- `canonicalProductPackageName(name)`
  - Purpose: normalize legacy product aliases to target package names.
  - Inputs: product/package name string.
  - Outputs: canonical package name string.
  - Side effects: none.
  - Tests: product alias tests.

- `canonicalComponentCode(component)`
  - Purpose: normalize legacy component aliases to target component codes.
  - Inputs: component code string.
  - Outputs: canonical component code string.
  - Side effects: none.
  - Tests: component alias tests.

- `getComponentMetadata(component)`
  - Purpose: return component category and hour basis for canonical and accepted legacy component codes.
  - Inputs: component code string.
  - Outputs: metadata object.
  - Side effects: none.
  - Tests: seed/model tests.

- `isMarketProjectionComponent(component)`, `isCustomerProjectionComponent(component)`, `isInternalProjectionComponent(component)`
  - Purpose: implement category-based projection listener rules.
  - Inputs: product component or component code.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: market projection tests.

- `getMarketProjectionRows(database, transactions)`
  - Purpose: return market-relevant projected rows using q-factor and component hour basis.
  - Inputs: database and customer transactions.
  - Outputs: market projection rows.
  - Side effects: none.
  - Tests: market projection tests.

## Changed Functions

- `createPocSeedData`
  - Adds canonical product package names, component categories, hour bases, allocation prices and q-factors.

- `insertProductConfigurationComponent`
  - Validates category and hour basis metadata.

- `getApplicationFeaturesForPortfolio`, `isPeaksModernPortfolio`
  - Use canonical product package names while accepting aliases.

- `buildForecastHedgeProfile`, `updateForecastHedgeProfileRow`, `acceptForecastHedgeProfile`
  - Keep the UI profile workflow but calculate allocation peak and premium MW from canonical formulas.

- `createForecastHedgeTransactions`
  - Generates five transactions per month for Peaks.Modern.

## Removed Functions

None.
