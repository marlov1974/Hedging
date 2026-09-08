# Data Viewer

For canonical versus projected component-name rules, see [Component Catalog](component_catalog.md).

## Purpose

`Data Viewer` is a read-only PoC transparency feature for inspecting raw portfolio-linked rows and selected compatibility projections.

The supported tables are:

```text
Calloffs
Transactions
Modern Projected Calloffs
Modern Projected Transactions
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
modern-projected-calloffs
modern-projected-transactions
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

## Modern Projected Calloffs View

The Modern Projected Calloffs table shows Peaks calloffs through the Modern projection lens:

```text
calloff_id
date
period_start
period_end
base_mwh
peak_mwh
base_price
peak_price
base_value
peak_value
total_value
```

`base_mwh` and `peak_mwh` are physical volumes carried by the sys dimension. Sys and epad values are combined into all-in base and peak prices without double-counting physical volume.

## Modern Projected Transactions View

The Modern Projected Transactions table shows projected Base/Peak component rows:

```text
calloff_id
month
component
mw
price
value
source_components
warnings
```

The `component` column uses only projected Modern component names:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

The projected rows are derived from canonical Peaks component rows. Allocation rows and canonical component names are not shown as projected component values. They remain visible in the raw Transactions view and may appear in debug-only `source_components`.

## Known PoC Limitations

- Data Viewer is read-only.
- It does not export data.
- Empty seed data can show no rows until a purchase or hedge flow creates calloffs and transactions.
