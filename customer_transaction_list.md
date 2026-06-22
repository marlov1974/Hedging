# Customer transaction list

A customer transaction list should normally show call-offs as the customer-facing entries.

## Principle

One call-off may contain several monthly component transactions.

The customer-facing list should not necessarily show every internal component row as a separate customer action.

## Display model

A call-off row may show:

```text
customer_visible_name
created_at
contract_part
period_range
aggregate_quantity
aggregate_value
status
```

## Drill-down

The user may drill down from the call-off to monthly component transactions.

Example components:

```text
base.sys
base.epad
profile.peak
```

## Settlement display

Settlement output may display peak and offpeak values as columns or separate settlement rows, depending on the target view.

The call-off remains the parent customer action.
