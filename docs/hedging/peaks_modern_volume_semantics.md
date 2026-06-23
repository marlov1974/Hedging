# PeaksModern Volume Semantics

## Purpose

PeaksModern separates total monthly hedge volume from the premium/shape volume above a flat base profile.

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

## Modern Peak Components

The `peak.modern` components carry only the premium/shape volume above the flat base level. They must not store full peak-hour consumption, because base already carries the total monthly hedge.

```text
modern_peak_mwh = forecast_mwh * hedge_pct * (peak_pct - peak_h / total_h)
modern_peak_mw = modern_peak_mwh / peak_h
```

The same modern peak MW is stored on:

```text
peak.modern.sys
peak.modern.epad
```

## Negative Modern Peak

`modern_peak_mwh` and `modern_peak_mw` may be negative.

A negative value means the forecast peak share is lower than the flat base share implied by the calendar. The value is kept as-is in the PoC instead of being floored to zero.

## Transaction Count

Accepting a PeaksModern forecast hedge creates four transactions per month:

```text
base.sys
base.epad
peak.modern.sys
peak.modern.epad
```

Each transaction still reads its own q-factor from the selected portfolio product component and month.

## Known PoC Limitations

- The profile is still edited as one monthly Base MWh value.
- Price preview is not part of this volume semantics package.
- Legacy offpeak/peak reconstruction is not implemented here.
