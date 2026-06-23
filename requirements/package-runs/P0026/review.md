# P0026 Review

## Classification

PASS

## Result

P0026 is consistent with the current repository after P0025. The feature can be implemented as a narrow Classic Feature Set projection over canonical component transactions.

## Key Assumption

`Peaks.Classic` seed data should use the same canonical component model as Peaks.Modern for this package:

```text
allocation.peak
base.sys
base.epad
peak.premium.sys
peak.premium.epad
```

The package distinction is then feature/projection behavior: Peaks.Classic gets `Legacy Calloff List`; Peaks.Modern keeps Forecast and Hedge Forecast.

## Scope Boundary

- Implement a projected customer-facing list for Peaks.Classic only.
- Keep Data Viewer raw canonical rows unchanged.
- Do not change Modern Projection behavior.
- Do not build a purchase flow for Peaks.Classic.
