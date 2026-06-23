# Classic Projection Price Rules

## Rule

Peaks.Classic projected prices preserve canonical total value while presenting Peak and Offpeak customer rows.

## Canonical Prices

For each month:

```text
base_price = base.sys.price + base.epad.price
peak_price = peak.sys.price + peak.epad.price
```

If a price component is missing, the available part is used and a warning is shown.

## Canonical Value

```text
base_value = base_mwh * base_price
peak_mwh = peak_mw * peak_h
peak_value = peak_mwh * peak_price
total_value = base_value + peak_value
```

`allocation.peak.sys` and `allocation.peak.epad` have no value because price is `0` and q-factor is `0`. They normally carry the same MW and must not be summed as physical customer volume.

## Projected Prices

Offpeak anchors to base price:

```text
ClassicOffpeakPrice = CanonicalBasePrice
```

Peak receives the residual value:

```text
ClassicPeakPrice =
  (CanonicalTotalValue - ClassicOffpeakMWh * ClassicOffpeakPrice)
  / ClassicPeakMWh
```

This preserves:

```text
ClassicOffpeakMWh * ClassicOffpeakPrice
+ ClassicPeakMWh * ClassicPeakPrice
= CanonicalTotalValue
```

Negative peak MW is valid and can make projected peak price lower than base price.

Projected Classic prices are presentation prices. They are not original market transaction prices.
