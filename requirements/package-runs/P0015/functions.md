# P0015 function design

## New functions

### `insertPortfolioProductComponent(database, input)`

- Purpose: insert a portfolio-specific product component instance.
- Inputs: database and `PortfolioProductComponent`.
- Output: inserted `PortfolioProductComponent`.
- Side effects: mutates `database.portfolioProductComponents`.
- Reason: P0015 requires PortfolioProductComponent table.
- Test coverage: every seeded instance has a Q-factor set and valid component relationship.

### `insertQFactorSet(database, input)`

- Purpose: insert a Q-factor set.
- Inputs: database and `QFactorSet`.
- Output: inserted `QFactorSet`.
- Side effects: mutates `database.qFactorSets`.
- Reason: P0015 requires QFactorSet table.
- Test coverage: Q-factor set counts and component matching.

### `insertQFactorValue(database, input)`

- Purpose: insert one monthly Q-factor value.
- Inputs: database and `QFactorValue`.
- Output: inserted `QFactorValue`.
- Side effects: mutates `database.qFactorValues` and uniqueness index.
- Reason: P0015 requires QFactorValue table with one value per set/month.
- Test coverage: 36 values per set and uniqueness through seeded completeness.

### `getPortfolioProductComponents(database, portfolioId)`

- Purpose: list portfolio component instances.
- Inputs: database and portfolio id.
- Output: sorted `PortfolioProductComponent[]`.
- Side effects: none.
- Reason: seed tests and later packages need deterministic access.
- Test coverage: seeded instance checks.

### `getQFactorValuesBySet(database, qFactorSetId)`

- Purpose: list monthly Q-factor values for a set.
- Inputs: database and Q-factor set id.
- Output: sorted `QFactorValue[]`.
- Side effects: none.
- Reason: seed tests and later derivation packages need deterministic access.
- Test coverage: 36 values per set.

### `createPocSeedData()`

- Purpose: create the full deterministic P0015 seed database.
- Inputs: none.
- Output: populated `PrototypeDatabase`.
- Side effects: none outside the returned in-memory database.
- Reason: P0015 requires deterministic seed data.
- Test coverage: complete `pocSeedData` test suite.

### `listSeedMonths()`

- Purpose: return 2027-01 through 2029-12.
- Inputs: none.
- Output: string array.
- Side effects: none.
- Reason: shared seed/test period.
- Test coverage: calendar, forecasts and Q-factor completeness.

### `calculateSwedishTradingHours(month)`

- Purpose: calculate total and peak hours using weekdays 06:00-22:00.
- Inputs: `YYYY-MM` month string.
- Output: `{ total_h, peak_h, offpeak_h }`.
- Side effects: none.
- Reason: P0015 requires Swedish trading calendar rules.
- Test coverage: calendar peak-hour tests.

## Changed functions

### `createSchema()`

- Change: initialize portfolio product component and Q-factor maps/indexes.

### `insertCustomerPortfolio(database, input)`

- Change: accept calendar set prefix when exact calendar row id does not exist.

### `getCustomerPortfolioWithForecasts(database, portfolioId)`

- Change: use the same exact-or-prefix calendar lookup.

### `assertKnownComponentCode(component)`

- Change: add P0015 component vocabulary.

## Removed functions

None.
