# Peaks.Modern Calloff Transaction List

## Purpose

`Calloff Transaction List` is the Modern Feature Set customer projection for Peaks.Modern portfolios.

It presents canonical Peaks calloffs as Base and Peak customer rows at calloff resolution.

## Inputs

The list uses Modern projected model rows produced from the shared canonical Peaks projection engine. The projected model reads:

```text
base.sys
base.epad
peak.sys
peak.epad
allocation.peak.sys
allocation.peak.epad
```

Compatibility aliases are read only when older fixture rows remain.

The customer-facing calloff list aggregates Modern projected model rows; it should not duplicate the Modern projection formulas locally.

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

## P0042 Currency Display

Rows expose EUR value, display currency, display value, FX rate and coverage percentage. For SEK portfolios, the matching `currency.eursek` transaction supplies the display FX rate. Missing or partial coverage is shown as a warning.
