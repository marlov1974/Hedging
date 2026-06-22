# Position report

P0018 adds a monthly position report to the hedging tool shell.

## Purpose

The report shows positions for the selected portfolio in monthly resolution by component.

## Year Selection

The UI provides a year dropdown. In the current PoC, years come from seeded calendar years and any transaction years for the selected portfolio.

The seeded range is:

```text
2027
2028
2029
```

If the selected year has no positions, the UI shows an empty state.

## Columns

The report table shows:

```text
Månad
Volym
Pris
Component
```

## Aggregation

Rows are grouped by:

```text
portfolio_id
month
component
```

The current implementation derives the selected portfolio from the calloff that owns each transaction.

## MWh Calculation

For this PoC:

```text
Volym = sum(transaction.mw * calendar.total_h)
```

Total monthly hours are used for Baseloads/base components.

## Weighted Average Price

Transactions do not store price yet, so the deterministic source is linked `PriceComponent`.

Formula:

```text
Pris = sum(mwh_i * price_i) / sum(mwh_i)
```

If price data is missing, the calculation raises a clear missing-price error rather than silently using zero.

## Known PoC Limitations

- Transaction-level prices are not stored yet.
- Component-specific hour rules are not implemented yet.
- The report is calculated from the in-memory database at render time.
