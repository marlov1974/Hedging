# Projection MWh And Price Rules

## Purpose

Peaks customer transaction lists are projections from the canonical component model.

The canonical model stores component transactions. Customer lists must not display those component rows directly.

## Canonical Inputs

For each calloff month, the projection reads:

```text
base.sys
base.epad
peak.sys
peak.epad
allocation.peak.sys
allocation.peak.epad
```

Effective projection volumes are:

```text
B = effective canonical base MW
P = effective canonical peak MW
A = effective allocation peak MW
```

Normal canonical relation:

```text
A = B + P
```

If the relation is not true within tolerance, the projection warns and uses `B` and `A` as the primary customer projection inputs.

If `sys` and `epad` MW differ for a dimension, the projection warns and uses `sys` as the effective volume carrier.

## Calendar Inputs

```text
H  = total_h
Hp = peak_h
Ho = offpeak_h
```

The projection does not divide by zero. Missing or zero denominators produce blank values and warnings.

## Canonical Prices And Values

```text
CanonicalBasePrice = base.sys.price + base.epad.price
CanonicalPeakPrice = peak.sys.price + peak.epad.price

CanonicalBaseMWh = B * H
CanonicalPeakMWh = P * Hp
CanonicalBaseValue = CanonicalBaseMWh * CanonicalBasePrice
CanonicalPeakValue = CanonicalPeakMWh * CanonicalPeakPrice
CanonicalTotalValue = CanonicalBaseValue + CanonicalPeakValue
```

`P` and `CanonicalPeakMWh` may be negative.

## Physical Customer Volumes

```text
TotalMWh = B * H
PeakMWh = A * Hp
OffpeakMWh = TotalMWh - PeakMWh
```

These volumes are the bridge from canonical component rows to customer-facing Classic and Modern projections.

## Customer Display Volumes

Customer-facing calloff transaction lists display MWh, not MW.

Classic displayed volumes:

```text
ClassicOffpeakMWh = OffpeakMWh
ClassicPeakMWh = A * Hp
```

Modern still uses projected MW internally:

```text
ModernBaseMW = ClassicOffpeakMWh / Ho
ModernPeakMW = A - ModernBaseMW
```

Modern displayed volumes:

```text
ModernBaseMWh = ModernBaseMW * H
ModernPeakMWh = ModernPeakMW * Hp
```

Negative `ModernPeakMWh` is valid.

## Value Preservation

Both Classic and Modern projected rows must preserve canonical total value:

```text
ProjectedTotalValue = CanonicalTotalValue
```

Residual projected prices are used when the displayed customer row structure differs from the canonical component structure.

## Multi-Month Calloffs

Single-month calloffs show one row.

Multi-month calloffs still show one calloff-level row. Monthly projections are calculated first, then MWh and values are summed.

Customer MWh values are not converted back to MW for display. Prices are weighted by projected MWh and value. Arithmetic averaging is not used.
