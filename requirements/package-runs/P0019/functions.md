# P0019 function design

## New functions and classes

- `createStaticDerivativePriceBlocks()`
  - Purpose: returns normalized static derivative price blocks.
  - Inputs: none.
  - Outputs: `NormalizedMarketPriceBlock[]`.
  - Side effects: none.
  - Tests: static derivative coverage tests.

- `StaticDerivativePriceProvider`
  - Purpose: exposes static derivative blocks through existing annual and block provider contracts.
  - Inputs: optional normalized blocks.
  - Outputs: annual futures rows, price blocks, normalized blocks.
  - Side effects: none.
  - Tests: static provider mode and block coverage tests.

- `StaticCurrencyProvider`
  - Purpose: exposes deterministic static SEK currency values for static Price API mode.
  - Inputs: year and component code.
  - Outputs: annual currency rows.
  - Side effects: none.
  - Tests: static provider mode tests.

- `getStaticMonthlyReferencePrice(month, component, priceArea)`
  - Purpose: finds the static monthly reference price used by spot actual generation.
  - Inputs: month, component, price area.
  - Outputs: numeric reference price.
  - Side effects: throws a clear Price API error if data is missing.
  - Tests: spot actual range tests indirectly cover it.

- `createStaticSpotActualPrices()`
  - Purpose: creates deterministic monthly spot actual rows for the seed period.
  - Inputs: none.
  - Outputs: static spot actual rows.
  - Side effects: none.
  - Tests: coverage and formula tests.

- `getMonthlySpotActual(month, priceArea)`
  - Purpose: returns one spot actual row.
  - Inputs: month and price area.
  - Outputs: spot actual row.
  - Side effects: throws clear error if missing.
  - Tests: helper lookup and missing-month tests.

- `getSpotActualsForYear(year, priceArea)`
  - Purpose: returns spot actual rows for one year.
  - Inputs: year and price area.
  - Outputs: monthly spot actual rows.
  - Side effects: throws clear error if the year has no rows.
  - Tests: helper tests.

- `validateSpotActualConsistency(row)`
  - Purpose: validates weighted peak/offpeak average.
  - Inputs: spot actual row.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: every generated month is validated.

## Changed functions

- `createPriceApiFromProviderMode`
  - Purpose change: accepts `PRICE_PROVIDER_MODE=static`.
  - Inputs: existing environment object.
  - Outputs: Price API backed by static derivative data and fixture currency.
  - Side effects: none beyond existing environment read.
  - Tests: static provider mode and fixture mode tests.
