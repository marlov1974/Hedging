# Peaks.Classic Calloff Transaction List

## Purpose

`Calloff Transaction List` is the Classic Feature Set customer projection for Peaks.Classic portfolios.

It presents canonical Peaks calloffs as Offpeak and Peak customer rows at calloff resolution.

## Inputs

The list uses Classic projected model rows produced from the shared canonical Peaks projection engine. The projected model reads:

```text
base.sys
base.epad
peak.sys
peak.epad
allocation.peak.sys
allocation.peak.epad
```

Compatibility aliases are read only when older fixture rows remain.

The customer-facing calloff list aggregates Classic projected model rows; it should not duplicate the Classic projection formulas locally.

## Projection

For each month, MW can be calculated internally:

```text
ClassicOffpeakMW = (B * H - A * Hp) / Ho
ClassicPeakMW = A
```

The customer list displays MWh:

```text
ClassicOffpeakMWh = B * H - A * Hp
ClassicPeakMWh = A * Hp
ClassicOffpeakPrice = CanonicalBasePrice
ClassicPeakPrice = residual price preserving CanonicalTotalValue
```

`allocation.peak.sys` and `allocation.peak.epad` drive the customer Peak level but are not displayed as their own rows.

## Columns

```text
Date
OffpeakMWh
PeakMWh
OffpeakPrice
PeakPrice
```

The implementation also keeps compact metadata columns for calloff id, period and warnings.

## Aggregation

Single-month calloffs show one row.

Multi-month calloffs show one calloff-level row. Monthly values are projected first, then MWh is summed and prices are value-weighted.

## Raw Data

Raw canonical rows remain visible in Data Viewer. The customer-facing list hides allocation rows and internal adjustment rows.

## P0042 Currency Display

Rows expose EUR value, display currency, display value, FX rate and coverage percentage. For SEK portfolios, the matching `currency.eursek` transaction supplies the display FX rate. Missing or partial coverage is shown as a warning.
