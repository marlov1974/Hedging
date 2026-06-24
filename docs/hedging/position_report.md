# Position report

P0018 added a monthly position report to the hedging tool shell. P0040 makes it a customer-facing monthly report instead of a raw component dump.
P0044 adds `event` and `event_detail` source rows for forecasts and purchase mirrors; existing Position Report rows still consume projected transaction model rows.
P0045 compresses the Baseloads view into one effective monthly hedge row.

## Purpose

The report shows one row per month for the selected portfolio and perspective.

The supported perspectives are:

```text
Baseloads
Classic
Modern
```

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

Baseloads columns:

```text
Month
Reportable Base MWh
Hedge Value
Effective Hedge Price
Rows
```

Classic columns:

```text
Month
Offpeak MWh
Peak EPAD MWh
Offpeak Price
Peak Price
```

Modern columns:

```text
Month
Base MWh
Peak EPAD MWh
Base Price
Peak Price
```

The normal report view does not show raw canonical component rows such as `allocation.peak.sys`.

Currency rows such as `currency.eursek` are not summed as MW or MWh in the normal Position Report. See [Currency Component Model](currency_component_model.md).

## Aggregation

Baseloads rows are grouped by month and projected into one report row. Reportable volume is the signed `base.sys` volume. Hedge value includes signed base and peak component value. Peak volume is not counted as reportable Baseloads volume.

Baseloads effective price is calculated last:

```text
reportable_base_volume = sum(signed base.sys volume)
hedge_value = sum(signed base volume * base price) + sum(signed peak volume * peak price)
effective_month_hedge_price = hedge_value / reportable_base_volume
```

Classic and Modern rows are aggregated from the shared Classic/Modern projected model rows. This keeps Position Report aligned with Calloff List projection semantics and avoids a separate raw-canonical reinterpretation inside the report.

## MWh Calculation

For this PoC:

```text
MWh = sum(transaction.mw * calendar hours for the relevant dimension)
```

Total monthly hours are used for Baseloads/base components. Peak-hour dimensions use the existing Peaks projection helpers.

## Weighted Average Price

Transactions do not store price yet, so the deterministic source is linked `PriceComponent`.

Formula:

```text
Pris = sum(mwh_i * price_i) / sum(mwh_i)
```

If price data is missing, the calculation raises a clear missing-price error rather than silently using zero.

## Known PoC Limitations

- Transaction-level prices are not stored yet.
- The report is calculated from the in-memory database at render time.
- Classic/Modern `Peak EPAD MWh` is a customer-facing area-dimension report field derived from the projected peak MWh level.

## P0042 Currency Display

Classic and Modern rows keep EUR power value fields and add display currency fields. For SEK portfolios, matching `currency.eursek` rows supply FX rate and coverage. Missing or partial coverage is shown as report warnings instead of being treated as fully covered.

## P0043 Projected Model Input

Position Report consumes projected model rows:

```text
Classic projected model rows -> Classic Position Report
Modern projected model rows  -> Modern Position Report
```

Currency rows remain `currency.eursek` in the projected model input. They are used for SEK display and coverage, but are not counted as MW or MWh.
