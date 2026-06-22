# Runtime derivation policy

Runtime derivation means derived values are calculated when queried instead of stored as duplicated state.

## Source of truth

The source of truth is the customer transaction and its stored parameters.

Examples of source parameters:

```text
component_code
quantity
quantity_unit
price
price_unit
calendar_basis
q_factor
```

## Derived outputs

Derived outputs may include:

```text
derived_mwh
market_quantity
market_value
settlement_value
```

## Materialization

A derived value may be materialized for performance, audit or reporting reasons.

If materialized, the implementation must store:

```text
derivation_rule_version
source_transaction_id
calculated_at
```

## Rule

A materialized value must be traceable back to the source transaction and derivation rule.
