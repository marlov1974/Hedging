# Modern Projected Calloffs

`Modern Projected Calloffs` is a Data Viewer table that aggregates Modern projected transactions to calloff-level rows.

Core columns:

```text
calloff_id
date
period_start
period_end
base_mwh
peak_mwh
base_price
peak_price
base_value
peak_value
total_value
```

## Aggregation

The calloff view sums MWh and values across all projected months in the calloff period.

Physical volume is carried by the sys dimension:

```text
base_mwh = sum(modern.base.sys.mwh)
peak_mwh = sum(modern.peak.sys.mwh)
```

Sys and epad values are combined:

```text
base_value = sum(modern.base.sys.value + modern.base.epad.value)
peak_value = sum(modern.peak.sys.value + modern.peak.epad.value)
total_value = base_value + peak_value
```

Prices are value-weighted:

```text
base_price = base_value / base_mwh
peak_price = peak_value / peak_mwh
```

The projection warns if sys and epad MWh diverge for base or peak.
