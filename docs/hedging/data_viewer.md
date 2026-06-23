# Data Viewer

## Purpose

`Data Viewer` is a read-only PoC transparency feature for inspecting raw portfolio-linked rows.

The first supported tables are:

```text
Calloffs
Transactions
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
```

Unknown table values are handled as invalid input.

## Year Selector

The year selector is derived from available calendar years and relevant portfolio data. In the current seed data it includes:

```text
2027
2028
2029
```

Calloffs are filtered by calloff `date` year. Transactions are filtered by transaction `month` year.

## Calloffs Raw View

The Calloffs table shows raw IDs and core fields:

```text
calloff_id
product_id
product name
portfolio_id
portfolio name
date
```

Default sorting is by date ascending, then calloff id ascending.

## Transactions Raw View

The Transactions table shows raw IDs and core fields:

```text
transaction_id
calloff_id
month
productcomponent_id
component
product name
mw
q_factor
```

Default sorting is by month ascending, then calloff id ascending, then transaction id ascending.

## Known PoC Limitations

- Data Viewer is read-only.
- It currently supports only calloffs and transactions.
- It does not export data.
- Empty seed data can show no rows until a purchase or hedge flow creates calloffs and transactions.
