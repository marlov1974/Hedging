# P0014 - Call-off and transaction database model

## Purpose

Add the call-off model to the prototype database layer.

This is a coding package.

## Background

A call-off represents one customer action against a product configuration and customer portfolio.

A transaction represents the monthly product-component rows created by that call-off.

This package adds the minimal two-table structure needed for call-offs and their monthly component transactions.

## Required tables

Implement two tables:

```text
Calloff
Transaction
```

Use existing repository/database conventions from earlier packages.

## Calloff table

Fields:

```text
calloff_id
product_id
portfolio_id
date
```

Rules:

- `calloff_id` is the technical primary key.
- `product_id` references Product Configuration.
- `portfolio_id` references Customer Portfolio.
- `date` is the call-off date.
- Use ISO date format, preferably `YYYY-MM-DD`.

## Transaction table

Fields:

```text
transaction_id
calloff_id
month
productcomponent_id
mw
q_factor
```

Rules:

- `transaction_id` is the technical primary key.
- `calloff_id` references Calloff.
- `month` uses `YYYY-MM`.
- `productcomponent_id` references Product Configuration Component.
- `mw` is the call-off quantity for that month and product component.
- `q_factor` is the Q-factor stored with the transaction and used for later Market derivation.

## Relationship model

Required relationships:

```text
Product Configuration 1..n Calloff
Customer Portfolio 1..n Calloff
Calloff 1..n Transaction
Product Configuration Component 1..n Transaction
```

## Required implementation

Create or extend database modules for:

```text
schema creation
repository/data-access functions
validation helpers
tests
```

Suggested functions:

```text
insertCalloff
insertTransaction
getCalloffWithTransactions
getTransactionsByPortfolio
getTransactionsByProduct
```

Adapt names to existing repository conventions.

## Validation rules

Reject:

- calloff referencing unknown product_id,
- calloff referencing unknown portfolio_id,
- transaction referencing unknown calloff_id,
- transaction referencing unknown productcomponent_id,
- invalid calloff date format,
- invalid transaction month format,
- missing mw,
- non-numeric mw,
- missing q_factor,
- non-numeric q_factor.

## Product consistency rule

A transaction's `productcomponent_id` should belong to the same `product_id` as the parent calloff.

If existing schema makes this validation possible, implement it.

If not, document the limitation and add a TODO.

## Market derivation link

The transaction stores `mw` and `q_factor` because Market quantities are derived later rather than duplicated.

For later packages, expected derivation shape is:

```text
market_quantity = mw * q_factor
```

This package does not need to implement the Market derivation calculation unless an existing helper already exists.

## Tests

Add tests for:

1. insert calloff with valid product and portfolio,
2. reject calloff with unknown product,
3. reject calloff with unknown portfolio,
4. insert transaction with valid calloff and product component,
5. reject transaction with unknown calloff,
6. reject transaction with unknown product component,
7. reject invalid month format,
8. reject missing or non-numeric mw,
9. reject missing or non-numeric q_factor,
10. get calloff with transaction rows,
11. transaction product component belongs to calloff product when validation is possible.

## Documentation

Create:

```text
docs/data-model/calloff_transaction_database_model.md
```

Document:

```text
purpose of Calloff
purpose of Transaction
relationship to Product Configuration
relationship to Customer Portfolio
why q_factor is stored on Transaction
how this supports later Market derivation
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files changed,
- schema changes,
- repository functions added,
- validation rules implemented,
- tests added,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
