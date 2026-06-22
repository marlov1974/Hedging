# Q-factor model

A Q-factor is a stored parameter used to convert a profile component into a Market-facing quantity or value.

## Purpose

`profile.peak` and `profile.15m` may need to be represented toward Market even though they are not simple base components.

The Q-factor makes that conversion reproducible.

## Transaction fields

A transaction that uses Q-factor conversion should carry:

```text
q_factor
q_factor_basis
q_factor_source
q_factor_version
q_factor_timestamp
```

## Basis

The Q-factor basis must explain what the factor applies to.

Examples:

```text
total_volume
peak_volume
profile_curve
```

## Rule

The Q-factor stored on the transaction is the factor used for that transaction. Later recalculation rules must be explicit and versioned.
