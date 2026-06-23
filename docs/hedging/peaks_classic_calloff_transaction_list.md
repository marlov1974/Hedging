# Peaks.Classic Calloff Transaction List

## Purpose

`Calloff Transaction List` is the Classic Feature Set customer projection for Peaks.Classic portfolios.

It presents canonical Peaks calloffs as Offpeak and Peak customer rows at calloff resolution.

## Inputs

The list uses the shared canonical Peaks projection engine and reads:

```text
base.sys
base.epad
peak.sys
peak.epad
allocation.peak.sys
allocation.peak.epad
```

Compatibility aliases are read only when older fixture rows remain.

## Projection

For each month:

```text
ClassicOffpeakMW = (B * H - A * Hp) / Ho
ClassicPeakMW = A
ClassicOffpeakPrice = CanonicalBasePrice
ClassicPeakPrice = residual price preserving CanonicalTotalValue
```

`allocation.peak.sys` and `allocation.peak.epad` drive the customer Peak level but are not displayed as their own rows.

## Columns

```text
Date
OffpeakMW
PeakMW
OffpeakPrice
PeakPrice
```

The implementation also keeps compact metadata columns for calloff id, period and warnings.

## Aggregation

Single-month calloffs show one row.

Multi-month calloffs show one calloff-level row. Monthly values are projected first, then aggregated with hour-weighted MW and value-weighted prices.

## Raw Data

Raw canonical rows remain visible in Data Viewer. The customer-facing list hides allocation rows and internal adjustment rows.
