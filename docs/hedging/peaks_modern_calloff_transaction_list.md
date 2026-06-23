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

For each month, MW can be calculated internally:

```text
ModernBaseMW = ClassicOffpeakMW
ModernPeakMW = ClassicPeakMW - ModernBaseMW
```

The customer list displays MWh:

```text
ModernBaseMWh = ModernBaseMW * total_h
ModernPeakMWh = ModernPeakMW * peak_h
ModernBasePrice = CanonicalBasePrice
ModernPeakPrice = residual price preserving CanonicalTotalValue
```

Modern Base and Peak are projected customer MWh values. Internal MW is only calculation support:

```text
ModernBaseMWh is not base.sys.mw
ModernPeakMWh is not peak.sys.mw
```

Negative `ModernPeakMWh` is valid.

## Columns

```text
Date
BaseMWh
PeakMWh
BasePrice
PeakPrice
```

The implementation also keeps compact metadata columns for calloff id, period and warnings.

## Aggregation

Single-month calloffs show one row.

Multi-month calloffs show one calloff-level row. Monthly values are projected first, then MWh is summed and prices are value-weighted.

## Raw Data

Raw canonical rows remain visible in Data Viewer. The customer-facing list hides allocation rows and internal adjustment rows.
