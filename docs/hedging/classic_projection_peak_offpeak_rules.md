# Classic Projection Peak Offpeak Rules

For projected Classic names and canonical component-code rules, see [Component Catalog](component_catalog.md).

## Purpose

Peaks.Classic presents customer calloffs as Offpeak and Peak levels.

The Classic list is a customer projection from canonical component transactions, not a raw component table.

P0043 treats Classic as an explicit projected model layer:

```text
canonical rows -> Classic projected model -> Classic reports/views
```

Classic Calloff List and Classic Position Report consume Classic projected model rows. If a report needs additional fields, add them to the projected model contract rather than recalculating directly from raw canonical rows.

## MW Projection

Classic can use MW internally. It uses the physical customer peak level directly from allocation:

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

## Customer MWh Projection

The Classic customer list displays MWh:

```text
ClassicPeakMWh = A * Hp
ClassicOffpeakMWh = B * H - ClassicPeakMWh
```

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
OffpeakMWh
PeakMWh
OffpeakPrice
PeakPrice
```

Optional metadata columns may include calloff id, period and warnings. Raw canonical component codes are not shown as customer rows.
