# Classic Projection Price Rules

## Rule

Peaks.Classic projected prices preserve canonical total value while presenting Peak and Offpeak customer rows.

## Canonical Prices

For each month:

```text
base_price = base.sys.price + base.epad.price
peak_premium_price = peak.premium.sys.price + peak.premium.epad.price
```

If a price component is missing, the available part is used and a warning is shown.

## Canonical Value

```text
base_value = base_mwh * base_price
peak_premium_mwh = peak_premium_mw * peak_h
peak_premium_value = peak_premium_mwh * peak_premium_price
total_value = base_value + peak_premium_value
```

`allocation.peak` has no value because price is `0` and q-factor is `0`.

## Projected Prices

Offpeak anchors to base price:

```text
legacy_offpeak_price = base_price
```

Peak receives the residual value:

```text
legacy_peak_price =
  (total_value - legacy_offpeak_mwh * legacy_offpeak_price)
  / legacy_peak_mwh
```

This preserves:

```text
legacy_offpeak_mwh * legacy_offpeak_price
+ legacy_peak_mwh * legacy_peak_price
= total_value
```

Negative peak premium is valid and can make projected peak price lower than base price.

Projected legacy prices are presentation prices. They are not original market transaction prices.
