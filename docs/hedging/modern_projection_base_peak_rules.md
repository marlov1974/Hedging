# Modern Projection Base Peak Rules

## Purpose

Peaks.Modern presents customer calloffs as a Base layer and a Peak layer above Base.

The Modern list is a customer projection from canonical component transactions, not a raw component table.

## MW Projection

Modern can use MW internally. Modern Base is the offpeak level applied across the full month.

Modern Peak is the extra effect above Modern Base during peak hours.

```text
ModernBaseMW = ClassicOffpeakMW
ModernPeakMW = ClassicPeakMW - ModernBaseMW
```

Equivalent formula when the canonical relation `A = B + P` holds:

```text
ModernBaseMW = B - P * Hp / Ho
ModernPeakMW = P * H / Ho
```

Important:

```text
ModernBaseMW != base.sys.mw
ModernPeakMW != peak.sys.mw
```

They are projected customer MW values.

`ModernPeakMW` may be negative.

## Customer MWh Projection

The Modern customer list displays MWh:

```text
ModernBaseMWh = ModernBaseMW * H
ModernPeakMWh = ModernPeakMW * Hp
```

`ModernPeakMWh` may be negative.

## Price Projection

Modern Base is anchored to canonical base price:

```text
ModernBasePrice = CanonicalBasePrice
```

Modern Peak is residual and value-preserving:

```text
ModernPeakPrice =
  (CanonicalTotalValue - ModernBaseMWh * ModernBasePrice)
  / ModernPeakMWh
```

If `ModernPeakMWh` is zero, `ModernPeakPrice` is blank and a warning is shown.

If `ModernPeakMWh` is negative, the same residual formula is used.

## Display

The customer list shows:

```text
Date
BaseMWh
PeakMWh
BasePrice
PeakPrice
```

Optional metadata columns may include calloff id, period and warnings. Allocation rows and adjustment rows are not shown directly.
