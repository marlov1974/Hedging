# Position report

P0018 added a monthly position report to the hedging tool shell. P0040 makes it a customer-facing monthly report instead of a raw component dump.
P0044 adds `event` and `event_detail` source rows for forecasts and purchase mirrors; existing Position Report rows still consume projected transaction model rows.
P0045 compresses the Baseloads view into one effective monthly hedge row.
P0050 makes the Baseloads view read market leg `market.base.<area>` event details when they are available, with transaction rows kept as a compatibility fallback.
P0053 makes Modern reports prefer Modern customer canonical event details and Classic reports prefer a projection from those Modern customer canonical details.
P0054 documents the remaining compatibility surface in [Legacy Compatibility](legacy_compatibility.md).

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

Baseloads rows are grouped by month and projected into one report row. When market leg rows exist, reportable volume is the signed market base quantity from `market.base.<area>` event details, hedge value is the signed market base value, and price is derived last. When market leg rows do not exist, the compatibility fallback uses transaction rows: reportable volume is the signed `base.sys` volume, hedge value includes signed base and peak component value, and peak volume is not counted as reportable Baseloads volume.

Baseloads effective price is calculated last:

```text
reportable_base_volume = sum(signed market base quantity)
hedge_value = sum(signed market base quantity * market base price)
effective_month_hedge_price = hedge_value / reportable_base_volume
```

Compatibility transaction fallback:

```text
reportable_base_volume = sum(signed base.sys volume)
hedge_value = sum(signed base volume * base price) + sum(signed peak volume * peak price)
effective_month_hedge_price = hedge_value / reportable_base_volume
```

Modern rows are aggregated from Modern customer canonical event details when they exist:

```text
CUSTOMER modern.base / modern.peak -> Modern Position Report
```

Classic rows are projected from the same Modern customer canonical details:

```text
CUSTOMER modern.base / modern.peak -> Classic offpeak / peak projection -> Classic Position Report
```

The older shared Classic/Modern projected model rows remain as compatibility fallback when no Modern customer canonical event details exist.

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

Before P0053, Position Report consumed projected model rows:

```text
Classic projected model rows -> Classic Position Report
Modern projected model rows  -> Modern Position Report
```

Currency rows remain `currency.eursek` in the projected model input. They are used for SEK display and coverage, but are not counted as MW or MWh.

## P0053 Target-Model Read Sources

The target source order is:

```text
Modern report    -> Modern customer canonical event details
Classic report   -> Classic projection from Modern customer canonical event details
Baseloads report -> Market basis event details
Settlement       -> Market basis event details
```

Compatibility projected model rows remain available for older seed data and tests that do not yet write two-legged event details.
