# P0007 implementation design

## Package interpretation

Implement a local Price API prototype for synthetic fixture data only. The API accepts inclusive `start_month` and `end_month` values in `YYYY-MM` format and returns one row per month with `base.sys`, `base.epad` and `currency.sek`.

## Implementation structure

- `src/price-api/types.ts`: shared request, response, provider and error types.
- `src/price-api/monthRange.ts`: month validation, parsing and inclusive range generation.
- `src/price-api/providers.ts`: provider interfaces plus synthetic fixture providers.
- `src/price-api/priceApi.ts`: request validation and response assembly.
- `src/price-api/server.ts`: small HTTP adapter for local use.
- `tests/price-api/priceApi.test.ts`: package behavior tests.

## Test strategy

Use Node 26's built-in test runner directly on TypeScript files. Avoid external packages and package registry access.

Required behaviors covered:

- one-month output,
- full-year output,
- cross-year fixture selection,
- invalid month format rejection,
- end-before-start rejection,
- missing fixture data rejection,
- separate `currency.sek` component,
- currency component does not change energy component prices.

## Risks and assumptions

- Node 26 runtime is assumed because local smoke testing confirmed TypeScript test execution works.
- The HTTP server is intentionally minimal and local-only; the core package entry point is `createPriceApi`.
- Fixture values are synthetic placeholders and are not market data.
