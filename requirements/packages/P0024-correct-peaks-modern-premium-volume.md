# P0024 - Correct PeaksModern premium volume

## Purpose

Correct the PeaksModern forecast hedge calculation so `peak.modern` transactions represent premium/shape volume above the flat base level, not the full peak-hour consumption.

This is a coding package.

## Context

P0022 added a PeaksModern feature where the user can hedge a percentage of forecast.

That implementation may currently create `peak.modern.sys` and `peak.modern.epad` transactions using the full forecast peak consumption:

```text
full_peak_mwh = forecast_mwh * peak_pct * hedge_pct
full_peak_mw = full_peak_mwh / peak_h
```

This package corrects the semantics.

## Correct model

For PeaksModern:

```text
base.sys / base.epad = total forecast hedge
peak.modern.sys / peak.modern.epad = premium/shape volume above flat base level
```

The peak modern component should not buy the base power again. Base components already carry the total monthly hedge volume.

## Definitions

For each month:

```text
F = forecast_mwh
p = peak_pct
h = hedge_pct
H = total_h
Hp = peak_h
```

## Correct formulas

Base hedge:

```text
base_mwh = F * h
base_mw = base_mwh / H
```

Forecast peak consumption, used only as an intermediate value:

```text
full_peak_mwh = F * p * h
```

Base energy already present in peak hours:

```text
base_in_peak_mwh = base_mw * Hp
```

Correct modern peak premium volume:

```text
modern_peak_mwh = full_peak_mwh - base_in_peak_mwh
```

Equivalent compact formula:

```text
modern_peak_mwh = F * h * (p - Hp / H)
```

Correct modern peak MW:

```text
modern_peak_mw = modern_peak_mwh / Hp
```

## Negative modern peak

`modern_peak_mwh` and `modern_peak_mw` may be negative.

This is valid and means the customer has lower peak effect than a flat profile would imply.

Do not reject negative `modern_peak_mwh` or negative `modern_peak_mw`.

Still reject negative base hedge volume.

## Transaction behavior

When accepting a PeaksModern forecast hedge profile, create transactions for:

```text
base.sys
base.epad
peak.modern.sys
peak.modern.epad
```

Transaction MW values:

```text
base.sys/base.epad transaction.mw = base_mw
peak.modern.sys/peak.modern.epad transaction.mw = modern_peak_mw
```

Q-factor should still be read from QFactorValue for each product component and month.

## UI behavior

The generated hedge profile should expose the corrected values clearly.

Recommended columns:

```text
Month
Forecast MWh
Peak %
Hedge %
Base MWh
Base MW
Modern Peak MWh
Modern Peak MW
```

If the current UI has a simpler table, at minimum ensure the displayed peak-modern value is the corrected premium/shape volume and not full peak consumption.

Negative modern peak should be visible and not silently floored to zero.

## Legacy conversion note

A later legacy calloff list can reconstruct legacy offpeak/peak values from:

```text
base_mwh
modern_peak_mw
calendar total_h
calendar peak_h
offpeak_h
```

For reference:

```text
classic_base_mwh = base_mwh - modern_peak_mw * peak_h
classic_base_mw = classic_base_mwh / total_h
legacy_offpeak_mw = classic_base_mw
legacy_peak_mw = classic_base_mw + modern_peak_mw
legacy_offpeak_mwh = legacy_offpeak_mw * offpeak_h
legacy_peak_mwh = legacy_peak_mw * peak_h
```

Do not implement the full legacy list in this package unless it already exists and needs a small correction.

## Tests

Add or update tests for:

1. base_mwh equals forecast_mwh * hedge_pct,
2. base_mw equals base_mwh / total_h,
3. full peak consumption is not used as peak.modern transaction MW,
4. modern_peak_mwh equals forecast_mwh * hedge_pct * (peak_pct - peak_h / total_h),
5. modern_peak_mw equals modern_peak_mwh / peak_h,
6. peak.modern transactions use modern_peak_mw,
7. base transactions use base_mw,
8. negative modern_peak_mwh is allowed,
9. negative modern_peak_mw is allowed,
10. flat profile where peak_pct = peak_h / total_h gives modern_peak_mwh = 0,
11. accepting a one-month profile creates four transactions for PeaksModern,
12. accepting a three-month profile creates twelve transactions for PeaksModern,
13. q_factor is still read for all four components.

## Numeric example for tests

Use this example in at least one test:

```text
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.50
total_h = 744
peak_h = 320
```

Expected:

```text
base_mwh = 100
base_mw = 100 / 744
full_peak_mwh = 50
base_in_peak_mwh = (100 / 744) * 320
modern_peak_mwh = 100 * (0.50 - 320 / 744)
modern_peak_mw = modern_peak_mwh / 320
```

Also test negative case:

```text
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.35
total_h = 744
peak_h = 320
```

Expected modern_peak_mwh is negative.

## Documentation

Create or update:

```text
docs/hedging/peaks_modern_forecast_hedge.md
docs/hedging/peaks_modern_volume_semantics.md
```

Document:

```text
base carries total forecast hedge
peak.modern carries premium/shape volume above flat base
why full peak consumption must not be stored as peak.modern transaction MW
formula for modern_peak_mwh
negative modern peak interpretation
known PoC limitations
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files changed,
- formula corrected,
- tests added or updated,
- negative peak behavior,
- transaction count for one and three months,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
