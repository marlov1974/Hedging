# Data Viewer

## Purpose

`Data Viewer` is a read-only PoC transparency feature for inspecting raw portfolio-linked rows and selected compatibility projections.

The supported tables are:

```text
Calloffs
Transactions
Modern Calloffs
Modern Transactions
```

## Portfolio Scoping

All rows are scoped to the selected portfolio.

Calloffs are included only when:

```text
Calloff.portfolio_id = selected portfolio_id
```

Transactions are included only through selected portfolio calloffs:

```text
Transaction.calloff_id -> Calloff.calloff_id
Calloff.portfolio_id = selected portfolio_id
```

This prevents rows from other portfolios from appearing in the selected portfolio view.

## Table Selector

The table selector supports:

```text
calloffs
transactions
modern-calloffs
modern-transactions
```

Unknown table values are handled as invalid input.

## Year Selector

The year selector is derived from available calendar years and relevant portfolio data. In the current seed data it includes:

```text
2027
2028
2029
```

The year selector is a delivery year selector. Calloffs are filtered by `delivery_start_month` year. Transactions are filtered by transaction `month` year.

Modern projection views are filtered by calloff `delivery_start_month` year.

## Calloffs Raw View

The Calloffs table shows raw IDs and core fields:

```text
calloff_id
product_id
portfolio_id
date
delivery_start_month
delivery_end_month
```

`date` is the call-off creation date. It is visible as raw data but is not used for year filtering.

Default sorting is by delivery start month ascending, delivery end month ascending, then calloff id ascending.

## Transactions Raw View

The Transactions table shows raw IDs and core fields:

```text
transaction_id
calloff_id
month
productcomponent_id
mw
q_factor
```

Default sorting is by month ascending, then calloff id ascending, then transaction id ascending.

## Modern Calloffs Projection View

The Modern Calloffs table shows Peaks calloffs through the Modern projection lens:

```text
calloff_id
source_product_id
projected_product_package
portfolio_id
date
delivery_start_month
delivery_end_month
canonical_total_value
projected_total_value
```

`projected_product_package` is `Peaks.Modern`. This allows Peaks.Classic and Peaks.Modern canonical calloffs to be viewed as compatible Modern calloffs.

## Modern Transactions Projection View

The Modern Transactions table shows projected Base/Peak rows:

```text
projected_transaction_id
calloff_id
period
component
mwh
price
value
```

The projected rows are derived from the canonical Peaks component rows.

Allocation rows are not shown directly in the Modern projection. Raw allocation and canonical MW rows remain visible in the original Transactions view.

## Known PoC Limitations

- Data Viewer is read-only.
- It does not export data.
- Empty seed data can show no rows until a purchase or hedge flow creates calloffs and transactions.
