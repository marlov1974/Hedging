# Market derivation

Market derivation describes how a customer transaction creates a Market-facing hedge need.

## Principle

Customer transactions are the source of truth.

Market-facing quantities may be derived at query time from transaction parameters.

## Components that can create Market need

```text
base.sys
base.epad
profile.peak
profile.15m
```

## Direct components

`base.sys` and `base.epad` normally derive Market quantity directly from the transaction quantity and calendar basis.

## Q-factor components

`profile.peak` and `profile.15m` derive Market quantity through Q-factor conversion.

The Q-factor used at call-off time should be stored or otherwise versioned with the transaction.

## Rule

Do not duplicate Market rows unless the implementation explicitly chooses materialized storage.

If runtime derivation is used, Market output is derived from transaction fields when queried.
