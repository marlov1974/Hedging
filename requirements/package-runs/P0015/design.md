# P0015 implementation design

## Package interpretation

P0015 creates a complete deterministic PoC seed database for five product configurations across 2027-01 through 2029-12.

## Implementation structure

- Extend database types and schema with:
  - `PortfolioProductComponent`
  - `QFactorSet`
  - `QFactorValue`
- Extend repository functions for inserting and querying portfolio product components and Q-factor rows.
- Extend component validation with P0015 component codes.
- Create `src/database/pocSeedData.ts` for deterministic seed generation.
- Create focused tests in `tests/database/pocSeedData.test.ts`.
- Document the seed model in `docs/data-model/poc_seed_data.md`.

## Intended changes

- Add 5 synthetic customers and 5 portfolios.
- Add 5 product configurations and 24 product configuration components.
- Add 36 Swedish trading calendar rows for 2027-01 through 2029-12.
- Add 180 forecast rows.
- Add 24 portfolio product component instances.
- Add 24 Q-factor sets and 864 monthly Q-factor values.
- Add 24 deterministic price components.

## Calendar design

The existing `Calendar` shape stores one row per month. P0015's `CAL_SE_TRADING` is represented as a calendar set prefix:

```text
CAL_SE_TRADING:2027-01
```

Portfolios store `calendar_id = CAL_SE_TRADING`. Repository calendar lookup accepts either exact row ids or this set prefix and returns the first month row for existing portfolio-with-forecast queries.

## Refactoring decisions

No broad refactor is planned. Existing customer/product functions remain in `repository.ts`; P0015 adds only package-required insert/query helpers and seed generation.

## Test strategy

Use the generated in-memory database and assert package-required counts, completeness, calendar math, Q-factor relationships/ranges and classic vs modern component separation.

## Risks and uncertainties

- The repository still has no separate calendar-set table. The prefix convention is a deliberate PoC compromise and is documented.
- P0015 does not require call-off or transaction rows, so seed data stops at portfolio product components, Q-factor values, forecasts and prices.
