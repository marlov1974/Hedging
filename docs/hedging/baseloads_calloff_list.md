# Baseloads calloff list

P0017 adds a Baseloads calloff list feature inside the hedging tool shell.

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
Datum
Derivatnamn
Component
MWh
Pris
```

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

It renders as two table rows:

```text
one base.sys row
one base.epad row
```

## MWh Aggregation

For Baseloads, monthly MW is converted to MWh with total monthly hours:

```text
MWh = sum(transaction.mw * calendar.total_h)
```

Baseloads uses total hours because its components cover all hours.

## Weighted Average Price

Transactions do not store price yet. P0017 therefore uses linked `PriceComponent` values.

Formula:

```text
weighted_price = sum(mwh_i * price_i) / sum(mwh_i)
```

## Market-Style Derivative Naming

The deterministic helper is:

```text
formatDerivativeName(component, months, priceArea)
```

It uses this documented PoC convention:

```text
<price area> <component> <period>
```

Examples:

```text
SE3 base.sys Jan-27
SE3 base.sys Q1-27
SE3 base.sys YR-27
```

This is market-style naming, not a claim to exact public exchange naming. The helper isolates the formatting so it can be replaced later.

## Known PoC Limitations

- Missing calendar data causes a clear calculation error.
- Transaction-level prices are not stored yet.
- The list is computed from the in-memory database at render time.
