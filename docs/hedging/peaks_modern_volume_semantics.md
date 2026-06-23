# Peaks.Modern Volume Semantics

## Purpose

Peaks.Modern separates total monthly hedge volume from the peak component above or below a flat base profile.

## Base Components

The base components carry the total forecast hedge:

```text
base_mwh = forecast_mwh * hedge_pct
base_mw = base_mwh / total_h
```

The same base MW is stored on:

```text
base.sys
base.epad
```

## Allocation Peak

`allocation.peak.sys` and `allocation.peak.epad` store the customer's forecast peak-hour effect in MW.

```text
allocation_peak_mw = forecast_mwh * hedge_pct * peak_pct / peak_h
```

Both rows normally carry the same MW. They have price `0`, q-factor `0`, and are excluded from market projection. They must not be summed as physical customer volume.

## Peak Components

The `peak` components carry only the peak MW above or below the flat base level. They must not store full peak-hour consumption, because base already carries the total monthly hedge.

```text
peak_mw = allocation_peak_mw - base_mw
peak_mwh = peak_mw * peak_h
```

The same peak MW is stored on:

```text
peak.sys
peak.epad
```

## Negative Peak

`peak_mwh` and `peak_mw` may be negative.

A negative value means the forecast peak share is lower than the flat base share implied by the calendar. The value is kept as-is in the PoC instead of being floored to zero.

## Transaction Count

Accepting a Peaks.Modern forecast hedge creates six transactions per month:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Each transaction still reads its own q-factor from the selected portfolio product component and month.

## Known PoC Limitations

- The profile is still edited as one monthly Base MWh value.
- Price preview is not part of this volume semantics package.
- Legacy offpeak/peak reconstruction is not implemented here.
