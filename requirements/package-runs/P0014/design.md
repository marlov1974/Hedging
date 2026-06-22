# P0014 implementation design

## Package interpretation

P0014 adds a minimal call-off and transaction persistence model to the existing in-memory prototype database.

## Implementation structure

- Add `Calloff`, `CustomerTransaction` and `CalloffWithTransactions` types.
- Extend `PrototypeDatabase` with `calloffs` and `transactions` maps.
- Add date validation for `YYYY-MM-DD` while reusing existing month and numeric validation.
- Add repository functions:
  - `insertCalloff`
  - `insertTransaction`
  - `getCalloffWithTransactions`
  - `getTransactionsByPortfolio`
  - `getTransactionsByProduct`

## Intended changes

- Validate call-off references to product configuration and customer portfolio.
- Validate transaction references to call-off and product configuration component.
- Validate that each transaction component belongs to the parent call-off product.
- Return deterministic query results sorted by month and transaction id.
- Add a synthetic fixture call-off helper through tests rather than widening shared fixtures unless needed.
- Add `docs/data-model/calloff_transaction_database_model.md`.

## Refactoring decisions

No broad refactor is needed. The new code will follow the existing repository module style and keep private helpers local unless they are reusable validation helpers.

## Test strategy

Add `tests/database/calloffTransactionModel.test.ts` with package-required positive and negative cases, including the product consistency rule.

## Risks and uncertainties

- The package names the table `Transaction`, but `Transaction` is a common platform/database term. The TypeScript type will use `CustomerTransaction` while fields and docs keep the package terminology.
- No production data or external systems are touched.
