# Call-off model

A call-off is the parent object for one customer action or order against a contract part.

## Purpose

The call-off groups one or more monthly component transactions.

It is also the object used when a customer transaction list should show one named instrument or call-off entry.

## Core fields

```text
calloff_id
contract_part_id
created_at
created_by
source
status
customer_visible_name
aggregate_quantity
aggregate_value
```

## Customer-visible name

The call-off may store or derive a customer-visible instrument name.

Synthetic examples:

```text
BASEQ4-26
BASERYR-27
```

The name is used for display. It must not be used as the only source of calculation logic.

## Aggregates

Aggregate values may be stored or derived at runtime.

The chosen implementation must define which fields are stored and which are derived.
