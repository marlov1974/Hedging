# Modern Projected Transactions

`Modern Projected Transactions` is a Data Viewer table that projects canonical Peaks calloff transactions into Modern component rows.

Core columns:

```text
calloff_id
month
component
mw
price
```

Optional debug columns:

```text
value
source_components
warnings
```

## Projection Inputs

For each month and dimension, the projection reads:

```text
base.<dimension>
allocation.peak.<dimension>
peak.<dimension>
calendar.total_h
calendar.peak_h
```

The dimensions are `sys` and `epad`.

## Formula

For each dimension:

```text
offpeak_h = total_h - peak_h
modern_base_mw = (base_mw * total_h - allocation_peak_mw * peak_h) / offpeak_h
modern_peak_mw = allocation_peak_mw - modern_base_mw
modern_base_mwh = modern_base_mw * total_h
modern_peak_mwh = modern_peak_mw * peak_h
```

Modern peak MW and MWh may be negative.

## Price Rules

Modern base price is the canonical base price for the dimension.

Modern peak price is residual:

```text
canonical_value = base_mw * total_h * base_price + peak_mw * peak_h * peak_price
modern_base_value = modern_base_mwh * modern_base_price
modern_peak_price = (canonical_value - modern_base_value) / modern_peak_mwh
```

If a denominator is zero, the row is emitted with `mw = null`, `price = null`, and a warning instead of throwing.
