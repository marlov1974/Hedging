# P0036 - Peaks.Classic Forecast and Hedge Forecast

## Purpose

Implement the Classic perspective for the `Forecast` and `Hedge Forecast` features.

Classic means the user works in Peak/Offpeak terms.

The feature must read from and write to the canonical model. Do not create a separate persisted Classic model.

This is a coding package.

## Background

P0035 moved perspective selection inside each feature.

This package fills the Classic perspective for:

```text
Forecast
Hedge Forecast
```

P0033 defined the Modern forecast and hedge flow in modern.base/modern.peak terms.

This package defines the corresponding Classic flow in:

```text
classic.offpeak
classic.peak
```

or customer-facing labels:

```text
Offpeak
Peak
```

## Source of truth

The canonical model remains the only source of truth.

Canonical Peaks rows:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Do not persist projected `classic.*` rows as source-of-truth transactions.

Classic forecast and hedge forecast must convert to/from canonical rows.

## Classic customer semantics

Classic perspective represents the customer's forecast and hedge in physical Peak/Offpeak terms:

```text
classic.offpeak = average offpeak level / offpeak energy
classic.peak = average peak level / peak energy
```

Customer-facing fields should use:

```text
Offpeak MWh
Peak MWh
```

Optional helper fields may include:

```text
Total MWh
Offpeak MW
Peak MW
Peak %
Warnings
```

But the primary editable Classic fields should be:

```text
classic.offpeak_mwh
classic.peak_mwh
```

## Calendar variables

For each month:

```text
H  = total_h
Hp = peak_h
Ho = offpeak_h
```

If `Hp = 0` or `Ho = 0`, block save/accept and show validation error.

## Convert Classic UI values to canonical model

When the user creates or edits a Classic forecast/hedge row using:

```text
classic.offpeak_mwh
classic.peak_mwh
```

convert to canonical model as follows.

### Step 1: Classic MW values

```text
classic_offpeak_mw = classic.offpeak_mwh / Ho
classic_peak_mw = classic.peak_mwh / Hp
```

### Step 2: total MWh and canonical base

```text
total_mwh = classic.offpeak_mwh + classic.peak_mwh
canonical_base_mw = total_mwh / H
```

### Step 3: allocation peak MW

```text
allocation_peak_mw = classic_peak_mw
```

### Step 4: canonical peak MW

```text
canonical_peak_mw = allocation_peak_mw - canonical_base_mw
```

### Step 5: write canonical rows

Write canonical rows:

```text
allocation.peak.sys.mw  = allocation_peak_mw
allocation.peak.epad.mw = allocation_peak_mw
base.sys.mw             = canonical_base_mw
base.epad.mw            = canonical_base_mw
peak.sys.mw             = canonical_peak_mw
peak.epad.mw            = canonical_peak_mw
```

Allocation rows:

```text
price = 0
q_factor = 0
category = allocation
```

`canonical_peak_mw` may be positive, zero or negative.

Negative `classic.peak_mwh` should be rejected unless a later package explicitly supports it.

Negative `classic.offpeak_mwh` should be rejected.

## Convert canonical model to Classic UI values

When reading an existing canonical forecast/hedge/calloff, derive Classic values for display/editing.

Canonical inputs:

```text
B = effective canonical base MW
A = effective allocation peak MW
P = effective canonical peak MW
H = total_h
Hp = peak_h
Ho = offpeak_h
```

Preferred derivation from `B` and `A`:

```text
total_mwh = B * H
classic_peak_mwh = A * Hp
classic_offpeak_mwh = total_mwh - classic_peak_mwh
classic_peak_mw = A
classic_offpeak_mw = classic_offpeak_mwh / Ho
```

If the canonical relation `A = B + P` does not hold within tolerance, show a warning and still derive Classic display values from `B` and `A`.

If `Ho = 0`, show validation/read warning and avoid division by zero.

## Forecast feature - Classic perspective

Inside the existing Forecast feature, add/fill the Classic perspective tab/selector from P0035.

Customer-facing table should use rows by month.

Required editable fields:

```text
month
classic.offpeak_mwh
classic.peak_mwh
```

Recommended display columns:

```text
month
Offpeak MWh
Peak MWh
Total MWh
```

Optional internal/helper columns:

```text
Offpeak MW
Peak MW
Peak %
Warnings
```

Saving edits must write/update canonical forecast/canonical rows through the conversion rules above.

Do not treat `forecast_mwh` and `peak_pct` as the primary Classic edit model, although they may be derived for compatibility/debug:

```text
forecast_mwh = classic.offpeak_mwh + classic.peak_mwh
peak_pct = classic.peak_mwh / forecast_mwh
```

If `forecast_mwh = 0`, `peak_pct` should be blank/null and not cause division by zero.

## Hedge Forecast feature - Classic perspective

Inside the existing Hedge Forecast feature, add/fill the Classic perspective tab/selector from P0035.

Customer-facing generated proposal should use:

```text
classic.offpeak_mwh
classic.peak_mwh
```

When user enters hedge percentage `h`, scale both Classic values:

```text
hedge_classic_offpeak_mwh = forecast_classic_offpeak_mwh * h
hedge_classic_peak_mwh = forecast_classic_peak_mwh * h
```

The user may edit these generated values before accepting.

Acceptance must write canonical transaction rows using the conversion rules above.

Do not persist projected `classic.*` rows as source of truth.

## Component price behavior on Hedge Forecast acceptance

Hedge Forecast acceptance should continue to create priced canonical base/peak rows using existing price lookup logic.

Canonical rows created:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Allocation rows must have price 0 and q_factor 0.

Base and peak rows should use existing price/q-factor logic.

Do not create `classic.offpeak.*` or `classic.peak.*` persisted rows unless explicitly derived/materialized and marked as non-source-of-truth.

## Worked example

Calendar:

```text
H = 744
Hp = 320
Ho = 424
```

User enters Classic forecast:

```text
classic.offpeak_mwh = 50
classic.peak_mwh = 50
```

Classic MW:

```text
classic_offpeak_mw = 50 / 424 = 0.1179245283
classic_peak_mw = 50 / 320 = 0.15625
```

Canonical base:

```text
total_mwh = 50 + 50 = 100
canonical_base_mw = 100 / 744 = 0.1344086022
```

Canonical allocation peak:

```text
allocation_peak_mw = 0.15625
```

Canonical peak:

```text
canonical_peak_mw = 0.15625 - 0.1344086022 = 0.0218413978
```

Rows to write:

```text
allocation.peak.sys  mw = 0.15625
allocation.peak.epad mw = 0.15625
base.sys             mw = 0.1344086022
base.epad            mw = 0.1344086022
peak.sys             mw = 0.0218413978
peak.epad            mw = 0.0218413978
```

Reading those canonical rows back must reproduce:

```text
classic.offpeak_mwh ≈ 50
classic.peak_mwh ≈ 50
```

## Negative canonical peak example

Classic forecast:

```text
classic.offpeak_mwh = 65
classic.peak_mwh = 35
```

Calendar:

```text
H = 744
Hp = 320
Ho = 424
```

Classic MW:

```text
classic_offpeak_mw = 65 / 424 = 0.1533018868
classic_peak_mw = 35 / 320 = 0.109375
```

Canonical base:

```text
canonical_base_mw = 100 / 744 = 0.1344086022
```

Canonical peak:

```text
canonical_peak_mw = 0.109375 - 0.1344086022 = -0.0250336022
```

This is valid. The customer entered non-negative Classic offpeak/peak MWh, but the canonical peak component is negative because the customer is peak-light compared with flat base.

## UI label requirements

Use customer-facing labels:

```text
Offpeak MWh
Peak MWh
Total MWh
```

Avoid primary Classic labels such as:

```text
forecast_mwh
peak_pct
canonical base
canonical peak
allocation peak
```

Those values may appear only in debug/internal views.

## Documentation

Create or update:

```text
docs/hedging/peaks_classic_forecast_feature.md
docs/hedging/peaks_classic_hedge_forecast_flow.md
docs/hedging/classic_to_canonical_conversion.md
```

Document:

- Forecast and Hedge Forecast Classic are customer-facing Classic Projection flows,
- users edit Offpeak/Peak MWh,
- canonical model remains source of truth,
- conversion Classic -> canonical,
- conversion canonical -> Classic,
- negative canonical peak behavior,
- acceptance writes canonical rows only.

## Tests

Add or update tests for:

1. Forecast has Classic perspective tab/selector,
2. Hedge Forecast has Classic perspective tab/selector,
3. Classic Forecast displays editable Offpeak MWh and Peak MWh,
4. primary Classic Forecast UI does not use forecast_mwh/peak_pct as the main edit model,
5. editing Offpeak/Peak MWh converts to canonical rows correctly,
6. canonical rows convert back to same Offpeak/Peak MWh within tolerance,
7. Hedge Forecast Classic proposal uses Offpeak/Peak MWh,
8. Hedge Forecast percentage scales both Offpeak MWh and Peak MWh,
9. accepting Hedge Forecast writes canonical rows only,
10. no persisted transaction uses `classic.offpeak.*` or `classic.peak.*` as source-of-truth component codes,
11. negative customer Offpeak MWh is rejected,
12. negative customer Peak MWh is rejected,
13. negative canonical peak component is allowed when classic peak is lower than flat base,
14. zero H/Hp/Ho does not divide by zero,
15. worked example writes expected canonical rows,
16. reading expected canonical rows reproduces worked example Classic values,
17. P0029/P0030 Classic Calloff List still displays projected MWh values after canonical write.

## Non-goals

Do not change:

- canonical component vocabulary,
- Modern feature set,
- Baseloads feature set,
- Market projection,
- settlement,
- Profiles projections.

This package only implements Classic Forecast and Classic Hedge Forecast flows.

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
- Forecast Classic UI fields after change,
- Hedge Forecast Classic proposal fields after change,
- Classic -> canonical conversion result for worked example,
- canonical -> Classic roundtrip result,
- negative canonical peak behavior,
- tests run and result,
- `REPOSITORY_FILES.md` status.
