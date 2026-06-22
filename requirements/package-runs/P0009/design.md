# P0009 implementation design

## Package interpretation

Add a v2 Price API path that accepts a price area and a contiguous monthly MW profile. The compact response stays identical to v1: monthly rows with `base.sys`, `base.epad` and `currency.sek`.

## Implementation structure

- Extend `src/price-api/types.ts` with v2 request, block and trace types.
- Add `src/price-api/profileRequest.ts` for request/profile validation.
- Add `src/price-api/blockProviders.ts` for synthetic year, quarter and month block fixture providers.
- Add `src/price-api/blockStacking.ts` for virtual block generation, layer decomposition and weighted monthly price calculation.
- Extend `src/price-api/priceApi.ts` with `getProfilePrices` and `getProfilePricesWithTrace`.
- Extend `src/price-api/server.ts` with a local v2 endpoint.
- Add `tests/price-api/priceApiV2.test.ts` for required P0009 behavior.

## Stacking model

For each non-currency component, the requested monthly MW profile is decomposed into layers:

1. A yearly layer equal to the minimum MW across all months in the year.
2. A quarterly layer equal to the minimum remaining MW inside each quarter.
3. A monthly layer for each month's remaining MW.

Each month's component price is the MW-weighted average of the applicable year, quarter and month block prices. Direct blocks are preferred when available; missing quarter/month blocks are virtualized from wider blocks using the P0008 relation tables. `currency.sek` is repeated from fixture data and remains separate from energy component prices.

## Test strategy

Use the existing `npm test` command and Node's built-in test runner. Add focused v2 tests for stacking, validation, virtual blocks and trace marking while keeping existing v1 tests unchanged.

## Risks and assumptions

- The profile must be contiguous and duplicate-free after sorting by month.
- Negative MW is rejected. Zero MW is allowed only if all resulting monthly energy component prices can be deterministically returned as zero without source block usage.
- P0009 does not add real provider integrations.
