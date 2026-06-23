# Peaks.Modern Calloff Transaction List

## Purpose

`Calloff Transaction List` is the Modern Feature Set customer projection for Peaks.Modern portfolios.

It presents canonical Peaks calloffs as Base and Peak customer rows at calloff resolution.

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
ModernBaseMW = ClassicOffpeakMW
ModernPeakMW = ClassicPeakMW - ModernBaseMW
ModernBasePrice = CanonicalBasePrice
ModernPeakPrice = residual price preserving CanonicalTotalValue
```

Modern Base and Peak are projected customer MW values:

```text
ModernBaseMW is not base.sys.mw
ModernPeakMW is not peak.sys.mw
```

Negative `ModernPeakMW` is valid.

## Columns

```text
Date
BaseMW
PeakMW
BasePrice
PeakPrice
```

The implementation also keeps compact metadata columns for calloff id, period and warnings.

## Aggregation

Single-month calloffs show one row.

Multi-month calloffs show one calloff-level row. Monthly values are projected first, then aggregated with hour-weighted MW and value-weighted prices.

## Raw Data

Raw canonical rows remain visible in Data Viewer. The customer-facing list hides allocation rows and internal adjustment rows.
