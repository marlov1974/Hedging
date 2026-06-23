# Classic Projection Peak Offpeak Rules

## Purpose

Peaks.Classic presents customer calloffs as Offpeak and Peak levels.

The Classic list is a customer projection from canonical component transactions, not a raw component table.

## MW Projection

Classic uses the physical customer peak level directly from allocation:

```text
ClassicOffpeakMW = (B * H - A * Hp) / Ho
ClassicPeakMW = A
```

Where:

```text
B  = effective canonical base MW
A  = effective allocation peak MW
H  = total_h
Hp = peak_h
Ho = offpeak_h
```

Allocation rows are not displayed as customer rows.

## Price Projection

Classic Offpeak is anchored to canonical base price:

```text
ClassicOffpeakPrice = CanonicalBasePrice
```

Classic Peak is residual and value-preserving:

```text
ClassicPeakPrice =
  (CanonicalTotalValue - ClassicOffpeakMWh * ClassicOffpeakPrice)
  / ClassicPeakMWh
```

If `ClassicPeakMWh` is zero, `ClassicPeakPrice` is blank and a warning is shown.

## Display

The customer list shows:

```text
Date
OffpeakMW
PeakMW
OffpeakPrice
PeakPrice
```

Optional metadata columns may include calloff id, period and warnings. Raw canonical component codes are not shown as customer rows.
