# P0005 - Market derivation documentation

## Purpose

Document how Market hedge quantities are derived from customer transactions.

This is a documentation package. It does not add prototype code.

## Package type

Documentation package.

## Required work

Create small documentation files:

```text
market_derivation.md
q_factor_model.md
runtime_derivation_policy.md
```

If the documentation structure exists, place files under:

```text
docs/market-derivation/
```

If the structure does not exist yet, create them in root and move them later.

## Model requirement

`base.sys`, `base.epad`, `profile.peak` and `profile.15m` can all create a Market-facing hedge need.

`profile.peak` and `profile.15m` derive their Market quantity through Q-factor conversion.

The transaction may store the Q-factor used at call-off time.

## Runtime derivation principle

If the design uses runtime derivation, the transaction stores source parameters. Market-facing quantities are calculated when queried rather than stored as duplicated rows.

The documentation must distinguish:

- customer transaction
- source transaction parameters
- Q-factor
- derived Market quantity
- derived Market value

## Verification

Confirm that:

- no real organization names are added,
- no real product names are added,
- no real prices, forecasts or customer examples are added,
- the files use only generic terms,
- `REPOSITORY_FILES.md` is updated if files are added or moved.
