# Baseloads calloff list

P0017 adds a Baseloads calloff list feature inside the hedging tool shell.
P0045 adds Baseloads rebalance calloffs with explicit synthetic rebalance derivative names.

## Purpose

The list shows Baseloads calloffs for the selected portfolio and splits each calloff into component rows.

Baseloads calloffs normally contain:

```text
base.sys
base.epad
```

## Columns

The UI table shows:

```text
Date
Synthetic Derivative
MWh
MW
Price
```

The component is no longer shown as a separate visible column. Component distinction is carried in `Derivatnamn`.

## Component-Split Rows

The list groups transactions by:

```text
calloff_id
component
```

A quarter Baseloads calloff has six transactions:

```text
3 months * 2 components = 6 transactions
```

It still renders as two table rows:

```text
one base.sys row
one base.epad row
```

The visible table has no separate `Component` column.

## MWh Aggregation

For Baseloads, monthly MW is converted to MWh with total monthly hours:

```text
MWh = sum(transaction.mw * calendar.total_h)
```

Baseloads uses total hours because its components cover all hours.

## MW Aggregation

The calloff row MW is derived from the aggregated MWh and the total hours covered by the row:

```text
MW = MWh / sum(calendar.total_h)
```

For flat Baseloads purchases this returns the original purchased MW.

## Weighted Average Price

When a transaction carries a price, the list uses that transaction price. Otherwise it falls back to linked `PriceComponent` values.

Formula:

```text
weighted_price = sum(mwh_i * price_i) / sum(mwh_i)
```

## Market-Style Derivative Naming

The deterministic helper is:

```text
formatDerivativeName(component, months, priceArea)
```

P0040 changed the display names to public-market-style synthetic Nordic power terminology:

```text
Nordic Electricity Base Load Future <period type> <period>
Nordic Electricity EPAD <price area> <period type> <period>
```

Examples:

```text
Nordic Electricity Base Load Future Month 2027-01
Nordic Electricity EPAD SE3 Month 2027-01
Nordic Electricity Base Load Future Quarter 2027-Q1
Nordic Electricity Base Load Future Year 2027
```

The naming is synthetic and intentionally avoids real exchange product codes. The terminology follows public Nordic power concepts such as base load futures and EPAD area-differential contracts.

P0045 rebalance calloffs receive explicit names at calloff time, for example:

```text
Baseloads Rebalance Month 2027-01 STO
```

This name is used directly for the generated rebalance rows instead of deriving only from component plus period.

## Known PoC Limitations

- Missing calendar data causes a clear calculation error.
- The list is computed from the in-memory database at render time.
